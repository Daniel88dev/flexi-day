import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithClient } from "@/lib/test-utils";
import type { AiAvailability } from "@/lib/api/ai-features";

const getAiAvailabilityMock = vi.fn();
vi.mock("@/lib/api/ai-features", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/ai-features")>()),
  getAiAvailability: () => getAiAvailabilityMock(),
}));

import { AiFeatureGate } from "../ai-feature-gate";
import type { QueryClient } from "@tanstack/react-query";

const settled = (client: QueryClient, status: "success" | "error" = "success") =>
  waitFor(() =>
    expect(
      client
        .getQueryCache()
        .getAll()
        .map((query) => query.state.status)
    ).toEqual([status])
  );

const NEITHER: AiAvailability = {
  assistant: false,
  aiConnections: false,
  organizations: [
    {
      organizationId: "org-1",
      assistant: false,
      aiConnections: false,
      newAgreementVersionReady: false,
    },
  ],
};

const PREVIEW_ONLY: AiAvailability = {
  assistant: true,
  aiConnections: true,
  organizations: [
    {
      organizationId: "org-1",
      assistant: false,
      aiConnections: false,
      newAgreementVersionReady: false,
    },
    {
      organizationId: "org-preview",
      assistant: true,
      aiConnections: true,
      newAgreementVersionReady: false,
    },
  ],
};

function renderEntryPoints(organizationId?: string) {
  return renderWithClient(
    <>
      <AiFeatureGate feature="assistant" organizationId={organizationId}>
        <button type="button">Assistant</button>
      </AiFeatureGate>
      <AiFeatureGate feature="aiConnections" organizationId={organizationId}>
        <button type="button">Connect an AI app</button>
      </AiFeatureGate>
      <p>Page content</p>
    </>
  );
}

describe("AiFeatureGate", () => {
  beforeEach(() => {
    getAiAvailabilityMock.mockReset();
  });

  it("shows no AI entry point where neither feature is available", async () => {
    getAiAvailabilityMock.mockResolvedValue(NEITHER);
    const { client } = renderEntryPoints("org-1");

    await settled(client);
    expect(screen.queryByRole("button", { name: "Assistant" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Connect an AI app" })).toBeNull();
  });

  it("shows nothing while the answer is loading", () => {
    getAiAvailabilityMock.mockReturnValue(new Promise(() => {}));
    renderEntryPoints();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows nothing when the answer fails", async () => {
    getAiAvailabilityMock.mockRejectedValue(new Error("network"));
    const { client } = renderEntryPoints();
    await settled(client, "error");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows the entry points for an organization on the preview list only", async () => {
    getAiAvailabilityMock.mockResolvedValue(PREVIEW_ONLY);

    const preview = renderEntryPoints("org-preview");
    expect(await screen.findByRole("button", { name: "Assistant" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connect an AI app" })).toBeTruthy();
    preview.unmount();

    const { client } = renderEntryPoints("org-1");
    await settled(client);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows an entry point that names no organization when the caller has the feature anywhere", async () => {
    getAiAvailabilityMock.mockResolvedValue(PREVIEW_ONLY);
    renderEntryPoints();
    expect(await screen.findByRole("button", { name: "Assistant" })).toBeTruthy();
  });
});
