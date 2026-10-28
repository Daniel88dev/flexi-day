import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/dictionaries/en";
import type { InvitePreview } from "@/lib/api/types";
import { inviteCopy } from "../invite-copy";

const invite = (over: Partial<InvitePreview>): InvitePreview => ({
  groupId: null,
  groupName: null,
  organizationName: "Northwind",
  personName: null,
  inviterName: "Dana",
  invitedEmail: "jo@northwind.co",
  status: "open",
  expiresAt: "2026-11-01T00:00:00Z",
  ...over,
});

describe("inviteCopy", () => {
  it("returns the directory copy for an invite that names no group", () => {
    expect(inviteCopy(en, invite({}))).toEqual({
      title: en.join.directoryTitle("Northwind"),
      description: en.join.directoryInvitedBy("Dana", "Northwind"),
      join: en.join.directoryJoin,
    });
  });

  it("returns the directory copy without an inviter", () => {
    expect(inviteCopy(en, invite({ inviterName: null })).description).toBe(
      en.join.directoryInvitedByUnknown("Northwind")
    );
  });

  it("returns the group copy for a group invite", () => {
    expect(inviteCopy(en, invite({ groupId: "g-1", groupName: "Design" }))).toEqual({
      title: en.join.title("Design"),
      description: en.join.invitedBy("Dana"),
      join: en.join.join,
    });
  });

  it("returns the group copy without an inviter", () => {
    expect(
      inviteCopy(en, invite({ groupId: "g-1", groupName: "Design", inviterName: null })).description
    ).toBe(en.join.invitedByUnknown);
  });
});
