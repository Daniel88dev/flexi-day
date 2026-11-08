import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  acceptAiAgreement,
  disableAssistant,
  enableAssistant,
  getAiSettings,
  memberNoticeText,
  nextWeeklyReset,
} from "../ai-settings";

describe("ai settings API", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({});
  });

  it("reads the AI settings of the named organization", async () => {
    await getAiSettings("org 1");
    expect(apiMock).toHaveBeenCalledWith("/api/organization/ai?organizationId=org%201");
  });

  it("turns the Assistant on with the agreement version and Tell members", async () => {
    await enableAssistant("org-1", { agreementVersion: 1, tellMembers: true });
    expect(apiMock).toHaveBeenCalledWith(
      "/api/organization/ai/assistant/enable?organizationId=org-1",
      { method: "POST", body: { agreementVersion: 1, tellMembers: true } }
    );
  });

  it("turns the Assistant off", async () => {
    await disableAssistant("org-1");
    expect(apiMock).toHaveBeenCalledWith(
      "/api/organization/ai/assistant/disable?organizationId=org-1",
      { method: "POST" }
    );
  });

  it("accepts a new agreement version", async () => {
    await acceptAiAgreement("org-1", 2);
    expect(apiMock).toHaveBeenCalledWith("/api/organization/ai/agreement?organizationId=org-1", {
      method: "POST",
      body: { agreementVersion: 2 },
    });
  });
});

describe("memberNoticeText", () => {
  it("returns the title and body as one paragraph", () => {
    expect(memberNoticeText({ title: "Acme turned on the Assistant.", body: "Ask it." })).toBe(
      "Acme turned on the Assistant. Ask it."
    );
  });
});

describe("nextWeeklyReset", () => {
  it("returns the coming Monday at 00:00 UTC", () => {
    expect(nextWeeklyReset(new Date("2026-11-08T10:00:00Z")).toISOString()).toBe(
      "2026-11-09T00:00:00.000Z"
    );
    expect(nextWeeklyReset(new Date("2026-11-11T23:59:00Z")).toISOString()).toBe(
      "2026-11-16T00:00:00.000Z"
    );
  });

  it("returns the following Monday once this Monday's reset has passed", () => {
    expect(nextWeeklyReset(new Date("2026-11-09T00:00:00Z")).toISOString()).toBe(
      "2026-11-16T00:00:00.000Z"
    );
  });
});
