import type { ConnectContext } from "@/lib/api/oauth-connect";

export const OAUTH_QUERY =
  "client_id=https%3A%2F%2Fclaude.ai%2Fmeta&scope=flexiday.read+flexiday.write+offline_access&exp=1&sig=abc";

export const connectContext = (overrides: Partial<ConnectContext> = {}): ConnectContext => ({
  client: {
    clientId: "https://claude.ai/meta",
    name: "Claude",
    verified: true,
    host: "claude.ai",
    logoUri: null,
    clientUri: null,
    policyUri: null,
    tosUri: null,
  },
  redirect: { host: "claude.ai", local: false },
  scopes: ["flexiday.read", "flexiday.write"],
  signedIn: true,
  organization: { organizationId: "org-acme", organizationName: "Acme", access: "write" },
  organizations: {
    eligible: [
      { organizationId: "org-acme", organizationName: "Acme", access: "write" },
      { organizationId: "org-beta", organizationName: "Beta", access: "read" },
    ],
    leftOut: [
      {
        organizationId: "org-gamma",
        organizationName: "Gamma",
        ownerName: "Gita Owner",
        reason: "TURNED_OFF",
      },
    ],
  },
  ...overrides,
});
