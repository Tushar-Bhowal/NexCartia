import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  allMessages,
  allSubscribers,
  deleteMessage,
  deleteSubscriber,
  newMessage,
  subscribe,
} from "../controllers/message.controller.js";

const app = express.Router();

// route - /api/v1/message/contact
app.post("/contact", newMessage);

// route - /api/v1/message/subscribe
app.post("/subscribe", subscribe);

// route - /api/v1/message/all
app.get("/all", adminOnly, allMessages);

// route - /api/v1/message/subscribers
app.get("/subscribers", adminOnly, allSubscribers);

// route - /api/v1/message/subscribers/:id
app.delete("/subscribers/:id", adminOnly, deleteSubscriber);

// route - /api/v1/message/:id
app.delete("/:id", adminOnly, deleteMessage);

export default app;
