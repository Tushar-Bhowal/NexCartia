import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  BarResponse,
  LineResponse,
  PieResponse,
  StatsResponse,
} from "../../types/api-types";

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_SERVER}/api/v1/dashboard/`,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    stats: builder.query<StatsResponse, void>({
      query: () => "stats",
      keepUnusedDataFor: 0,
    }),
    pie: builder.query<PieResponse, void>({
      query: () => "pie",
      keepUnusedDataFor: 0,
    }),
    bar: builder.query<BarResponse, void>({
      query: () => "bar",
      keepUnusedDataFor: 0,
    }),
    line: builder.query<LineResponse, void>({
      query: () => "line",
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useBarQuery, useStatsQuery, useLineQuery, usePieQuery } =
  dashboardApi;
