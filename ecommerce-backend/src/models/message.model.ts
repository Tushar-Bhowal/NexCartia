import mongoose from "mongoose";
import validator from "validator";

const messageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      trim: true,
      validate: [validator.isEmail, "Please enter a valid email"],
    },
    message: {
      type: String,
      required: [true, "Please enter a message"],
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, "Please enter a valid email"],
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
export const Subscriber = mongoose.model("Subscriber", subscriberSchema);
