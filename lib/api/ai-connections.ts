import { api } from "./client";

/** An AI app as the backend checked it: `host` is checked only when `verified`. */
export type AiConnectionApp = {
  clientId: string;
  name: string | null;
  verified: boolean;
  host: string;
};

export type AiConnectionAccess = "read" | "write";

/** One of the caller's grants: one app in one organization. */
export type MyAiConnection = {
  grantId: string;
  app: AiConnectionApp;
  organizationId: string;
  organizationName: string | null;
  access: AiConnectionAccess;
  connectedAt: string;
  /** The last token the app got for this grant, so accurate to about an hour. */
  lastUsedAt: string;
};

export type MyAiConnections = { serverUrl: string; connections: MyAiConnection[] };

/** One grant in an organization, for the owner's lower and off dialogs. */
export type OrganizationAiConnection = {
  grantId: string;
  app: AiConnectionApp;
  userId: string;
  personName: string;
  access: AiConnectionAccess;
};

export function getMyAiConnections(): Promise<MyAiConnections> {
  return api<MyAiConnections>("/api/users/me/ai-connections");
}

export function disconnectAiConnection(grantId: string): Promise<void> {
  return api<void>(`/api/users/me/ai-connections/${encodeURIComponent(grantId)}`, {
    method: "DELETE",
  });
}

/** The app's own name, or its address when it gave none. */
export function appLabel(app: AiConnectionApp): string {
  return app.name?.trim() || app.host || app.clientId;
}
