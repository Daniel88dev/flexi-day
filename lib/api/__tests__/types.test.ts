import { describe, it, expect } from "vitest";
import {
  AWAY_RECORD_TYPE,
  CalendarRecordType,
  isKnownCalendarRecordType,
  isKnownWireRecordType,
  writableRecordType,
  sickDayBenefitActive,
  type GroupOrganization,
} from "../types";

const organization = (over: Partial<GroupOrganization> = {}): GroupOrganization => ({
  id: "org-1",
  name: "Acme",
  plan: "PRO",
  status: "active",
  active: true,
  ...over,
});

describe("sickDayBenefitActive", () => {
  it("returns true only when the badge says the benefit is active", () => {
    expect(
      sickDayBenefitActive({ organization: organization({ sickDayBenefitActive: true }) })
    ).toBe(true);
    expect(
      sickDayBenefitActive({ organization: organization({ sickDayBenefitActive: false }) })
    ).toBe(false);
  });

  it("returns false when the flag is absent — a backend predating the benefit", () => {
    expect(sickDayBenefitActive({ organization: organization() })).toBe(false);
  });

  it("returns false for a missing group or organization", () => {
    expect(sickDayBenefitActive(undefined)).toBe(false);
    expect(sickDayBenefitActive(null)).toBe(false);
    expect(sickDayBenefitActive({ organization: null })).toBe(false);
    expect(sickDayBenefitActive({})).toBe(false);
  });
});

describe("isKnownCalendarRecordType", () => {
  it("accepts every current enum member", () => {
    for (const value of Object.values(CalendarRecordType)) {
      expect(isKnownCalendarRecordType(value)).toBe(true);
    }
  });

  it("rejects values a newer backend might serve", () => {
    expect(isKnownCalendarRecordType("SABBATICAL")).toBe(false);
    expect(isKnownCalendarRecordType("")).toBe(false);
  });
});

describe("isKnownWireRecordType", () => {
  it("accepts Away beside every stored type", () => {
    expect(isKnownWireRecordType("AWAY")).toBe(true);
    for (const value of Object.values(CalendarRecordType)) {
      expect(isKnownWireRecordType(value)).toBe(true);
    }
  });

  it("rejects values a newer backend might serve", () => {
    expect(isKnownWireRecordType("SABBATICAL")).toBe(false);
  });
});

describe("writableRecordType", () => {
  it("returns a stored type unchanged", () => {
    expect(writableRecordType(CalendarRecordType.Sick)).toBe(CalendarRecordType.Sick);
  });

  it("returns null for Away, which no write accepts", () => {
    expect(writableRecordType(AWAY_RECORD_TYPE)).toBeNull();
  });
});
