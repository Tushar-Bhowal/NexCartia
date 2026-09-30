import { config } from "dotenv";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import { randomBytes } from "crypto";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { User } from "../models/user.model.js";
import { seedComments, seedProducts, seedReviewers } from "./seedData.js";

config({ path: "./.env" });

// Everything the seed creates is recognisable by these markers, so --clear
// never touches real products or customers.
const PHOTO_PREFIX = "seed/";
const REVIEWER_EMAIL_DOMAIN = "@seed.nexcartia.dev";
const DAY = 24 * 60 * 60 * 1000;

const seededProductFilter = { "photos.public_id": { $regex: `^${PHOTO_PREFIX}` } };
const seededUserFilter = { email: { $regex: `${REVIEWER_EMAIL_DOMAIN.replace(/\./g, "\\.")}$` } };

const clear = async () => {
  const productIds = await Product.find(seededProductFilter).distinct("_id");
  const userIds = await User.find(seededUserFilter).distinct("_id");

  const reviews = await Review.deleteMany({
    $or: [{ product: { $in: productIds } }, { user: { $in: userIds } }],
  });
  const products = await Product.deleteMany({ _id: { $in: productIds } });
  const users = await User.deleteMany({ _id: { $in: userIds } });

  console.log(
    `Removed ${products.deletedCount} products, ${users.deletedCount} demo reviewers, ${reviews.deletedCount} reviews.`
  );
};

const seed = async () => {
  if (await Product.exists(seededProductFilter)) {
    console.log("Seed data is already present. Run `npm run seed:clear` first to reseed.");
    return;
  }

  const unusablePassword = await bcryptjs.hash(randomBytes(32).toString("hex"), 10);
  const reviewers = await User.insertMany(
    seedReviewers.map((r, i) => ({
      _id: `seed-reviewer-${i + 1}`,
      name: r.name,
      email: `${r.name.split(" ")[0].toLowerCase()}${REVIEWER_EMAIL_DOMAIN}`,
      password: unusablePassword,
      gender: r.gender,
      dob: new Date(1990 + i, i, 10 + i),
    }))
  );

  const now = Date.now();
  let reviewCount = 0;

  for (const [index, p] of seedProducts.entries()) {
    // Stagger creation dates so "Newest" sorting has a visible order
    const createdAt = new Date(now - index * 2 * DAY);
    const average = p.ratings.length
      ? Math.round((p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length) * 10) / 10
      : 0;

    const product = await Product.create({
      name: p.name,
      category: p.category,
      gender: p.gender,
      price: p.price,
      stock: p.stock,
      sizes: p.sizes,
      fit: p.fit,
      color: p.color,
      material: p.material,
      description: p.description,
      photos: p.photos.map((url, i) => ({ public_id: `${PHOTO_PREFIX}${p.key}-${i + 1}`, url })),
      ratings: average,
      numOfReviews: p.ratings.length,
      createdAt,
      updatedAt: createdAt,
    });

    await Review.insertMany(
      p.ratings.map((rating, i) => {
        const comments = seedComments[rating];
        return {
          product: product._id,
          user: reviewers[(index + i) % reviewers.length]._id,
          rating,
          comment: comments[(index + i) % comments.length],
          createdAt: new Date(createdAt.getTime() + (i + 1) * DAY),
        };
      })
    );
    reviewCount += p.ratings.length;
  }

  console.log(
    `Added ${seedProducts.length} products, ${reviewers.length} demo reviewers, ${reviewCount} reviews.`
  );
};

const main = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set in ecommerce-backend/.env");

  // same database name as connectDB in utils/features.ts
  const connection = await mongoose.connect(uri, { dbName: "Ecomerce24" });
  console.log(`Connected to ${connection.connection.host}/Ecomerce24`);

  try {
    if (process.argv.includes("--clear")) await clear();
    else await seed();
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
