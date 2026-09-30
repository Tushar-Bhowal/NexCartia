import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/utility-class.js";
import { ControllerType } from "../types/types.js";

type AppError = Error & { statusCode?: number; code?: number | string };

export const errorMiddleware = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID";
  } else if (err.name === "ValidationError" || err.name === "MulterError") {
    statusCode = 400;
  } else if (err.code === 11000) {
    statusCode = 400;
    message = "A record with that value already exists";
  }

  if (statusCode >= 500 && !(err instanceof ErrorHandler)) {
    console.error(err);
    message = "Internal Server Error";
  }

  return res.status(statusCode).json({ success: false, message });
};

export const TryCatch = (func: ControllerType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(func(req, res, next)).catch(next);
  };
};
