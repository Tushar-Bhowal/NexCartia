import mongoose from "mongoose";
import { TryCatch } from "../middlewares/error.js";
import { readUserId } from "../middlewares/verifytoken.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { User } from "../models/user.model.js";
import { invalidateCache, updateProductRating } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";

const hasPurchased = (userId: string, productId: string) =>
  Order.exists({ user: userId, "orderItems.productId": productId });

export const getProductReviews = TryCatch(async (req, res, next) => {
  const productId = req.params.id as string;
  if (!mongoose.isValidObjectId(productId))
    return next(new ErrorHandler("Invalid ID", 400));

  const [reviews, distribution] = await Promise.all([
    Review.find({ product: productId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("user", "name photo"),
    Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]),
  ]);

  // Optional login: tells the page whether to show the review form
  const userId = readUserId(req);
  const myReview = userId
    ? await Review.findOne({ product: productId, user: userId })
    : null;
  const canReview = userId ? !!(await hasPurchased(userId, productId)) : false;

  return res.status(200).json({
    success: true,
    reviews,
    distribution: Object.fromEntries(
      [5, 4, 3, 2, 1].map((r) => [
        r,
        distribution.find((d) => d._id === r)?.count ?? 0,
      ])
    ),
    myReview,
    canReview,
  });
});

export const upsertReview = TryCatch(async (req, res, next) => {
  const productId = req.params.id as string;
  const { rating, comment } = req.body ?? {};

  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return next(new ErrorHandler("Please choose a rating from 1 to 5 stars", 400));

  if (comment !== undefined && (typeof comment !== "string" || comment.length > 1000))
    return next(new ErrorHandler("Review can be at most 1000 characters", 400));

  if (!(await Product.exists({ _id: productId })))
    return next(new ErrorHandler("Product Not Found", 404));

  if (!(await hasPurchased(req.userId!, productId)))
    return next(
      new ErrorHandler("Only customers who bought this product can review it", 403)
    );

  const existing = await Review.findOneAndUpdate(
    { product: productId, user: req.userId },
    { rating, comment: comment?.trim() ?? "" },
    { upsert: true, setDefaultsOnInsert: true }
  );

  await updateProductRating(productId);
  invalidateCache({ product: true, productId });

  return res.status(existing ? 200 : 201).json({
    success: true,
    message: existing ? "Review updated" : "Thanks for your review!",
  });
});

export const deleteReview = TryCatch(async (req, res, next) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) return next(new ErrorHandler("Review Not Found", 404));

  if (review.user !== req.userId) {
    const viewer = await User.findById(req.userId).select("role");
    if (viewer?.role !== "admin")
      return next(new ErrorHandler("You can only delete your own review", 403));
  }

  await review.deleteOne();

  const productId = String(review.product);
  await updateProductRating(productId);
  invalidateCache({ product: true, productId });

  return res.status(200).json({
    success: true,
    message: "Review deleted",
  });
});
