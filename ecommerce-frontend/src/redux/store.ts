import { configureStore } from "@reduxjs/toolkit";
import { userAPI } from "./api/userApi";
import { userReducer } from "./reducer/userReducer";
import { productAPI } from "./api/productApi";
import { CART_STORAGE_KEY, cartReducer } from "./reducer/cartReducer";
import { orderApi } from "./api/orderApi";
import { dashboardApi } from "./api/dashboardApi";
import { paymentApi } from "./api/paymentApi";
import { messageApi } from "./api/messageApi";

export const store = configureStore({
  reducer: {
    [userAPI.reducerPath]: userAPI.reducer,
    [productAPI.reducerPath]: productAPI.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
    [messageApi.reducerPath]: messageApi.reducer,
    [userReducer.name]: userReducer.reducer,
    [cartReducer.name]: cartReducer.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      userAPI.middleware,
      productAPI.middleware,
      orderApi.middleware,
      dashboardApi.middleware,
      paymentApi.middleware,
      messageApi.middleware
    ),
});

let savedCartItems = store.getState().cartReducer.cartItems;
store.subscribe(() => {
  const { cartItems } = store.getState().cartReducer;
  if (cartItems === savedCartItems) return;
  savedCartItems = cartItems;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  } catch {
    // storage unavailable (private mode / quota) — cart just won't survive a refresh
  }
});

export type RootState = ReturnType<typeof store.getState>;
