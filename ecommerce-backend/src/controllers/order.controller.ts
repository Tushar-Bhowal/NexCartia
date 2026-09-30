import Stripe from "stripe";
import { NewOrderRequestBody } from "../types/types.js";
import {
  hashCart,
  invalidateCache,
  isValidCart,
  reduceStock,
} from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "../middlewares/error.js";
import { Request } from "express";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { myCache, stripe } from "../app.js";

export const myOrders = TryCatch(async (req, res, next) => {
  const user = req.userId;

  const key = `my-orders-${user}`;

  let orders = [];

  if (myCache.has(key)) orders = JSON.parse(myCache.get(key) as string);
  else {
    orders = await Order.find({ user }).sort({ createdAt: -1 });
    myCache.set(key, JSON.stringify(orders));
  }
  return res.status(200).json({
    success: true,
    orders,
  });
});

export const allOrders = TryCatch(async (req, res, next) => {
  const key = `all-orders`;

  let orders = [];

  if (myCache.has(key)) orders = JSON.parse(myCache.get(key) as string);
  else {
    orders = await Order.find().sort({ createdAt: -1 }).populate("user", "name");
    myCache.set(key, JSON.stringify(orders));
  }
  return res.status(200).json({
    success: true,
    orders,
  });
});

export const getSingleOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const key = `order-${id}`;

  let order;

  if (myCache.has(key)) order = JSON.parse(myCache.get(key) as string);
  else {
    order = await Order.findById(id).populate("user", "name");

    if (!order) return next(new ErrorHandler("Order Not Found", 404));

    myCache.set(key, JSON.stringify(order));
  }

  if (order.user?._id !== req.userId) {
    const viewer = await User.findById(req.userId).select("role");
    if (viewer?.role !== "admin")
      return next(new ErrorHandler("Order Not Found", 404));
  }

  return res.status(200).json({
    success: true,
    order,
  });
});

const describePaymentMethod = (paymentIntent: Stripe.PaymentIntent) => {
  const method = paymentIntent.payment_method;
  if (!method || typeof method === "string" || !method.card) return "Card";
  const brand = method.card.brand;
  return `${brand.charAt(0).toUpperCase()}${brand.slice(1)} ending in ${method.card.last4}`;
};

export const newOrder = TryCatch(
  async (req: Request<{}, {}, NewOrderRequestBody>, res, next) => {
    const { paymentIntentId, items, coupon } = req.body;

    if (typeof paymentIntentId !== "string" || !paymentIntentId)
      return next(new ErrorHandler("Payment reference is missing", 400));

    if (!isValidCart(items))
      return next(new ErrorHandler("Please send valid items", 400));

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["payment_method"],
    });
    const { metadata } = paymentIntent;

    if (metadata.userId !== req.userId)
      return next(new ErrorHandler("Payment does not belong to this user", 403));

    if (paymentIntent.status !== "succeeded")
      return next(new ErrorHandler("Payment has not been completed", 400));

    if (metadata.cartHash !== hashCart(items, coupon))
      return next(
        new ErrorHandler("Cart does not match the completed payment", 400)
      );

    const paymentMethod = describePaymentMethod(paymentIntent);

    // Retrying after a network error must not create a second order
    const existingOrder = await Order.findOne({ paymentIntentId });
    if (existingOrder)
      return res.status(200).json({
        success: true,
        message: "Order Placed Successfully",
        order: {
          _id: existingOrder._id,
          total: existingOrder.total,
          createdAt: existingOrder.createdAt,
          paymentMethod,
        },
      });

    const products = await Product.find({
      _id: { $in: items.map((i) => i.productId) },
    });

    const orderItems = items.map((item) => {
      const product = products.find((p) => String(p._id) === item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        name: product?.name ?? "Unavailable product",
        photo: product?.photos[0]?.url ?? "",
        price: product?.price ?? 0,
      };
    });

    const address = paymentIntent.shipping?.address;

    const order = await Order.create({
      shippingInfo: {
        address: address?.line1 ?? "",
        city: address?.city ?? "",
        state: address?.state ?? "",
        country: address?.country ?? "",
        pinCode: address?.postal_code ?? "",
      },
      orderItems,
      user: req.userId,
      paymentIntentId,
      subtotal: Number(metadata.subtotal),
      tax: Number(metadata.tax),
      shippingCharges: Number(metadata.shippingCharges),
      discount: Number(metadata.discount),
      total: Number(metadata.total),
    });

    await reduceStock(items);

    invalidateCache({
      product: true,
      order: true,
      admin: true,
      userId: req.userId,
      productId: items.map((i) => i.productId),
    });

    return res.status(201).json({
      success: true,
      message: "Order Placed Successfully",
      order: {
        _id: order._id,
        total: order.total,
        createdAt: order.createdAt,
        paymentMethod,
      },
    });
  }
);

export const processOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Order Not Found", 404));

  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    default:
      order.status = "Delivered";
      break;
  }

  await order.save();

  invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: "Order Processed Successfully",
  });
});

export const deleteOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) return next(new ErrorHandler("Order Not Found", 404));

  await order.deleteOne();

  invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: "Order Deleted Successfully",
  });
});
