import { TryCatch } from "../middlewares/error.js";
import { Message, Subscriber } from "../models/message.model.js";
import ErrorHandler from "../utils/utility-class.js";

export const newMessage = TryCatch(async (req, res, next) => {
  const { name, email, message } = req.body;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !message.trim()
  )
    return next(new ErrorHandler("Please fill in all fields", 400));

  await Message.create({ name, email, message });

  return res.status(201).json({
    success: true,
    message: "Thanks for reaching out! We'll get back to you soon.",
  });
});

export const subscribe = TryCatch(async (req, res, next) => {
  const { email } = req.body;

  if (typeof email !== "string" || !email.trim())
    return next(new ErrorHandler("Please enter your email", 400));

  const normalized = email.trim().toLowerCase();

  if (!(await Subscriber.exists({ email: normalized })))
    await Subscriber.create({ email: normalized });

  return res.status(201).json({
    success: true,
    message: "You're subscribed to our newsletter!",
  });
});

export const allMessages = TryCatch(async (req, res, next) => {
  const messages = await Message.find({}).sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    messages,
  });
});

export const deleteMessage = TryCatch(async (req, res, next) => {
  const message = await Message.findByIdAndDelete(req.params.id);
  if (!message) return next(new ErrorHandler("Message Not Found", 404));

  return res.status(200).json({
    success: true,
    message: "Message Deleted Successfully",
  });
});

export const allSubscribers = TryCatch(async (req, res, next) => {
  const subscribers = await Subscriber.find({}).sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    subscribers,
  });
});

export const deleteSubscriber = TryCatch(async (req, res, next) => {
  const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
  if (!subscriber) return next(new ErrorHandler("Subscriber Not Found", 404));

  return res.status(200).json({
    success: true,
    message: "Subscriber Removed Successfully",
  });
});
