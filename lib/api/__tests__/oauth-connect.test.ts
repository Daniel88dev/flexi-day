import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  acceptedScopes,
  answerConsent,
  appName,
  chooseConnectOrganization,
  continueAfterPicker,
  getConnectContext,
  offersWrite,
  signInForConnection,
  type ConnectContext,
} from "../oauth-connect";

const QUERY = "client_id=abc&scope=flexiday.read+flexiday.write+offline_access&sig=xyz";

const context = (overrides: Partial<ConnectContext> = {}): ConnectContext => ({
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
  organization: { organizationId: "org-1", organizationName: "Acme", access: "write" },
  organizations: null,
  ...overrides,
});

beforeEach(() => {
  apiMock.mockReset();
  apiMock.mockResolvedValue({ redirect: true, url: "https://next.example/" });
});

describe("appName", () => {
  it("returns the app's own name, or its host when it has none", () => {
    expect(appName(context())).toBe("Claude");
    expect(appName(context({ client: { ...context().client, name: "  " } }))).toBe("claude.ai");
  });
});

describe("acceptedScopes", () => {
  it("returns every requested scope when write stays ticked", () => {
    expect(acceptedScopes(QUERY, true)).toBe("flexiday.read flexiday.write offline_access");
  });

  it("returns the scopes without write when it is unticked", () => {
    expect(acceptedScopes(QUERY, false)).toBe("flexiday.read offline_access");
  });
});

describe("offersWrite", () => {
  it("returns true only when the app asked for write and the organization allows it", () => {
    expect(offersWrite(context())).toBe(true);
    expect(
      offersWrite(
        context({
          organization: { organizationId: "org-1", organizationName: "Beta", access: "read" },
        })
      )
    ).toBe(false);
    expect(offersWrite(context({ scopes: ["flexiday.read"] }))).toBe(false);
  });
});

describe("the connect calls", () => {
  it("posts the signed query for the context", async () => {
    await getConnectContext(QUERY);
    expect(apiMock).toHaveBeenCalledWith("/api/oauth-connect/context", {
      method: "POST",
      body: { oauthQuery: QUERY },
    });
  });

  it("posts the picked organization, then continues the flow", async () => {
    await chooseConnectOrganization("org-1");
    await continueAfterPicker(QUERY);
    expect(apiMock).toHaveBeenNthCalledWith(1, "/api/oauth-connect/organization", {
      method: "POST",
      body: { organizationId: "org-1" },
    });
    expect(apiMock).toHaveBeenNthCalledWith(2, "/api/auth/oauth2/continue", {
      method: "POST",
      body: { postLogin: true, oauth_query: QUERY },
    });
  });

  it("answers consent with the accepted scopes, or refuses", async () => {
    await answerConsent(QUERY, { accept: true, scope: "flexiday.read" });
    await answerConsent(QUERY, { accept: false });
    expect(apiMock).toHaveBeenNthCalledWith(1, "/api/auth/oauth2/consent", {
      method: "POST",
      body: { accept: true, scope: "flexiday.read", oauth_query: QUERY },
    });
    expect(apiMock).toHaveBeenNthCalledWith(2, "/api/auth/oauth2/consent", {
      method: "POST",
      body: { accept: false, oauth_query: QUERY },
    });
  });

  it("signs in with the signed query in the body", async () => {
    await signInForConnection({ email: "a@b.c", password: "pw", oauthQuery: QUERY });
    expect(apiMock).toHaveBeenCalledWith("/api/auth/sign-in/email", {
      method: "POST",
      body: { email: "a@b.c", password: "pw", oauth_query: QUERY },
    });
  });
});
