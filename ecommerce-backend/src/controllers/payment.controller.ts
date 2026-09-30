import { Request } from "express";
import { stripe } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { NewPaymentRequestBody } from "../types/types.js";
import {
  calculateOrderTotals,
  hashCart,
  isValidCart,
} from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";

const SHIPPING_FIELDS = ["address", "city", "state", "country", "pinCode"] as const;

export const createPaymentIntent = TryCatch(
  async (req: Request<{}, {}, NewPaymentRequestBody>, res, next) => {
    const user = await User.findById(req.userId).select("name");

    if (!user) return next(new ErrorHandler("Please login first", 401));

    const { items, shippingInfo, coupon } = req.body;

    if (!isValidCart(items))
      return next(new ErrorHandler("Please send valid items", 400));

    if (
      !shippingInfo ||
      SHIPPING_FIELDS.some(
        (field) =>
          typeof shippingInfo[field] !== "string" || !shippingInfo[field].trim()
      )
    )
      return next(new ErrorHandler("Please send complete shipping info", 400));

    if (!/^[A-Z]{2}$/.test(shippingInfo.country))
      return next(new ErrorHandler("Please select a valid country", 400));

    if (coupon !== undefined && typeof coupon !== "string")
      return next(new ErrorHandler("Invalid Coupon Code", 400));

    let discountAmount = 0;

    if (coupon) {
      const discount = await Coupon.findOne({ code: coupon });
      if (!discount) return next(new ErrorHandler("Invalid Coupon Code", 400));
      discountAmount = discount.amount;
    }

    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length)
      return next(
        new ErrorHandler("Some products in your cart are no longer available", 400)
      );

    let subtotal = 0;
    for (const product of products) {
      // stock is shared across sizes, so check the total quantity per product
      const lines = items.filter((i) => i.productId === String(product._id));
      const quantity = lines.reduce((sum, i) => sum + i.quantity, 0);

      for (const line of lines) {
        const size = line.size ?? "";
        if (product.sizes.length ? !product.sizes.includes(size) : size !== "")
          return next(
            new ErrorHandler(
              product.sizes.length
                ? `Please choose an available size for ${product.name}`
                : `${product.name} doesn't come in sizes`,
              400
            )
          );
      }

      if (quantity > product.stock)
        return next(
          new ErrorHandler(
            product.stock > 0
              ? `Only ${product.stock} left of ${product.name}`
              : `${product.name} is out of stock`,
            400
          )
        );
      subtotal += product.price * quantity;
    }

    const totals = calculateOrderTotals(subtotal, discountAmount);

    if (totals.total < 1)
      return next(new ErrorHandler("Order total is too low to pay by card", 400));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totals.total * 100,
      currency: "inr",
      payment_method_types: ["card"],
      description: "MERN-Ecommerce",
      shipping: {
        name: user.name,
        address: {
          line1: shippingInfo.address,
          postal_code: shippingInfo.pinCode,
          city: shippingInfo.city,
          state: shippingInfo.state,
          country: shippingInfo.country,
        },
      },
      metadata: {
        userId: String(user._id),
        cartHash: hashCart(items, coupon),
        subtotal: totals.subtotal,
        tax: totals.tax,
        shippingCharges: totals.shippingCharges,
        discount: totals.discount,
        total: totals.total,
      },
    });

    return res.status(201).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  }
);

export const newCoupon = TryCatch(async (req, res, next) => {
  const { coupon, amount } = req.body;

  if (typeof coupon !== "string" || !coupon.trim() || !amount)
    return next(new ErrorHandler("Please enter both coupon and amount", 400));

  const discount = Number(amount);
  if (!Number.isInteger(discount) || discount <= 0)
    return next(
      new ErrorHandler("Discount amount must be a positive whole number", 400)
    );

  await Coupon.create({ code: coupon.trim(), amount: discount });

  return res.status(201).json({
    success: true,
    message: `Coupon ${coupon.trim()} Created Successfully`,
  });
});
export const applyDiscount = TryCatch(async (req, res, next) => {
  const { coupon } = req.query;

  if (typeof coupon !== "string" || !coupon)
    return next(new ErrorHandler("Invalid Coupon Code", 400));

  const discount = await Coupon.findOne({ code: coupon });

  if (!discount) return next(new ErrorHandler("Invalid Coupon Code", 400));

  return res.status(200).json({
    success: true,
    discount: discount.amount,
  });
});

export const allCoupons = TryCatch(async (req, res, next) => {
  const coupons = await Coupon.find({});

  return res.status(200).json({
    success: true,
    coupons,
  });
});
export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) return next(new ErrorHandler("Invalid Coupon ID", 400));

  return res.status(200).json({
    success: true,
    message: `Coupon ${coupon.code} Deleted Successfully`,
  });
});
