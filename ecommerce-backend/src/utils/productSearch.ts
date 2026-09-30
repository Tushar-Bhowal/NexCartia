import { Request } from "express";
import { PipelineStage } from "mongoose";
import { COLORS, FITS, GENDERS, SIZES } from "./catalog.js";

type Filter = Record<string, unknown>;
type FilterKey =
  | "search"
  | "category"
  | "gender"
  | "size"
  | "fit"
  | "color"
  | "price"
  | "rating"
  | "stock";

type SortSpec = Record<string, 1 | -1>;

const NEWEST: SortSpec = { createdAt: -1, _id: -1 };

export const SORTS: Record<string, SortSpec> = {
  newest: NEWEST,
  "price-asc": { price: 1, _id: 1 },
  "price-desc": { price: -1, _id: -1 },
  rating: { ratings: -1, numOfReviews: -1, _id: -1 },
  popular: { numOfReviews: -1, ratings: -1, _id: -1 },
};

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Accepts "a,b" or repeated ?key=a&key=b; drops anything outside `allowed`
const readList = (value: unknown, allowed?: string[]) => {
  const raw = (Array.isArray(value) ? value : [value])
    .filter((v): v is string => typeof v === "string")
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 30);
  return allowed ? raw.filter((v) => allowed.includes(v)) : raw;
};

const readNumber = (value: unknown) => {
  const n = typeof value === "string" && value !== "" ? Number(value) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export const parseProductQuery = (query: Request["query"]) => {
  const search = typeof query.search === "string" ? query.search.trim().slice(0, 100) : "";
  const categories = readList(query.category).map((c) => c.toLowerCase());
  const genders = readList(query.gender, GENDERS);
  const sizes = readList(query.size, SIZES);
  const fits = readList(query.fit, FITS);
  const colors = readList(query.color, COLORS);
  const minPrice = readNumber(query.minPrice);
  const maxPrice = readNumber(query.maxPrice);
  const minRating = readNumber(query.rating);
  const inStock = query.inStock === "true";

  const parts: Partial<Record<FilterKey, Filter>> = {};

  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: "i" };
    parts.search = {
      $or: [{ name: pattern }, { description: pattern }, { category: pattern }],
    };
  }
  if (categories.length) parts.category = { category: { $in: categories } };
  if (genders.length) parts.gender = { gender: { $in: genders } };
  if (sizes.length) parts.size = { sizes: { $in: sizes } };
  if (fits.length) parts.fit = { fit: { $in: fits } };
  if (colors.length) parts.color = { color: { $in: colors } };
  if (minPrice !== undefined || maxPrice !== undefined)
    parts.price = {
      price: {
        ...(minPrice !== undefined && { $gte: minPrice }),
        ...(maxPrice !== undefined && { $lte: maxPrice }),
      },
    };
  if (minRating !== undefined && minRating > 0)
    parts.rating = { ratings: { $gte: Math.min(minRating, 5) } };
  if (inStock) parts.stock = { stock: { $gt: 0 } };

  // Combine every active filter, optionally leaving one out (for its own facet counts)
  const buildMatch = (except?: FilterKey): Filter => {
    const active = Object.entries(parts)
      .filter(([key]) => key !== except)
      .map(([, filter]) => filter);
    return active.length ? { $and: active } : {};
  };

  // hasOwn: plain-object lookup would accept inherited keys like "constructor"
  const sort: SortSpec =
    typeof query.sort === "string" && Object.prototype.hasOwnProperty.call(SORTS, query.sort)
      ? SORTS[query.sort]
      : NEWEST;

  return { buildMatch, sort };
};

const countBy = (field: string) => [
  { $match: { [field]: { $nin: [null, ""] } } },
  { $group: { _id: `$${field}`, count: { $sum: 1 } } },
];

const orderBy = (values: { _id: string; count: number }[], order: string[]) =>
  values
    .filter((v) => order.includes(v._id))
    .sort((a, b) => order.indexOf(a._id) - order.indexOf(b._id))
    .map((v) => ({ value: v._id, count: v.count }));

// Each facet counts products matching every *other* active filter, so ticking
// "blue" doesn't make the other colour counts drop to zero.
export const facetPipeline = (
  buildMatch: (except?: FilterKey) => Filter
): PipelineStage[] => [
  {
    $facet: {
      category: [
        { $match: buildMatch("category") },
        ...countBy("category"),
        { $sort: { _id: 1 as const } },
      ],
      gender: [{ $match: buildMatch("gender") }, ...countBy("gender")],
      size: [
        { $match: buildMatch("size") },
        { $unwind: "$sizes" },
        { $group: { _id: "$sizes", count: { $sum: 1 } } },
      ],
      fit: [{ $match: buildMatch("fit") }, ...countBy("fit")],
      color: [{ $match: buildMatch("color") }, ...countBy("color")],
      price: [
        { $match: buildMatch("price") },
        { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
      ],
      rating: [
        { $match: buildMatch("rating") },
        {
          $group: {
            _id: null,
            ...Object.fromEntries(
              [4, 3, 2, 1].map((r) => [
                `r${r}`,
                { $sum: { $cond: [{ $gte: ["$ratings", r] }, 1, 0] } },
              ])
            ),
          },
        },
      ],
      inStock: [
        { $match: buildMatch("stock") },
        { $match: { stock: { $gt: 0 } } },
        { $count: "count" },
      ],
    },
  },
];

type FacetResult = {
  category: { _id: string; count: number }[];
  gender: { _id: string; count: number }[];
  size: { _id: string; count: number }[];
  fit: { _id: string; count: number }[];
  color: { _id: string; count: number }[];
  price: { min: number; max: number }[];
  rating: Record<string, number>[];
  inStock: { count: number }[];
};

export const shapeFacets = (raw: FacetResult) => ({
  categories: raw.category.map((c) => ({ value: c._id, count: c.count })),
  genders: orderBy(raw.gender, GENDERS),
  sizes: orderBy(raw.size, SIZES),
  fits: orderBy(raw.fit, FITS),
  colors: orderBy(raw.color, COLORS),
  price: { min: raw.price[0]?.min ?? 0, max: raw.price[0]?.max ?? 0 },
  ratings: [4, 3, 2, 1].map((r) => ({
    value: r,
    count: raw.rating[0]?.[`r${r}`] ?? 0,
  })),
  inStock: raw.inStock[0]?.count ?? 0,
});
