import {
  AllUsersResponse,
  GoogleLoginRequest,
  MessageResponse,
  NewUserRequest,
  UserResponse,
} from "@/types/api-types";
import { UserSignin } from "@/types/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const userAPI = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_SERVER}/api/v1/user/`,
    credentials: "include",
  }),
  tagTypes: ["users"],
  endpoints: (builder) => ({
    singup: builder.mutation<MessageResponse, NewUserRequest>({
      query: (user) => ({
        url: "new",
        method: "POST",
        body: user,
      }),
      invalidatesTags: ["users"],
    }),

    signin: builder.mutation<MessageResponse, UserSignin>({
      query: (user) => ({
        url: "signin",
        method: "POST",
        body: user,
      }),
      invalidatesTags: ["users"],
    }),

    googleLogin: builder.mutation<MessageResponse, GoogleLoginRequest>({
      query: (body) => ({
        url: "google",
        method: "POST",
        body,
      }),
      invalidatesTags: ["users"],
    }),

    deleteUser: builder.mutation<MessageResponse, string>({
      query: (userId) => ({
        url: userId,
        method: "DELETE",
      }),
      invalidatesTags: ["users"],
    }),

    allUsers: builder.query<AllUsersResponse, void>({
      query: () => "all",
      providesTags: ["users"],
    }),
    checkAuth: builder.query<UserResponse, void>({
      query: () => "check-auth",
      providesTags: ["users"],
    }),
    logout: builder.mutation<MessageResponse, void>({
      query: () => ({
        url: "logout",
        method: "POST",
      }),
      invalidatesTags: ["users"],
    }),
  }),
});

export const {
  useSingupMutation,
  useAllUsersQuery,
  useDeleteUserMutation,
  useSigninMutation,
  useGoogleLoginMutation,
  useCheckAuthQuery,
  useLogoutMutation,
} = userAPI;
