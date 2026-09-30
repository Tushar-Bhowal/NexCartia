import express from "express";

import { adminOnly } from "../middlewares/auth.js";
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getProductsFilter,
  getSingleProduct,
  getlatestProducts,
  newProduct,
  updateProduct,
} from "../controllers/product.controller.js";
import { mutliUpload } from "../middlewares/multer.js";

const app = express.Router();
//To Create New Product  - /api/v1/product/new
app.post("/new", adminOnly, mutliUpload, newProduct);

//To get all Products with filters  - /api/v1/product/all
app.get("/all", getAllProducts);

//To get last 10 Products  - /api/v1/product/latest
app.get("/latest", getlatestProducts);

//To get all unique Categories  - /api/v1/product/categories
app.get("/categories", getAllCategories);

//To get all gender filter products  - /api/v1/product/filter
app.get("/filter", getProductsFilter);

//To get all Products   - /api/v1/product/admin-products
app.get("/admin-products", adminOnly, getAdminProducts);

// To get, update, delete Product
app
  .route("/:id")
  .get(getSingleProduct)
  .put(adminOnly, mutliUpload, updateProduct)
  .delete(adminOnly, deleteProduct);

export default app;
