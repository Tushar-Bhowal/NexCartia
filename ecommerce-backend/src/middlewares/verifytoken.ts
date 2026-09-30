import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/utility-class.js";

// Extend the Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

interface JwtPayload {
  userId: string;
}

export const readUserId = (req: Request): string | undefined => {
  const token = req.cookies?.token;
  if (!token) return undefined;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    return decoded.userId;
  } catch {
    return undefined;
  }
};

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const userId = readUserId(req);
  if (!userId) return next(new ErrorHandler("Please login first", 401));

  req.userId = userId;
  next();
};
