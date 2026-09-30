import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: String, ref: "User", required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Please give a rating"],
      min: 1,
      max: 5,
    },
    comment: { type: String, trim: true, maxlength: 1000, default: "" },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);
