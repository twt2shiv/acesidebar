// src/services/auth/authApi.ts

import { baseInstanceOfApi } from "./baseInstanceOfApi";

const extendedAuthApi = baseInstanceOfApi.injectEndpoints({
  endpoints: (builder) => ({
    // Pre-check login/tenant via GET
    loginPrecheck: builder.query<any, { tenant: string } | string>({
      query: (arg) => {
        const tenant = typeof arg === "string" ? arg : arg.tenant;
        return {
          url: `/auth/login?type=login&tenant=${encodeURIComponent(tenant)}`,
          method: "GET",
        };
      },
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    getUserList: builder.query<any, void>({
      query: () => ({
        url: "/user/list",
        method: "GET",
      }),
      transformResponse: (response: any) => response?.data,
    }),
    addUser: builder.mutation<any, void>({
      query: (credentials) => ({
        url: "/user/add",
        method: "POST",
        body: credentials,
      }),
    }),
    getUserData: builder.query<any, any>({
      query: ({ client }: any) => ({
        url: `/user/profile/overview/${client}`,
        method: "GET",
      }),
      transformResponse: (response: any) => response?.data,
    }),
    getUserTickets: builder.query<any, any>({
      query: ({ client, page, limit }: any) => ({
        url: `/user/profile/tickets/${client}?page=${page}&limit=${limit}`,
        method: "GET",
      }),
    }),
    updateUserData: builder.mutation({
      query: (credentials) => ({
        url: `/user/edit/${credentials?.key}?type=${credentials?.type}`,
        method: "PUT",
        body: credentials.body,
      }),
    }),

    changePassword: builder.mutation({
      query: (credentials) => ({
        url: "/user/change-password",
        method: "PUT",
        body: credentials,
      }),
    }),

    updateActiveStatus: builder.mutation({
      query: (credentials) => ({
        url: `/auth/status/${credentials.userId}`,
        method: "PUT",
        body: credentials.body,
      }),
    }),
    getUserIsAvailable: builder.query<any, any>({
      query: ({ userId }: any) => ({
        url: `/auth/status/${userId}`,
        method: "GET",
      }),
      transformResponse: (response: any) => response?.data,
    }),

    adminSignUp: builder.mutation({
      query: (credentials) => ({
        url: `/signup/${credentials?.url}`,
        method: "POST",
        body: credentials?.body ,
      }),
    }),
    adminSignUpOtpVerify: builder.mutation({
      query: (credentials) => ({
        url: `/signup/validate-otp/${credentials?.param}`,
        method: "POST",
        body: credentials?.body ,
      }),
    }),
        createAdminAccount: builder.mutation({
      query: (credentials) => ({
        url: `/signup/create-account/info/${credentials?.param}`,
        method: "POST",
        body: credentials?.body ,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useLazyLoginPrecheckQuery,
  useLoginMutation,
  useChangePasswordMutation,
  useGetUserListQuery,
  useLazyGetUserDataQuery,
  useAddUserMutation,
  useLazyGetUserTicketsQuery,
  useUpdateUserDataMutation,
  useUpdateActiveStatusMutation,
  useGetUserIsAvailableQuery,
  useAdminSignUpMutation,
  useAdminSignUpOtpVerifyMutation,
  useCreateAdminAccountMutation
} = extendedAuthApi;
