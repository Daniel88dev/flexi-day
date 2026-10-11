import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { en } from "@/lib/i18n/dictionaries/en";
import { relativeTime } from "../relative-time";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-11T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("relativeTime", () => {
  it.each([
    ["2026-10-11T11:59:50.000Z", "just now"],
    ["2026-10-11T11:55:00.000Z", "5 min ago"],
    ["2026-10-11T10:00:00.000Z", "2 hours ago"],
    ["2026-10-10T12:00:00.000Z", "yesterday"],
    ["2026-10-06T12:00:00.000Z", "5 days ago"],
  ])("returns a relative label for %s", (iso, label) => {
    expect(relativeTime(iso, en)).toBe(label);
  });

  it("returns a short date once it is a month old", () => {
    expect(relativeTime("2026-08-01T12:00:00.000Z", en)).toBe(
      new Date("2026-08-01T12:00:00.000Z").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })
    );
  });
});
