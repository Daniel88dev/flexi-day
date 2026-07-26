// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

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
    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],

  // Sample 20% of transactions in production for performance monitoring.
  // Adjust this value or use tracesSampler for greater control.
  tracesSampleRate: 0.2,

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

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
