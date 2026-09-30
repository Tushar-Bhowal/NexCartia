import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CartReducerInitialState } from "../../types/reducer-types";
import { CartItem, ShippingInfo } from "../../types/types";

export const CART_STORAGE_KEY = "cartItems";

const loadCartItems = (): CartItem[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    // carts saved before sizes existed have no size field
    return Array.isArray(saved)
      ? saved.map((item: CartItem) => ({ ...item, size: item.size ?? "" }))
      : [];
  } catch {
    return [];
  }
};

const emptyCart: CartReducerInitialState = {
  loading: false,
  cartItems: [],
  subtotal: 0,
  tax: 0,
  shippingCharges: 0,
  discount: 0,
  total: 0,
  coupon: undefined,
  shippingInfo: {
    address: "",
    city: "",
    state: "",
    country: "",
    pinCode: "",
  },
};

const initialState: CartReducerInitialState = {
  ...emptyCart,
  cartItems: loadCartItems(),
};

export const cartReducer = createSlice({
  name: "cartReducer",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      state.loading = true;

      const index = state.cartItems.findIndex(
        (i) =>
          i.productId === action.payload.productId &&
          i.size === action.payload.size
      );

      if (index !== -1) state.cartItems[index] = action.payload;
      else state.cartItems.push(action.payload);
      state.loading = false;
    },

    removeCartItem: (
      state,
      action: PayloadAction<{ productId: string; size: string }>
    ) => {
      state.loading = true;
      state.cartItems = state.cartItems.filter(
        (i) =>
          !(i.productId === action.payload.productId && i.size === action.payload.size)
      );
      state.loading = false;
    },

    // Mirrors calculateOrderTotals in the backend so the shown total is what gets charged
    calculatePrice: (state) => {
      const subtotal = state.cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      state.subtotal = subtotal;
      state.shippingCharges = subtotal > 1000 ? 0 : 200;
      state.tax = Math.round(subtotal * 0.18);
      const beforeDiscount = subtotal + state.tax + state.shippingCharges;
      state.total = beforeDiscount - Math.min(state.discount, beforeDiscount);
    },

    discountApplied: (state, action: PayloadAction<number>) => {
      state.discount = action.payload;
    },

    saveCoupon: (state, action: PayloadAction<string | undefined>) => {
      state.coupon = action.payload;
    },
    saveShippingInfo: (state, action: PayloadAction<ShippingInfo>) => {
      state.shippingInfo = action.payload;
    },
    resetCart: () => emptyCart,
  },
});

export const {
  addToCart,
  removeCartItem,
  calculatePrice,
  discountApplied,
  saveShippingInfo,
  resetCart,
  saveCoupon,
} = cartReducer.actions;
