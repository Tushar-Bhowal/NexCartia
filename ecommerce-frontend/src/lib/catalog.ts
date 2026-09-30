export const SIZE_GROUPS = [
  { label: "Clothing", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
  { label: "Waist", sizes: ["28", "30", "32", "34", "36", "38"] },
  {
    label: "Footwear",
    sizes: ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
  },
];

export const FITS = ["slim", "regular", "relaxed", "oversized"];

export const COLORS: Record<string, string> = {
  black: "#111111",
  white: "#ffffff",
  grey: "#9ca3af",
  navy: "#1e2a4a",
  blue: "#3b6fb6",
  green: "#1f6f4a",
  olive: "#6b6b3a",
  beige: "#d9c7a7",
  brown: "#7a4b2a",
  red: "#c0262d",
  pink: "#f0a6c0",
  yellow: "#f2c94c",
};

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "popular", label: "Most Reviewed" },
];

export const GENDER_LABELS: Record<string, string> = { male: "Men", female: "Women" };

export const titleCase = (text: string) =>
  text.replace(/(^|[\s-])\w/g, (c) => c.toUpperCase());

export const formatPrice = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export const LIST_KEYS = ["category", "gender", "size", "fit", "color"] as const;
export type ListKey = (typeof LIST_KEYS)[number];

export type CatalogValues = {
  description: string;
  material: string;
  sizes: string[];
  fit: string;
  color: string;
};

export const emptyCatalog: CatalogValues = {
  description: "",
  material: "",
  sizes: [],
  fit: "",
  color: "",
};

export const appendCatalog = (formData: FormData, values: CatalogValues) => {
  formData.set("description", values.description);
  formData.set("material", values.material);
  formData.set("sizes", values.sizes.join(","));
  formData.set("fit", values.fit);
  formData.set("color", values.color);
};
