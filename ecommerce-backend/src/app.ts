import express from "express";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import NodeCache from "node-cache";
import { config } from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import Stripe from "stripe";
import { v2 as cloudinary } from "cloudinary";

//importing routes
import userRoute from "./routes/user.route.js";
import productRoute from "./routes/products.route.js";
import orderRoute from "./routes/order.route.js";
import paymentRoute from "./routes/payment.route.js";
import dashboardRoute from "./routes/adminDashboard.route.js";
import messageRoute from "./routes/message.route.js";
import cors from "cors";

config({
  path: "./.env",
});

const port = process.env.PORT || 4000;
const mongoURI = process.env.MONGO_URI || "";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const ClientUrl = process.env.CLIENT_URL || "";

connectDB(mongoURI);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-05-27.dahlia",
});
export const myCache = new NodeCache();
const app = express();

app.use(express.json()); //allows us to parse incoming requests:req.body
app.use(cookieParser()); // allows us to parse incoming cookies
app.use(morgan("dev"));
app.use(
  cors({
    origin: ClientUrl,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"],
  })
);

app.get("/", (req, res) => {
  res.send("API working with /api/v1");
});

//using routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);
app.use("/api/v1/message", messageRoute);

// 404 fallback for any unmatched route (Express 5: use a path-less middleware)
app.use((req, res) => {
  res.status(404).send("404 URL NOT FOUND");
});

app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
