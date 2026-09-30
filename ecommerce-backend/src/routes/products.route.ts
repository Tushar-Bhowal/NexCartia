import express from "express";

import { adminOnly } from "../middlewares/auth.js";
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getProductFacets,
  getSingleProduct,
  getlatestProducts,
  newProduct,
  updateProduct,
} from "../controllers/product.controller.js";
import { mutliUpload } from "../middlewares/multer.js";
import { verifyToken } from "../middlewares/verifytoken.js";
import {
  deleteReview,
  getProductReviews,
  upsertReview,
} from "../controllers/review.controller.js";

const app = express.Router();
//To Create New Product  - /api/v1/product/new
app.post("/new", adminOnly, mutliUpload, newProduct);

//To get all Products with filters  - /api/v1/product/all
app.get("/all", getAllProducts);

//To get last 10 Products  - /api/v1/product/latest
app.get("/latest", getlatestProducts);

//To get all unique Categories  - /api/v1/product/categories
app.get("/categories", getAllCategories);

//Filter options with live counts for the search page  - /api/v1/product/facets
app.get("/facets", getProductFacets);

//To get all Products   - /api/v1/product/admin-products
app.get("/admin-products", adminOnly, getAdminProducts);

// Reviews - /api/v1/product/:id/reviews, /api/v1/product/review/:reviewId
app.get("/:id/reviews", getProductReviews);
app.post("/:id/review", verifyToken, upsertReview);
app.delete("/review/:reviewId", verifyToken, deleteReview);

// To get, update, delete Product
app
  .route("/:id")
  .get(getSingleProduct)
  .put(adminOnly, mutliUpload, updateProduct)
  .delete(adminOnly, deleteProduct);

export default app;
