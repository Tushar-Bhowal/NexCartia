import { Request, Response, NextFunction } from "express";
import { randomBytes, randomUUID } from "crypto";
import validator from "validator";
import { User } from "../models/user.model.js";
import { GoogleAuthRequestBody, NewUserRequestBody } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "../middlewares/error.js";
import bcryptjs from "bcryptjs";
import {
  authCookieOptions,
  generateTokenAndSetCookie,
} from "../utils/generateTokenAndSetCookie.js";
import { verifyFirebaseToken } from "../utils/verifyFirebaseToken.js";
import { Review } from "../models/review.model.js";
import { invalidateCache, updateProductRating } from "../utils/features.js";

const toSafeUser = (user: InstanceType<typeof User>) => {
  const { password, ...safeUser } = user.toObject();
  return safeUser;
};

const validateProfile = (gender: unknown, dob: unknown) => {
  if (gender !== "male" && gender !== "female")
    return "Please select a valid gender";
  const dobDate = new Date(dob as string);
  if (isNaN(dobDate.getTime()) || dobDate >= new Date())
    return "Please enter a valid date of birth";
  return null;
};

export const newUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, email, password, gender, dob } = req.body;

    if (!name || !email || !password || !gender || !dob)
      return next(new ErrorHandler("Please add all fields", 400));

    if (typeof email !== "string" || !validator.isEmail(email))
      return next(new ErrorHandler("Please enter a valid email", 400));

    if (typeof password !== "string" || password.length < 6)
      return next(
        new ErrorHandler("Password must be at least 6 characters", 400)
      );

    const profileError = validateProfile(gender, dob);
    if (profileError) return next(new ErrorHandler(profileError, 400));

    if (await User.exists({ email }))
      return next(
        new ErrorHandler("An account with this email already exists", 400)
      );

    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = await User.create({
      _id: randomUUID(),
      name,
      email,
      password: hashedPassword,
      gender,
      dob: new Date(dob),
    });

    generateTokenAndSetCookie(res, user._id);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: toSafeUser(user),
    });
  }
);

export const googleAuth = TryCatch(
  async (req: Request<{}, {}, GoogleAuthRequestBody>, res, next) => {
    const { idToken, gender, dob } = req.body;

    if (!idToken || typeof idToken !== "string")
      return next(new ErrorHandler("Google sign-in token is required", 400));

    const identity = await verifyFirebaseToken(idToken);

    let user = await User.findById(identity.uid);
    let message = `Welcome back, ${user?.name}`;

    if (!user) {
      if (await User.exists({ email: identity.email }))
        return next(
          new ErrorHandler(
            "An account with this email already exists. Sign in with your password.",
            400
          )
        );

      if (!gender || !dob)
        return next(
          new ErrorHandler(
            "No account found for that Google email. Switch to Sign Up and add your details to continue.",
            404
          )
        );

      const profileError = validateProfile(gender, dob);
      if (profileError) return next(new ErrorHandler(profileError, 400));

      // Google accounts never sign in with a password, so store an unguessable one
      const unusablePassword = await bcryptjs.hash(
        randomBytes(32).toString("hex"),
        10
      );

      user = await User.create({
        _id: identity.uid,
        name: identity.name || identity.email.split("@")[0],
        email: identity.email,
        photo: identity.picture,
        password: unusablePassword,
        gender,
        dob: new Date(dob),
      });
      message = "User created successfully";
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    generateTokenAndSetCookie(res, user._id);

    res.status(200).json({
      success: true,
      message,
      user: toSafeUser(user),
    });
  }
);

export const getAllUsers = TryCatch(async (req, res, next) => {
  const users = await User.find({});
  return res.status(200).json({
    success: true,
    message: "All users",
    users,
  });
});
export const getUser = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("Invalid Id", 400));
  return res.status(200).json({
    success: true,
    user,
  });
});
export const deleteUser = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  if (id === req.userId)
    return next(new ErrorHandler("You can't delete your own account", 400));

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("Invalid Id", 400));

  // Reviews go first so a failure can't leave orphaned reviews behind a deleted user
  const reviewedProducts = await Review.distinct("product", { user: user._id });
  await Review.deleteMany({ user: user._id });
  await user.deleteOne();

  if (reviewedProducts.length) {
    await Promise.all(reviewedProducts.map((p) => updateProductRating(String(p))));
    invalidateCache({ product: true, productId: reviewedProducts.map(String) });
  }

  return res.status(200).json({
    success: true,
    message: "User deleted Successfully",
  });
});
export const SignInUser = TryCatch(async (req, res, next) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || typeof password !== "string")
    return next(new ErrorHandler("Please enter email and password", 400));

  const user = await User.findOne({ email }).select("+password");

  // Older Google accounts stored their public Firebase uid (= _id) as the password
  if (!user || password === user._id)
    return next(new ErrorHandler("Invalid Email or Password", 401));

  const isPasswordValid = await bcryptjs.compare(password, user.password);

  if (!isPasswordValid)
    return next(new ErrorHandler("Invalid Email or Password", 401));

  generateTokenAndSetCookie(res, user._id);

  user.lastLogin = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    user: toSafeUser(user),
  });
});
export const logout = TryCatch(async (req, res, next) => {
  res.clearCookie("token", authCookieOptions);
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

export const checkAuth = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 401));
  }

  res.status(200).json({ success: true, user });
});
