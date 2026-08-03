import { describe, expect, it } from "vitest";
import { notificationTarget, withVacationId } from "../vacation-detail-url";

describe("notificationTarget", () => {
  it("returns null without an href", () => {
    expect(notificationTarget(null)).toBeNull();
  });

  it("reads the request out of an absolute backend href", () => {
    expect(notificationTarget("http://localhost:3000/requests/?vacationId=v-1")).toEqual({
      kind: "vacation",
      vacationId: "v-1",
    });
  });

  it("reads the request out of a relative href", () => {
    expect(notificationTarget("/requests/?vacationId=v-1")).toEqual({
      kind: "vacation",
      vacationId: "v-1",
    });
  });

  it("ignores the origin the backend rendered the href against", () => {
    expect(notificationTarget("https://app.example.com/groups/?groupId=g-1")).toEqual({
      kind: "link",
      href: "/groups/?groupId=g-1",
    });
  });

  it("falls back to an ordinary link when there is no vacation id", () => {
    expect(notificationTarget("/settings/")).toEqual({ kind: "link", href: "/settings/" });
  });

  it("returns null for an unparseable href", () => {
    expect(notificationTarget("http://")).toBeNull();
  });
});

describe("withVacationId", () => {
  it("adds the id to an empty query", () => {
    expect(withVacationId("", "v-1")).toBe("?vacationId=v-1");
  });

  it("keeps the rest of the query intact", () => {
    expect(withVacationId("tab=quotas", "v-1")).toBe("?tab=quotas&vacationId=v-1");
  });

  it("replaces an id that is already there", () => {
    expect(withVacationId("vacationId=v-1", "v-2")).toBe("?vacationId=v-2");
  });

  it("removes the id and leaves the rest", () => {
    expect(withVacationId("tab=quotas&vacationId=v-1", null)).toBe("?tab=quotas");
  });

  it("returns an empty string when nothing is left", () => {
    expect(withVacationId("?vacationId=v-1", null)).toBe("");
  });
});
