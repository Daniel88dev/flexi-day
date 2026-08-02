"use client";

import { createAuthClient } from "better-auth/react";
import { API_BASE_URL } from "@/lib/api/client";
import { correlationHeaders } from "@/lib/observability/session";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  fetchOptions: {
    credentials: "include",
    // Sign-in/sign-up never go through `api()`. In `onRequest` rather than
    // static `headers` so the ids are read per call, not at module evaluation.
    onRequest: (ctx) => {
      for (const [key, value] of Object.entries(correlationHeaders())) {
        ctx.headers.set(key, value);
      }
      return ctx;
    },
  },
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
  changePassword,
  getSession,
} = authClient;
