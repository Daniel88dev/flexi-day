import { api } from "./client";

/** What an organization lets an AI connection do. */
export type ConnectAccess = "read" | "write";

export type ConnectOrganization = {
  organizationId: string;
  organizationName: string;
  access: ConnectAccess;
};

export type LeftOutOrganization = {
  organizationId: string;
  organizationName: string;
  ownerName: string;
  reason: "TURNED_OFF" | "PLAN";
};

/** What the connect pages show about one OAuth authorization request (`POST /api/oauth-connect/context`). */
export type ConnectContext = {
  client: {
    clientId: string;
    name: string | null;
    /** The app's address was fetched and checked; otherwise its name is its own claim. */
    verified: boolean;
    host: string;
    logoUri: string | null;
    clientUri: string | null;
    policyUri: string | null;
    tosUri: string | null;
  };
  redirect: { host: string; local: boolean };
  scopes: string[];
  signedIn: boolean;
  organization: ConnectOrganization | null;
  organizations: { eligible: ConnectOrganization[]; leftOut: LeftOutOrganization[] } | null;
};

/** The authorization server's answer when the flow moves on: the next page, or the app's redirect. */
export type OAuthRedirect = { redirect: true; url: string };

export const WRITE_SCOPE = "flexiday.write";

/** The name to show for the app: its own name, else its host. */
export function appName(context: Pick<ConnectContext, "client">): string {
  return context.client.name?.trim() || context.client.host;
}

/**
 * The scopes to accept: everything the app asked for, without write when the
 * member unticked it or the organization is Read only. The backend drops write
 * on a Read only organization whatever this sends.
 */
export function acceptedScopes(oauthQuery: string, allowWrite: boolean): string {
  const requested = (new URLSearchParams(oauthQuery).get("scope") ?? "").split(" ").filter(Boolean);
  return requested.filter((scope) => allowWrite || scope !== WRITE_SCOPE).join(" ");
}

/** Whether the app asked for write access and the organization allows it. */
export function offersWrite(context: ConnectContext): boolean {
  return context.scopes.includes(WRITE_SCOPE) && context.organization?.access === "write";
}

/** Leaves the static page for the next step of the flow or the app itself. */
export function goTo(url: string): void {
  window.location.assign(url);
}

export function getConnectContext(oauthQuery: string): Promise<ConnectContext> {
  return api<ConnectContext>("/api/oauth-connect/context", {
    method: "POST",
    body: { oauthQuery },
  });
}

export function chooseConnectOrganization(organizationId: string): Promise<ConnectOrganization> {
  return api<ConnectOrganization>("/api/oauth-connect/organization", {
    method: "POST",
    body: { organizationId },
  });
}

export function continueAfterPicker(oauthQuery: string): Promise<OAuthRedirect> {
  return api<OAuthRedirect>("/api/auth/oauth2/continue", {
    method: "POST",
    body: { postLogin: true, oauth_query: oauthQuery },
  });
}

/** Allow (with the accepted scopes) or refuse; either way the answer is where to go next. */
export function answerConsent(
  oauthQuery: string,
  answer: { accept: true; scope: string } | { accept: false }
): Promise<OAuthRedirect> {
  return api<OAuthRedirect>("/api/auth/oauth2/consent", {
    method: "POST",
    body: { ...answer, oauth_query: oauthQuery },
  });
}

export type ConnectSignInResult =
  OAuthRedirect | { twoFactorRedirect: true; twoFactorMethods?: string[] };

/** A password sign-in that carries the signed query, so the flow continues once a session exists. */
export function signInForConnection(args: {
  email: string;
  password: string;
  oauthQuery: string;
}): Promise<ConnectSignInResult> {
  return api<ConnectSignInResult>("/api/auth/sign-in/email", {
    method: "POST",
    body: { email: args.email, password: args.password, oauth_query: args.oauthQuery },
  });
}
