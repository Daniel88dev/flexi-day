import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import {
  acceptAiAgreement,
  dailyAiConnectionLimit,
  disableAiConnections,
  disableAssistant,
  enableAiConnections,
  enableAssistant,
  formatUsd,
  setAiConnectionsLevel,
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

describe("AI connections API", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({});
  });

  it("turns AI connections on at the chosen level with the agreement version", async () => {
    await enableAiConnections("org-1", { level: "write", agreementVersion: 1, tellMembers: true });
    expect(apiMock).toHaveBeenCalledWith(
      "/api/organization/ai/connections/enable?organizationId=org-1",
      { method: "POST", body: { level: "write", agreementVersion: 1, tellMembers: true } }
    );
  });

  it("changes the level", async () => {
    await setAiConnectionsLevel("org-1", "read");
    expect(apiMock).toHaveBeenCalledWith(
      "/api/organization/ai/connections/level?organizationId=org-1",
      { method: "POST", body: { level: "read" } }
    );
  });

  it("turns AI connections off", async () => {
    await disableAiConnections("org-1");
    expect(apiMock).toHaveBeenCalledWith(
      "/api/organization/ai/connections/disable?organizationId=org-1",
      { method: "POST" }
    );
  });
});

describe("dailyAiConnectionLimit", () => {
  it("returns 5,000 on Pro and 20,000 on Enterprise and Custom", () => {
    expect(dailyAiConnectionLimit("PRO")).toBe(5000);
    expect(dailyAiConnectionLimit("ENTERPRISE")).toBe(20000);
    expect(dailyAiConnectionLimit("CUSTOM")).toBe(20000);
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

describe("formatUsd", () => {
  it("writes whole dollars without cents and the rest with two decimals, per language", () => {
    expect(formatUsd("en", 10_000_000)).toBe("$10");
    expect(formatUsd("en", 8_604_999)).toBe("$8.60");
    expect(formatUsd("cs", 10_000_000)).toBe("10 $");
    expect(formatUsd("cs", 4_300_000)).toBe("4,30 $");
  });
});
