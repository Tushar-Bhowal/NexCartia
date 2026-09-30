import mongoose from "mongoose";
import validator from "validator";

interface Iuser extends Document {
  _id: string;
  photo?: string;
  name: string;
  lastLogin: Date;
  email: string;
  password: string;
  role: "admin" | "user";
  gender: "male" | "female";
  dob: Date;
  createdAt: Date;
  updatedAt: Date;
  //   Virtual Attribute
  age: number;
}

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: [true, "Please enter ID"] },
    photo: { type: String, required: [false, "Please add photo"] },
    name: { type: String, required: [true, "Please enter name"] },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email already exists"],
      validate: validator.default.isEmail,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "Please enter gender"],
    },
    dob: { type: Date, required: [true, "Please enter date of birth"] },
  },

  { timestamps: true }
);

userSchema.virtual("age").get(function () {
  const today = new Date();
  const dob = this.dob;

  let age: number = today.getFullYear() - dob.getFullYear();
  if (
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() == dob.getMonth() && today.getDate() < dob.getDate())
  ) {
    age--;
  }
  return age;
});
export const User = mongoose.model<Iuser>("User", userSchema);
