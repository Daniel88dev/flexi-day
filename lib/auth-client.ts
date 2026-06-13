"use client";

import { createAuthClient } from "better-auth/react";
import { API_BASE_URL } from "@/lib/api/client";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  fetchOptions: { credentials: "include" },
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
  getSession,
} = authClient;
