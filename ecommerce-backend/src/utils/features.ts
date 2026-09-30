import mongoose from "mongoose";
import { createHash } from "crypto";
import { CartLineType, InvalidateCacheProps } from "../types/types.js";
import { myCache } from "../app.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { UploadApiResponse,  v2 as cloudinary } from "cloudinary";

export const connectDB = (uri: string) => {
  mongoose
    .connect(uri, {
      dbName: "Ecomerce24",
    })
    .then((c) => console.log(`DB Connected to ${c.connection.host}`))
    .catch((e) => console.log(e));
};

export const invalidateCache = ({
  product,
  order,
  admin,
  userId,
  orderId,
  productId,
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "all-products",
    ];

    if (typeof productId === "string") productKeys.push(`product-${productId}`);

    if (typeof productId === "object")
      productId.forEach((i) => productKeys.push(`product-${i}`));

    myCache.del(productKeys);
  }
  if (order) {
    const ordersKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];

    myCache.del(ordersKeys);
  }
  if (admin) {
    myCache.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ]);
  }
};

export const reduceStock = async (orderItems: CartLineType[]) => {
  await Promise.all(
    orderItems.map((item) =>
      Product.updateOne(
        { _id: item.productId },
        [
          {
            $set: {
              stock: { $max: [0, { $subtract: ["$stock", item.quantity] }] },
            },
          },
        ],
        { updatePipeline: true }
      )
    )
  );
};

export const calculateOrderTotals = (subtotal: number, discount: number) => {
  const tax = Math.round(subtotal * 0.18);
  const shippingCharges = subtotal > 1000 ? 0 : 200;
  const appliedDiscount = Math.min(discount, subtotal + tax + shippingCharges);
  const total = subtotal + tax + shippingCharges - appliedDiscount;
  return { subtotal, tax, shippingCharges, discount: appliedDiscount, total };
};

// Fingerprint of what was paid for, stored on the Stripe PaymentIntent so an
// order can't be placed for a different cart than the one that was charged.
export const hashCart = (items: CartLineType[], coupon?: string) => {
  const lines = items
    .map((i) => `${i.productId}:${i.size ?? ""}:${i.quantity}`)
    .sort()
    .join(",");
  return createHash("sha256").update(`${lines}|${coupon || ""}`).digest("hex");
};

export const isValidCart = (items: unknown): items is CartLineType[] =>
  Array.isArray(items) &&
  items.length > 0 &&
  items.length <= 50 &&
  items.every(
    (i) =>
      typeof i?.productId === "string" &&
      mongoose.isValidObjectId(i.productId) &&
      (i.size === undefined || (typeof i.size === "string" && i.size.length <= 10)) &&
      Number.isInteger(i.quantity) &&
      i.quantity > 0
  ) &&
  // the same product may appear once per size
  new Set(items.map((i) => `${i.productId}|${i.size ?? ""}`)).size === items.length;

export const updateProductRating = async (productId: string) => {
  const [stats] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Product.updateOne(
    { _id: productId },
    {
      ratings: stats ? Math.round(stats.avg * 10) / 10 : 0,
      numOfReviews: stats?.count ?? 0,
    }
  );
};

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;
  const percent = (thisMonth / lastMonth) * 100;
  return Number(percent.toFixed(0));
};
export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category })
  );

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCount) * 100),
    });
  });

  return categoryCount;
};
interface MyDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
  [key: string]: any; // Allow additional properties
}

// Modify the type definition to be more flexible
type FuncProps = {
  length: number;
  docArr: Array<MyDocument | any>; // Allow more flexible array type
  today: Date;
  property?: "discount" | "total" | string;
};
export const getMonthDiff = (today: Date, date: Date) =>
  (today.getFullYear() - date.getFullYear()) * 12 +
  today.getMonth() -
  date.getMonth();

export const getChartData = ({
  length,
  docArr,
  today,
  property,
}: FuncProps) => {
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = getMonthDiff(today, creationDate);

    if (monthDiff < length) {
      if (property) {
        data[length - monthDiff - 1] += i[property]!;
      } else {
        data[length - monthDiff - 1] += 1;
      }
    }
  });

  return data;
};

const getBase64 = (file: Express.Multer.File) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const uploadToCloudinary = async (files: Express.Multer.File[]) => {
  const promises = files.map(async (file) => {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload(getBase64(file), (error, result) => {
        if (error) return reject(error);
        resolve(result!);
      });
    });
  });

  const result = await Promise.all(promises);

  return result.map((i) => ({
    public_id: i.public_id,
    url: i.secure_url,
  }));
};

export const deleteFromCloudinary = async (publicIds: string[]) => {
  const promises = publicIds.map((id) => {
    return new Promise<void>((resolve, reject) => {
      cloudinary.uploader.destroy(id, (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  });

  await Promise.all(promises);
};