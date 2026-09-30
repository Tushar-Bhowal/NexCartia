import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import { NewProductRequestBody } from "../types/types.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { COLORS, FITS, SIZES } from "../utils/catalog.js";
import {
  facetPipeline,
  parseProductQuery,
  shapeFacets,
} from "../utils/productSearch.js";
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

// Only fields present in the body are returned, so an update leaves the rest untouched.
// An empty fit/colour clears it.
const readCatalogFields = (body: Partial<NewProductRequestBody>) => {
  const fields: Record<string, unknown> = {};

  if (body.description !== undefined) {
    fields.description = String(body.description).trim();
    if ((fields.description as string).length > 2000)
      return { fields, error: "Description can be at most 2000 characters" };
  }
  if (body.material !== undefined) {
    fields.material = String(body.material).trim();
    if ((fields.material as string).length > 200)
      return { fields, error: "Material can be at most 200 characters" };
  }
  if (body.sizes !== undefined) {
    const sizes = [
      ...new Set(
        String(body.sizes)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      ),
    ];
    const unknown = sizes.find((s) => !SIZES.includes(s));
    if (unknown) return { fields, error: `Unknown size "${unknown}"` };
    fields.sizes = sizes;
  }
  if (body.fit !== undefined) {
    if (body.fit && !FITS.includes(body.fit)) return { fields, error: "Please select a valid fit" };
    fields.fit = body.fit || undefined;
  }
  if (body.color !== undefined) {
    if (body.color && !COLORS.includes(body.color))
      return { fields, error: "Please select a valid colour" };
    fields.color = body.color || undefined;
  }

  return { fields };
};

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

    const catalog = readCatalogFields(req.body);
    if (catalog.error) return next(new ErrorHandler(catalog.error, 400));

    const photosURL = await uploadToCloudinary(photos);

    await Product.create({
      ...catalog.fields,
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

  const catalog = readCatalogFields(req.body);
  if (catalog.error) return next(new ErrorHandler(catalog.error, 400));

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
  product.set(catalog.fields);

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
  await Review.deleteMany({ product: product._id });

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

export const getAllProducts = TryCatch(async (req, res, next) => {
  const { buildMatch, sort } = parseProductQuery(req.query);

  const requested = Math.floor(Number(req.query.page));
  const page = Number.isFinite(requested) ? Math.min(Math.max(1, requested), 10000) : 1;
  const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
  const match = buildMatch();

  const [products, total] = await Promise.all([
    Product.find(match)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(match),
  ]);

  return res.status(200).json({
    success: true,
    products,
    total,
    page,
    totalPage: Math.ceil(total / limit),
  });
});

export const getProductFacets = TryCatch(async (req, res, next) => {
  const { buildMatch } = parseProductQuery(req.query);
  const [raw] = await Product.aggregate(facetPipeline(buildMatch));

  return res.status(200).json({
    success: true,
    facets: shapeFacets(raw),
  });
});
