import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
} from "@reduxjs/toolkit/query/react";
import {
  createRequestHeaders,
  addTurnstileToHeaders,
} from "../utils/requestHeaders";
import { getTurnstileToken } from "../utils/turnstile";
import { handleInternalError, extractErrorData } from "../BUGREPORT";
import { showToast } from "../utils/globalToast";
import fingerprintService from "./fingerprintService";

/**
 * API Configuration
 */
const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_URL,
  stateChangingMethods: ["POST", "PUT", "DELETE", "PATCH"] as const,
  authTokenKey: "userToken",
  userDataKey: "userData",
  loginPath: "/login",
} as const;

/**
 * Add authentication and request tracking headers
 * @param headers - The headers object to modify
 */
const addAuthHeaders = async (headers: Headers): Promise<void> => {
  // Create standardized headers
  const standardHeaders = createRequestHeaders(true);

  // Copy all headers from the standard headers
  standardHeaders.forEach((value, key) => {
    headers.set(key, value);
  });

  // Add fingerprint visitor ID header (async to ensure we get a proper ID)
  try {
    const fingerprintHeaders = await fingerprintService.getHeadersAsync();
    Object.entries(fingerprintHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
  } catch (error) {
    console.error('Error getting fingerprint headers:', error);
    // Fallback to sync method if async fails
    const fingerprintHeaders = fingerprintService.getHeaders();
    Object.entries(fingerprintHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }
};

/**
 * Add Turnstile token to state-changing requests
 * @param headers - The headers object to modify
 * @param method - The HTTP method
 * @param url - The request URL
 */
const addTurnstileHeaders = async (
  headers: Headers,
  method: string,
  url: string
): Promise<void> => {
  const isStateChangingRequest = API_CONFIG.stateChangingMethods.includes(
    method.toUpperCase() as any
  );

  if (isStateChangingRequest) {
    try {
      // Get Turnstile token for state-changing requests
      const turnstileToken = await getTurnstileToken("api_request");

      if (turnstileToken) {
        // Add the x-challenge header with the Turnstile token
        addTurnstileToHeaders(headers, turnstileToken);
      }
      // If no token available, continue without it rather than making additional calls
    } catch (error) {
      // Failed to get Turnstile token - continue without it
    }
  }
};

/**
 * Handle 401 Unauthorized responses
 * Clears authentication data and redirects to login
 */
const handleUnauthorizedResponse = (): void => {
  localStorage.removeItem(API_CONFIG.authTokenKey);
  localStorage.removeItem(API_CONFIG.userDataKey);
  window.location.href = API_CONFIG.loginPath;
};


/**
 * Custom base query with authentication, Turnstile, and error handling
 *
 * Features:
 * - Automatic authentication headers
 * - Turnstile tokens for state-changing requests only
 * - 401 error handling with automatic logout
 * - Request logging for debugging
 */
const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
  const storedBaseUrl = localStorage.getItem("baseUrl");
  const effectiveBaseUrl =
    storedBaseUrl && storedBaseUrl.trim() !== ""
      ? storedBaseUrl
      : API_CONFIG.baseUrl;
  const baseQuery = fetchBaseQuery({
    baseUrl: effectiveBaseUrl,
    prepareHeaders: async (headers) => {
      // Add authentication headers
      await addAuthHeaders(headers);

      // Add Turnstile headers for state-changing requests
      const method = args.method || "GET";
      await addTurnstileHeaders(headers, method, args.url || "");

      return headers;
    },
  });

  const result = await baseQuery(args, api, extraOptions);
 

  // Handle 401 Unauthorized responses
  if (
    result.error?.status === 401 &&
    (result.error?.data as { status?: string })?.status === "logout"
  ) {
    handleUnauthorizedResponse();
  }

  // Handle 500 Internal Server Error responses
  if (result.error?.status === 500) {
    const errorData = extractErrorData(result.error);
    if (errorData) {
      handleInternalError(errorData, result.error);
    }
  }

  // Handle 429 Rate Limit Exceeded responses
  if (result.error?.status === 429) {
    const errorData = result.error?.data as any;
    if (errorData?.type === "rate_limit_exceeded") {
      showToast(
        errorData.message || "Rate limit exceeded.\nPlease try again later.",
        "error",
        "boxToast",
        true
      );
    }
  }

  return result;
};

export const baseInstanceOfApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
});
