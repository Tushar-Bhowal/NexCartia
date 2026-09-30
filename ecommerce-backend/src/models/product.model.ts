import mongoose from "mongoose";
import { COLORS, FITS, SIZES } from "../utils/catalog.js";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Please Enter Name"] },
    photos: [
      {
        public_id: {
          type: String,
          required: [true, "Please enter Public ID"],
        },
        url: {
          type: String,
          required: [true, "Please enter URL"],
        },
      },
    ],
    price: { type: Number, required: [true, "Please Enter the Price"] },
    stock: { type: Number, required: [true, "Please Enter the Stock"] },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "Please enter gender"],
    },
    category: {
      type: String,
      required: [true, "Please Enter Product Category"],
      trim: true,
    },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    material: { type: String, trim: true, maxlength: 200, default: "" },
    sizes: { type: [{ type: String, enum: SIZES }], default: [] },
    fit: { type: String, enum: FITS },
    color: { type: String, enum: COLORS },
    // denormalised from reviews so search can filter and sort on them
    ratings: { type: Number, default: 0, min: 0, max: 5 },
    numOfReviews: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
