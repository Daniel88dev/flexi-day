import { describe, expect, it } from "vitest";
import { parseInviteInput } from "../parse-invite-input";

const TOKEN = "s3cr3t-token_abcdefghijklmnopqrstuvwxyz0123456";

describe("parseInviteInput", () => {
  it("reads the token from a full invite link", () => {
    expect(parseInviteInput(`https://app.flexi-day.com/join/?token=${TOKEN}`)).toEqual({
      kind: "link",
      token: TOKEN,
    });
  });

  it("accepts any origin, since dev, staging and prod links all redeem the same way", () => {
    expect(parseInviteInput(`http://localhost:3000/join/?token=${TOKEN}`)).toEqual({
      kind: "link",
      token: TOKEN,
    });
  });

  it("accepts the link without its trailing slash", () => {
    expect(parseInviteInput(`https://app.flexi-day.com/join?token=${TOKEN}`)).toEqual({
      kind: "link",
      token: TOKEN,
    });
  });

  it("accepts a link pasted without its scheme", () => {
    expect(parseInviteInput(`app.flexi-day.com/join/?token=${TOKEN}`)).toEqual({
      kind: "link",
      token: TOKEN,
    });
  });

  it("ignores surrounding whitespace", () => {
    expect(parseInviteInput(`  https://app.flexi-day.com/join/?token=${TOKEN}\n`)).toEqual({
      kind: "link",
      token: TOKEN,
    });
  });

  it("decodes a percent-encoded token", () => {
    expect(parseInviteInput("https://app.flexi-day.com/join/?token=a%2Bb")).toEqual({
      kind: "link",
      token: "a+b",
    });
  });

  it("flags a join link with no token as a broken link rather than a code", () => {
    expect(parseInviteInput("https://app.flexi-day.com/join/")).toEqual({ kind: "broken-link" });
    expect(parseInviteInput("https://app.flexi-day.com/join/?token=")).toEqual({
      kind: "broken-link",
    });
  });

  it("treats a bare code as a code, trimmed", () => {
    expect(parseInviteInput("  ABCD-EFGH-JKLM ")).toEqual({ kind: "code", code: "ABCD-EFGH-JKLM" });
  });

  it("treats anything that is not a join link as a code", () => {
    expect(parseInviteInput("https://app.flexi-day.com/groups/")).toEqual({
      kind: "code",
      code: "https://app.flexi-day.com/groups/",
    });
    expect(parseInviteInput("join")).toEqual({ kind: "code", code: "join" });
  });

  it("returns null for blank input", () => {
    expect(parseInviteInput("   ")).toBeNull();
  });
});
