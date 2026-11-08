import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import { getAiAvailability, isAiFeatureAvailable, type AiAvailability } from "../ai-features";

const PREVIEW: AiAvailability = {
  assistant: true,
  aiConnections: true,
  organizations: [
    {
      organizationId: "org-preview",
      assistant: true,
      aiConnections: true,
      newAgreementVersionReady: false,
    },
    {
      organizationId: "org-other",
      assistant: false,
      aiConnections: false,
      newAgreementVersionReady: false,
    },
  ],
};

describe("getAiAvailability", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("GETs the caller's availability", async () => {
    apiMock.mockResolvedValue(PREVIEW);
    await expect(getAiAvailability()).resolves.toEqual(PREVIEW);
    expect(apiMock).toHaveBeenCalledWith("/api/ai-features/availability");
  });
});

describe("isAiFeatureAvailable", () => {
  it("returns false before the answer arrives", () => {
    expect(isAiFeatureAvailable(undefined, "assistant")).toBe(false);
  });

  it("returns the top-level flag when no organization is named", () => {
    expect(isAiFeatureAvailable(PREVIEW, "aiConnections")).toBe(true);
    expect(isAiFeatureAvailable({ ...PREVIEW, aiConnections: false }, "aiConnections")).toBe(false);
  });

  it("returns the named organization's flag", () => {
    expect(isAiFeatureAvailable(PREVIEW, "assistant", "org-preview")).toBe(true);
    expect(isAiFeatureAvailable(PREVIEW, "assistant", "org-other")).toBe(false);
  });

  it("returns false for an organization the answer does not list", () => {
    expect(isAiFeatureAvailable(PREVIEW, "assistant", "org-unknown")).toBe(false);
  });
});
