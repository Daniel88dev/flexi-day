"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  CalendarConnectionErrorName,
  CalendarProviderSlug,
} from "@/lib/api/calendar-connections";
import {
  parseConnectCallback,
  takeConnectProvider,
  type ConnectCallbackError,
} from "@/lib/calendar-sync/connect-callback";
import type { Dictionary } from "@/lib/i18n";
import { useTranslation } from "@/lib/i18n/use-translation";
import { pushToast } from "@/components/toast";
import { PROVIDER_NAMES } from "./connect-section";

const CALLBACK_PARAMS = ["connected", "error", "provider", "config"];

export function callbackErrorMessage(
  error: ConnectCallbackError,
  provider: CalendarProviderSlug | null,
  t: Dictionary
): string {
  const toasts = t.calSync.connect.toasts;
  // A work tenant that blocks user consent shows "Need admin approval"; declining it lands here.
  if (error === "consent_denied" && provider === "microsoft") return toasts.consentDeniedMicrosoft;
  return toasts.callback[error];
}

export function connectionErrorMessage(name: CalendarConnectionErrorName, t: Dictionary): string {
  const toasts = t.calSync.connect.toasts;
  switch (name) {
    case "team_config":
    case "provider_disabled":
    case "target_exists":
      return toasts.callback[name];
    case "not_entitled":
      return toasts.notEntitled;
    case "needs_reconnect":
      return toasts.needsReconnect;
    default:
      return t.calSync.toasts.wrong;
  }
}

/**
 * Announces the outcome of a consent round from the query the backend redirects to, then
 * strips that query. Reads `useSearchParams`, so it must sit inside a Suspense boundary.
 */
export function ConnectCallbackNotice() {
  const { t, localeReady } = useTranslation();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // The ref, not the deps, makes this fire once: `router.replace` is async and the locale
  // provider swaps `t` from its own mount effect.
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current || !localeReady) return;
    const result = parseConnectCallback(params);
    if (!result) return;
    handledRef.current = true;

    const started = takeConnectProvider();
    if (result.status === "connected") {
      pushToast(t.calSync.connect.toasts.connected(PROVIDER_NAMES[result.provider]));
    } else {
      pushToast(
        callbackErrorMessage(result.error, result.provider ?? started, t),
        result.error === "consent_denied" ? "warm" : "danger"
      );
    }

    const next = new URLSearchParams(params);
    for (const key of CALLBACK_PARAMS) next.delete(key);
    const query = next.toString();
    router.replace(pathname + (query ? `?${query}` : ""), { scroll: false });
  }, [localeReady, params, pathname, router, t]);

  return null;
}
