import {
  Bar,
  CouponType,
  Facets,
  Review,
  Line,
  Order,
  Pie,
  Product,
  ShippingInfo,
  Stats,
  User,
} from "./types";

export type CustomError = {
  status: number;
  data: {
    message: string;
    success: boolean;
  };
};

export type MessageResponse = {
  success: boolean;
  message: string;
};

export type AllUsersResponse = {
  success: boolean;
  users: User[];
};

export type UserResponse = {
  success: boolean;
  user: User;
};

export type AllProductsResponse = {
  success: boolean;
  products: Product[];
};
export type CategoriesResponse = {
  success: boolean;
  categories: string[];
};

export type SearchProductsResponse = AllProductsResponse & {
  total: number;
  page: number;
  totalPage: number;
};

export type FacetsResponse = {
  success: boolean;
  facets: Facets;
};

export type ReviewsResponse = {
  success: boolean;
  reviews: Review[];
  distribution: Record<string, number>;
  myReview: Review | null;
  canReview: boolean;
};

export type ReviewRequest = {
  productId: string;
  rating: number;
  comment: string;
};
export type ProductResponse = {
  success: boolean;
  product: Product;
};

export type AllOrdersResponse = {
  success: boolean;
  orders: Order[];
};
export type OrderDetailsResponse = {
  success: boolean;
  order: Order;
};

export type StatsResponse = {
  success: boolean;
  stats: Stats;
};

export type PieResponse = {
  success: boolean;
  charts: Pie;
};

export type BarResponse = {
  success: boolean;
  charts: Bar;
};

export type LineResponse = {
  success: boolean;
  charts: Line;
};

export type UpdateProductRequest = {
  productId: string;
  formData: FormData;
};

export type NewUserRequest = {
  name: string;
  email: string;
  password: string;
  gender: string;
  dob: string;
};

export type GoogleLoginRequest = {
  idToken: string;
  gender?: string;
  dob?: string;
};

export type CartLine = {
  productId: string;
  size?: string;
  quantity: number;
};

export type CreatePaymentRequest = {
  items: CartLine[];
  shippingInfo: ShippingInfo;
  coupon?: string;
};

export type CreatePaymentResponse = {
  success: boolean;
  clientSecret: string;
};

export type NewOrderRequest = {
  paymentIntentId: string;
  items: CartLine[];
  coupon?: string;
};

export type PlacedOrder = {
  _id: string;
  total: number;
  createdAt: string;
  paymentMethod: string;
};

export type NewOrderResponse = MessageResponse & {
  order: PlacedOrder;
};

export type DiscountResponse = {
  success: boolean;
  discount: number;
};

export type NewCouponRequest = {
  coupon: string;
  amount: number;
};

export type AllDiscountResponse = {
  success: boolean;
  coupons: CouponType[];
};

export type ContactMessage = {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

export type Subscriber = {
  _id: string;
  email: string;
  createdAt: string;
};

export type NewContactRequest = {
  name: string;
  email: string;
  message: string;
};

export type AllMessagesResponse = {
  success: boolean;
  messages: ContactMessage[];
};

export type AllSubscribersResponse = {
  success: boolean;
  subscribers: Subscriber[];
};
