import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../types/types.js";
import { Product } from "../models/product.model.js";
import ErrorHandler from "../utils/utility-class.js";
import { myCache } from "../app.js";
import {
  deleteFromCloudinary,
  invalidateCache,
  uploadToCloudinary,
} from "../utils/features.js";

interface PhotoInterface {
  public_id: string;
  url: string;
}

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const validateProductNumbers = (price: unknown, stock: unknown) => {
  if (price !== undefined && !(Number(price) > 0))
    return "Price must be greater than 0";
  if (
    stock !== undefined &&
    (!Number.isInteger(Number(stock)) || Number(stock) < 0)
  )
    return "Stock must be a whole number of 0 or more";
  return null;
};

const isGender = (gender: unknown) => gender === "male" || gender === "female";

// Revalidate on New,Update,Delete Product & on New Order
export const getlatestProducts = TryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("latest-products"))
    products = JSON.parse(myCache.get("latest-products") as string);
  else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
    myCache.set("latest-products", JSON.stringify(products));
  }
  return res.status(200).json({
    success: true,
    products,
  });
});
// Revalidate on New,Update,Delete Product & on New Order
export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;

  if (myCache.has("categories"))
    categories = JSON.parse(myCache.get("categories") as string);
  else {
    categories = await Product.distinct("category");
    myCache.set("categories", JSON.stringify(categories));
  }

  return res.status(200).json({
    success: true,
    categories,
  });
});
// Revalidate on New,Update,Delete Product & on New Order
export const getAdminProducts = TryCatch(async (req, res, next) => {
  let products;
  if (myCache.has("all-products"))
    products = JSON.parse(myCache.get("all-products") as string);
  else {
    products = await Product.find({});
    myCache.set("all-products", JSON.stringify(products));
  }

  return res.status(200).json({
    success: true,
    products,
  });
});
export const getSingleProduct = TryCatch(async (req, res, next) => {
  let product;
  const id = req.params.id;
  if (myCache.has(`product-${id}`))
    product = JSON.parse(myCache.get(`product-${id}`) as string);
  else {
    product = await Product.findById(id);

    if (!product) return next(new ErrorHandler("Product Not Found", 404));

    myCache.set(`product-${id}`, JSON.stringify(product));
  }

  return res.status(200).json({
    success: true,
    product,
  });
});

export const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { name, price, stock, category, gender } = req.body;
    const photos = req.files as Express.Multer.File[] | undefined;

    if (!photos) return next(new ErrorHandler("Please add Photo", 400));

    if (photos.length < 1)
      return next(new ErrorHandler("Please add atleast one Photo", 400));

    if (photos.length > 5)
      return next(new ErrorHandler("You can only upload 5 Photos", 400));

    if (!name || !price || stock === undefined || stock === "" || !category || !gender)
      return next(new ErrorHandler("Please enter All Fields", 400));

    const numberError = validateProductNumbers(price, stock);
    if (numberError) return next(new ErrorHandler(numberError, 400));

    if (!isGender(gender))
      return next(new ErrorHandler("Please select a valid gender", 400));

    const photosURL = await uploadToCloudinary(photos);

    await Product.create({
      name,
      price: Number(price),
      gender,
      stock: Number(stock),
      category: category.trim().toLowerCase(),
      photos: photosURL,
    });

    invalidateCache({ product: true, admin: true });

    return res.status(201).json({
      success: true,
      message: "Product Created Successfully",
    });
  }
);

export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, price, stock, category, gender } = req.body;
  const photos = req.files as Express.Multer.File[] | undefined;

  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  const numberError = validateProductNumbers(
    price === "" ? undefined : price,
    stock === "" ? undefined : stock
  );
  if (numberError) return next(new ErrorHandler(numberError, 400));

  if (gender && !isGender(gender))
    return next(new ErrorHandler("Please select a valid gender", 400));

  if (photos && photos.length > 0) {
    // Upload new photos
    const photosURL = await uploadToCloudinary(photos);

    // Remove existing photos from Cloudinary
    const ids = product.photos.map((photo) => photo.public_id);
    await deleteFromCloudinary(ids);

    // Clear existing photos and add new ones
    product.photos.splice(0, product.photos.length);

    // Add new photos using Mongoose's DocumentArray methods
    photosURL.forEach((photoData) => {
      product.photos.push({
        public_id: photoData.public_id,
        url: photoData.url,
      } as PhotoInterface);
    });
  }

  if (name) product.name = name;
  if (price) product.price = Number(price);
  if (stock !== undefined && stock !== "") product.stock = Number(stock);
  if (category) product.category = category.trim().toLowerCase();
  if (gender) product.gender = gender;

  await product.save();

  invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res.status(200).json({
    success: true,
    message: "Product Updated Successfully",
  });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product Not Found", 404));

  const ids = product.photos.map((photo) => photo.public_id);

  await deleteFromCloudinary(ids);

  await product.deleteOne();

  invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res.status(200).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;

    const baseQuery: BaseQuery = {};

    if (typeof search === "string" && search)
      baseQuery.name = {
        $regex: escapeRegex(search),
        $options: "i",
      };

    if (price && Number(price) > 0)
      baseQuery.price = {
        $lte: Number(price),
      };

    if (typeof category === "string" && category) baseQuery.category = category;

    const productsPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, filteredCount] = await Promise.all([
      productsPromise,
      Product.countDocuments(baseQuery),
    ]);

    const totalPage = Math.ceil(filteredCount / limit);

    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);

export const getProductsFilter = TryCatch(async (req, res, next) => {
  const { gender, category } = req.query;

  if (!gender && !category) {
    return next(new ErrorHandler("Either gender or category is required", 400));
  }

  if ((gender && typeof gender !== "string") || (category && typeof category !== "string"))
    return next(new ErrorHandler("Invalid filter value", 400));

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
  const skip = (page - 1) * limit;

  // Determine the filter type and value
  const filterType = gender ? "gender" : "category";
  const filterValue = (gender || category) as string;

  const cacheKey = `products-${filterType}-${filterValue.toLowerCase()}-page-${page}`;

  // Check if result is in cache
  if (myCache.has(cacheKey)) {
    const cachedResult = JSON.parse(myCache.get(cacheKey) as string);
    return res.status(200).json(cachedResult);
  }

  // Construct base query
  const baseQuery: BaseQuery = gender
    ? { gender: filterValue.toLowerCase() as "male" | "female" }
    : { category: filterValue.toLowerCase() };

  const productsPromise = Product.find(baseQuery).limit(limit).skip(skip);

  const [products, filteredCount] = await Promise.all([
    productsPromise,
    Product.countDocuments(baseQuery),
  ]);

  const totalPage = Math.ceil(filteredCount / limit);

  const result = {
    success: true,
    products,
    totalPage,
  };

  // Cache the result
  myCache.set(cacheKey, JSON.stringify(result));

  return res.status(200).json(result);
});
