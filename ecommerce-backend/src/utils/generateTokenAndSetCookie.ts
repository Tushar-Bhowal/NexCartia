import { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";

// sameSite "none" + secure because the frontend and API live on different domains
export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
};

export const generateTokenAndSetCookie = (
  res: Response,
  userId: string
): string => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in the environment variables");
  }

  const token = jwt.sign({ userId }, jwtSecret, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    ...authCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};
