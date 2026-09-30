import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { verifyToken } from "../middlewares/verifytoken.js";
import {
  allOrders,
  deleteOrder,
  getSingleOrder,
  myOrders,
  newOrder,
  processOrder,
} from "../controllers/order.controller.js";

const app = express.Router();

// route - /api/v1/order/new
app.post("/new", verifyToken, newOrder);

// route - /api/v1/order/my
app.get("/my", verifyToken, myOrders);

// route - /api/v1/order/all
app.get("/all", adminOnly, allOrders);

// route - /api/v1/order/dynamicID
app
  .route("/:id")
  .get(verifyToken, getSingleOrder)
  .put(adminOnly, processOrder)
  .delete(adminOnly, deleteOrder);

export default app;
