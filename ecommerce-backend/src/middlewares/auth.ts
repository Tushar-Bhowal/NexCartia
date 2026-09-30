import { User } from "../models/user.model.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";
import { readUserId } from "./verifytoken.js";

//Middlewear to check if the user is admin
export const adminOnly = TryCatch(async (req, res, next) => {
  const userId = readUserId(req);
  if (!userId)
    return next(new ErrorHandler("Login first to access this resource", 401));

  const user = await User.findById(userId).select("role");
  if (!user) return next(new ErrorHandler("Please login first", 401));
  if (user.role !== "admin")
    return next(
      new ErrorHandler(
        "You are not authorized to access this resource Only Admin can access",
        403
      )
    );

  req.userId = userId;
  next();
});
