// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { getDeviceId, getSessionId } from "@/lib/observability/session";

// On in production only; opt in elsewhere with NEXT_PUBLIC_SENTRY_ENABLE=true.
const enabled =
  process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SENTRY_ENABLE === "true";

Sentry.init({
  enabled,
  dsn: "https://74640af9c7fc240bda9756dda54946ec@o4507832619237376.ingest.de.sentry.io/4511795855753296",

  // Add optional integrations for additional features
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    // No `levels` filter: every console level is forwarded.
    Sentry.consoleLoggingIntegration(),
  ],

  // Sample 20% of transactions by default; overridable the same way the backend does.
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.2),

  // Attach trace headers to backend API calls so browser spans link to the
  // flexi-day-be server spans (distributed tracing). Cross-origin, so the API
  // origin must be listed explicitly. "localhost" covers local dev.
  tracePropagationTargets: [
    "localhost",
    ...(process.env.NEXT_PUBLIC_API_URL ? [process.env.NEXT_PUBLIC_API_URL] : []),
  ],
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});

// `trailingSlash: true` gives `/requests/` while the router hook gets
// `/requests`; without this the same page splits into two values.
const normalizePath = (path: string): string => path.replace(/\/+$/, "") || "/";

const browserContext = () => {
  try {
    return {
      "browser.locale": navigator.language,
      "browser.timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  } catch {
    return {};
  }
};

if (enabled) {
  const sessionId = getSessionId();
  const deviceId = getDeviceId();

  // Global scope attributes are merged into every log and error the SDK emits,
  // which is what makes them dependable columns in the Sentry Logs table.
  Sentry.getGlobalScope().setAttributes({
    "service.name": "flexi-day-web",
    "service.version": process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown",
    "service.type": "frontend",
    "client.session_id": sessionId,
    "client.device_id": deviceId,
    "url.path": typeof window === "undefined" ? "" : normalizePath(window.location.pathname),
    ...browserContext(),
  });

  // Attributes are the log columns; tags are what make error events searchable.
  Sentry.setTag("client_session_id", sessionId);
  Sentry.setTag("client_device_id", deviceId);
}

// The SPA navigates without reloading, so `url.path` has to be refreshed here or
// it stays whatever the first page load was.
export const onRouterTransitionStart = (href: string, navigationType: string): void => {
  try {
    Sentry.getGlobalScope().setAttributes({
      "url.path": normalizePath(new URL(href, window.location.origin).pathname),
    });
  } catch {
    // A malformed href must not block the navigation instrumentation below.
  }
  Sentry.captureRouterTransitionStart(href, navigationType);
};
