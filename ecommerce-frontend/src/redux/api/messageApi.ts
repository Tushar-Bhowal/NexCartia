import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  AllMessagesResponse,
  AllSubscribersResponse,
  MessageResponse,
  NewContactRequest,
} from "../../types/api-types";

export const messageApi = createApi({
  reducerPath: "messageApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_SERVER}/api/v1/message/`,
    credentials: "include",
  }),
  tagTypes: ["messages", "subscribers"],
  endpoints: (builder) => ({
    sendMessage: builder.mutation<MessageResponse, NewContactRequest>({
      query: (body) => ({
        url: "contact",
        method: "POST",
        body,
      }),
      invalidatesTags: ["messages"],
    }),
    subscribe: builder.mutation<MessageResponse, string>({
      query: (email) => ({
        url: "subscribe",
        method: "POST",
        body: { email },
      }),
      invalidatesTags: ["subscribers"],
    }),
    allMessages: builder.query<AllMessagesResponse, void>({
      query: () => "all",
      providesTags: ["messages"],
    }),
    deleteMessage: builder.mutation<MessageResponse, string>({
      query: (id) => ({
        url: id,
        method: "DELETE",
      }),
      invalidatesTags: ["messages"],
    }),
    allSubscribers: builder.query<AllSubscribersResponse, void>({
      query: () => "subscribers",
      providesTags: ["subscribers"],
    }),
    deleteSubscriber: builder.mutation<MessageResponse, string>({
      query: (id) => ({
        url: `subscribers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["subscribers"],
    }),
  }),
});

export const {
  useSendMessageMutation,
  useSubscribeMutation,
  useAllMessagesQuery,
  useDeleteMessageMutation,
  useAllSubscribersQuery,
  useDeleteSubscriberMutation,
} = messageApi;
