import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import { joinGroupByLink, previewInvite, signUpWithInvite } from "../group-users";

describe("invite link api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({});
  });

  it("previewInvite POSTs the token in the body, never the URL", async () => {
    await previewInvite("s3cr3t");
    expect(apiMock).toHaveBeenCalledWith("/api/auth/invite/preview", {
      method: "POST",
      body: { token: "s3cr3t" },
    });
  });

  it("joinGroupByLink POSTs the token in the body, never the URL", async () => {
    await joinGroupByLink("s3cr3t");
    expect(apiMock).toHaveBeenCalledWith("/api/auth/invite/join", {
      method: "POST",
      body: { token: "s3cr3t" },
    });
  });

  it("signUpWithInvite POSTs the token and the new account in the body", async () => {
    const input = {
      token: "s3cr3t",
      name: "Dana Holt",
      email: "dana@northwind.co",
      password: "sturdy-passphrase",
    };
    await signUpWithInvite(input);
    expect(apiMock).toHaveBeenCalledWith("/api/auth/invite/sign-up", {
      method: "POST",
      body: input,
    });
  });
});
