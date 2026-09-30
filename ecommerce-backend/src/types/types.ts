import { NextFunction, Request, Response } from "express";

export interface NewUserRequestBody {
  name: string;
  email: string;
  password: string;
  gender: "male" | "female";
  dob: string;
}

export interface GoogleAuthRequestBody {
  idToken: string;
  gender?: "male" | "female";
  dob?: string;
}

export interface NewProductRequestBody {
  name: string;
  category: string;
  gender: "male" | "female";
  // multipart form fields always arrive as strings
  price: string;
  stock: string;
  description?: string;
  material?: string;
  // comma-separated, e.g. "S,M,L"
  sizes?: string;
  fit?: string;
  color?: string;
}

export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

export type InvalidateCacheProps = {
  product?: boolean;
  order?: boolean;
  admin?: boolean;
  userId?: string;
  orderId?: string;
  productId?: string | string[];
};

export type CartLineType = {
  productId: string;
  size?: string;
  quantity: number;
};

export type ShippingInfoType = {
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
};

export interface NewPaymentRequestBody {
  items: CartLineType[];
  shippingInfo: ShippingInfoType;
  coupon?: string;
}

export interface NewOrderRequestBody {
  paymentIntentId: string;
  items: CartLineType[];
  coupon?: string;
}
