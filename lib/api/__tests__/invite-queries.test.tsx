import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const previewInviteMock = vi.fn();
const joinGroupByLinkMock = vi.fn();
vi.mock("../group-users", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../group-users")>()),
  previewInvite: (...args: unknown[]) => previewInviteMock(...args),
  joinGroupByLink: (...args: unknown[]) => joinGroupByLinkMock(...args),
}));

import { qk, useInvitePreview, useJoinGroupByLink } from "../queries";

function wrapperWith(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const newClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

describe("qk.invitePreview", () => {
  it("keeps the secret out of the key, which reaches Sentry on failure", () => {
    expect(JSON.stringify(qk.invitePreview("s3cr3t-token"))).not.toContain("s3cr3t-token");
    expect(qk.invitePreview("a")).not.toEqual(qk.invitePreview("b"));
  });
});

describe("useInvitePreview", () => {
  beforeEach(() => previewInviteMock.mockReset());

  it("asks nothing without a token", () => {
    renderHook(() => useInvitePreview(""), { wrapper: wrapperWith(newClient()) });
    expect(previewInviteMock).not.toHaveBeenCalled();
  });

  it("returns the preview for a token", async () => {
    previewInviteMock.mockResolvedValue({ groupName: "Platform" });
    const { result } = renderHook(() => useInvitePreview("tok"), {
      wrapper: wrapperWith(newClient()),
    });

    await waitFor(() => expect(result.current.data).toEqual({ groupName: "Platform" }));
    expect(previewInviteMock).toHaveBeenCalledWith("tok");
  });
});

describe("useJoinGroupByLink", () => {
  it("refetches the caller's groups after joining", async () => {
    joinGroupByLinkMock.mockResolvedValue({ id: "m-1", groupId: "g-1" });
    const client = newClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useJoinGroupByLink(), { wrapper: wrapperWith(client) });

    result.current.mutate("tok");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(joinGroupByLinkMock).toHaveBeenCalledWith("tok");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.groups() });
  });
});
