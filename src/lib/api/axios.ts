"use client";

import axios from "axios";

/** App areas that require a session; a 401 there means the session expired. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/trading",
  "/wallet",
  "/orders",
  "/settings",
  "/admin",
];

function isOnProtectedPage() {
  const { pathname } = window.location;
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let redirectingToLogin = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status as number | undefined;

    // Only bounce to /login when the user is inside the app. Public pages
    // (landing, login, register) handle 401s themselves and degrade gracefully.
    if (
      status === 401 &&
      typeof window !== "undefined" &&
      !redirectingToLogin &&
      isOnProtectedPage()
    ) {
      redirectingToLogin = true;
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
    }

    return Promise.reject(
      new ApiError(
        error.response?.data?.message ??
          error.message ??
          "Unexpected request failure",
        status,
      ),
    );
  },
);
