import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  AllProductsResponse,
  CategoriesResponse,
  FacetsResponse,
  MessageResponse,
  ProductResponse,
  ReviewRequest,
  ReviewsResponse,
  SearchProductsResponse,
  UpdateProductRequest,
} from "../../types/api-types";

export const productAPI = createApi({
  reducerPath: "productApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_SERVER}/api/v1/product/`,
    credentials: "include",
  }),
  tagTypes: ["product", "reviews"],
  endpoints: (builder) => ({
    latestProducts: builder.query<AllProductsResponse, void>({
      query: () => "latest",
      providesTags: ["product"],
    }),
    allProducts: builder.query<AllProductsResponse, void>({
      query: () => "admin-products",
      providesTags: ["product"],
    }),
    categories: builder.query<CategoriesResponse, void>({
      query: () => `categories`,
      providesTags: ["product"],
    }),
    // `params` is a ready-made query string built from the search page URL
    searchProducts: builder.query<SearchProductsResponse, string>({
      query: (params) => `all?${params}`,
      providesTags: ["product"],
    }),
    facets: builder.query<FacetsResponse, string>({
      query: (params) => `facets?${params}`,
      providesTags: ["product"],
    }),
    // `viewer` only splits the cache per signed-in user; the cookie identifies them to the API
    reviews: builder.query<ReviewsResponse, { productId: string; viewer: string }>({
      query: ({ productId }) => `${productId}/reviews`,
      providesTags: ["reviews"],
    }),
    saveReview: builder.mutation<MessageResponse, ReviewRequest>({
      query: ({ productId, rating, comment }) => ({
        url: `${productId}/review`,
        method: "POST",
        body: { rating, comment },
      }),
      invalidatesTags: ["reviews", "product"],
    }),
    deleteReview: builder.mutation<MessageResponse, string>({
      query: (reviewId) => ({
        url: `review/${reviewId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["reviews", "product"],
    }),

    productDetails: builder.query<ProductResponse, string>({
      query: (id) => id,
      providesTags: ["product"],
    }),
    newProduct: builder.mutation<MessageResponse, FormData>({
      query: (formData) => ({
        url: "new",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["product"],
    }),
    updateProduct: builder.mutation<MessageResponse, UpdateProductRequest>({
      query: ({ formData, productId }) => ({
        url: productId,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["product"],
    }),
    deleteProduct: builder.mutation<MessageResponse, string>({
      query: (productId) => ({
        url: productId,
        method: "DELETE",
      }),
      invalidatesTags: ["product"],
    }),
  }),
});

export const {
  useLatestProductsQuery,
  useAllProductsQuery,
  useCategoriesQuery,
  useSearchProductsQuery,
  useProductDetailsQuery,
  useNewProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useFacetsQuery,
  useReviewsQuery,
  useSaveReviewMutation,
  useDeleteReviewMutation,
} = productAPI;
