import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  AllDiscountResponse,
  CreatePaymentRequest,
  CreatePaymentResponse,
  DiscountResponse,
  MessageResponse,
  NewCouponRequest,
} from "../../types/api-types";

export const paymentApi = createApi({
  reducerPath: "paymentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_SERVER}/api/v1/payment/`,
    credentials: "include",
  }),
  tagTypes: ["coupons"],
  endpoints: (builder) => ({
    createPayment: builder.mutation<CreatePaymentResponse, CreatePaymentRequest>({
      query: (body) => ({
        url: "create",
        method: "POST",
        body,
      }),
    }),
    discount: builder.query<DiscountResponse, string>({
      query: (coupon) => `discount?coupon=${encodeURIComponent(coupon)}`,
    }),
    allCoupons: builder.query<AllDiscountResponse, void>({
      query: () => "coupon/all",
      providesTags: ["coupons"],
    }),
    newCoupon: builder.mutation<MessageResponse, NewCouponRequest>({
      query: (body) => ({
        url: "coupon/new",
        method: "POST",
        body,
      }),
      invalidatesTags: ["coupons"],
    }),
    deleteCoupon: builder.mutation<MessageResponse, string>({
      query: (id) => ({
        url: `coupon/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["coupons"],
    }),
  }),
});

export const {
  useCreatePaymentMutation,
  useLazyDiscountQuery,
  useAllCouponsQuery,
  useNewCouponMutation,
  useDeleteCouponMutation,
} = paymentApi;
