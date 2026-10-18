import { describe, expect, it } from "vitest";
import { AWAY_RECORD_TYPE, CalendarRecordType, type VacationListItem } from "@/lib/api/types";
import { buildPreviewEntries, feedVacations } from "../preview";
import { newBuilderConfig } from "../meta";

const ME = "user-me";
const OTHER = "user-other";

function vac(over: Partial<VacationListItem> & { requestedDay: string }): VacationListItem {
  return {
    id: over.id ?? `v-${over.requestedDay}-${over.userId ?? ME}`,
    userId: over.userId ?? ME,
    groupId: over.groupId ?? "team-a",
    requestId: "r-1",
    requestedDay: over.requestedDay,
    startTime: null,
    endTime: null,
    vacationType: over.vacationType ?? CalendarRecordType.Vacation,
    halfDay: over.halfDay ?? false,
    note: over.note ?? null,
    rejectionReason: null,
    approvedAt: "2026-07-01T00:00:00.000Z",
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    deletedAt: null,
    deletedByUserId: null,
    createdByUserId: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    canApprove: false,
    user: over.user ?? {
      id: over.userId ?? ME,
      name: "Jane Doe",
      initials: "JD",
      avatarColor: "hsl(1 1% 1%)",
    },
  };
}

describe("feedVacations", () => {
  const july = { year: 2026, month: 7 };

  it("keeps only the requested month", () => {
    const cfg = newBuilderConfig();
    cfg.scope = "ME";
    cfg.types = [CalendarRecordType.Vacation];
    const items = [vac({ requestedDay: "2026-07-10" }), vac({ requestedDay: "2026-08-10" })];
    const out = feedVacations(cfg, items, ME, july.year, july.month);
    expect(out).toHaveLength(1);
    expect(out[0].requestedDay).toBe("2026-07-10");
  });

  it("in ME scope keeps only the current user's records", () => {
    const cfg = newBuilderConfig();
    cfg.scope = "ME";
    cfg.types = [CalendarRecordType.Vacation];
    const items = [
      vac({ requestedDay: "2026-07-10", userId: ME }),
      vac({ requestedDay: "2026-07-11", userId: OTHER }),
    ];
    const out = feedVacations(cfg, items, ME, july.year, july.month);
    expect(out.map((v) => v.userId)).toEqual([ME]);
  });

  it("in TEAM scope keeps records from included teams", () => {
    const cfg = newBuilderConfig();
    cfg.scope = "TEAM";
    cfg.teamIds = ["team-a"];
    cfg.types = [CalendarRecordType.Vacation];
    const items = [
      vac({ requestedDay: "2026-07-10", userId: OTHER, groupId: "team-a" }),
      vac({ requestedDay: "2026-07-11", userId: OTHER, groupId: "team-b" }),
    ];
    const out = feedVacations(cfg, items, ME, july.year, july.month);
    expect(out.map((v) => v.groupId)).toEqual(["team-a"]);
  });

  it("always includes selected bank holidays regardless of scope/team", () => {
    const cfg = newBuilderConfig();
    cfg.scope = "ME";
    cfg.types = [CalendarRecordType.BankHoliday];
    const items = [
      vac({
        requestedDay: "2026-07-04",
        userId: OTHER,
        groupId: "team-x",
        vacationType: CalendarRecordType.BankHoliday,
      }),
    ];
    expect(feedVacations(cfg, items, ME, july.year, july.month)).toHaveLength(1);
  });

  it("drops types that are not included", () => {
    const cfg = newBuilderConfig();
    cfg.scope = "ME";
    cfg.types = [CalendarRecordType.Vacation];
    const items = [vac({ requestedDay: "2026-07-10", vacationType: CalendarRecordType.Sick })];
    expect(feedVacations(cfg, items, ME, july.year, july.month)).toHaveLength(0);
  });
});

describe("buildPreviewEntries", () => {
  it("merges consecutive days of the same user+type into one range", () => {
    const cfg = newBuilderConfig();
    cfg.scope = "ME";
    cfg.types = [CalendarRecordType.Vacation];
    const items = [
      vac({ requestedDay: "2026-07-10" }),
      vac({ requestedDay: "2026-07-11" }),
      vac({ requestedDay: "2026-07-12" }),
    ];
    const entries = buildPreviewEntries(cfg, items, ME, 2026, 7);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ from: 10, to: 12, isMine: true, name: "You" });
  });

  it("does not merge across a gap", () => {
    const cfg = newBuilderConfig();
    cfg.scope = "ME";
    cfg.types = [CalendarRecordType.Vacation];
    const items = [vac({ requestedDay: "2026-07-10" }), vac({ requestedDay: "2026-07-14" })];
    const entries = buildPreviewEntries(cfg, items, ME, 2026, 7);
    expect(entries).toHaveLength(2);
  });

  it("labels other people by name", () => {
    const cfg = newBuilderConfig();
    cfg.scope = "TEAM";
    cfg.teamIds = ["team-a"];
    cfg.types = [CalendarRecordType.Vacation];
    const items = [
      vac({
        requestedDay: "2026-07-10",
        userId: OTHER,
        user: { id: OTHER, name: "Sam Lee", initials: "SL", avatarColor: "hsl(1 1% 1%)" },
      }),
    ];
    const entries = buildPreviewEntries(cfg, items, ME, 2026, 7);
    expect(entries[0]).toMatchObject({ isMine: false, name: "Sam Lee" });
  });
});

describe("buildPreviewEntries for other people's sick leave", () => {
  const sam = { id: OTHER, name: "Sam Lee", initials: "SL", avatarColor: "hsl(1 1% 1%)" };

  function teamSickConfig() {
    const cfg = newBuilderConfig();
    cfg.scope = "TEAM";
    cfg.teamIds = ["team-a"];
    cfg.types = [CalendarRecordType.Sick];
    return cfg;
  }

  it("shows a teammate's Away row in a feed that includes Sick, as Away with no note", () => {
    const items = [
      vac({
        requestedDay: "2026-07-10",
        userId: OTHER,
        user: sam,
        vacationType: AWAY_RECORD_TYPE,
      }),
    ];

    const entries = buildPreviewEntries(teamSickConfig(), items, ME, 2026, 7);

    expect(entries).toEqual([
      expect.objectContaining({ name: "Sam Lee", type: "AWAY", note: null, isMine: false }),
    ]);
  });

  it("shows another person's full Sick row as Away with no note, as the team feed does", () => {
    const items = [
      vac({
        requestedDay: "2026-07-10",
        userId: OTHER,
        user: sam,
        vacationType: CalendarRecordType.Sick,
        note: "Flu",
      }),
    ];

    const entries = buildPreviewEntries(teamSickConfig(), items, ME, 2026, 7);

    expect(entries).toEqual([expect.objectContaining({ type: "AWAY", note: null })]);
  });

  it("drops the note from another person's vacation, as the team feed does", () => {
    const cfg = teamSickConfig();
    cfg.types = [CalendarRecordType.Vacation];
    const items = [
      vac({ requestedDay: "2026-07-10", userId: OTHER, user: sam, note: "Family trip" }),
    ];

    const entries = buildPreviewEntries(cfg, items, ME, 2026, 7);

    expect(entries).toEqual([
      expect.objectContaining({ type: CalendarRecordType.Vacation, note: null }),
    ]);
  });

  it("keeps the viewer's own Sick and note", () => {
    const items = [
      vac({ requestedDay: "2026-07-10", vacationType: CalendarRecordType.Sick, note: "Flu" }),
    ];

    const entries = buildPreviewEntries(teamSickConfig(), items, ME, 2026, 7);

    expect(entries).toEqual([
      expect.objectContaining({ type: CalendarRecordType.Sick, note: "Flu", isMine: true }),
    ]);
  });

  it("leaves out a teammate's Away row when the feed doesn't include Sick", () => {
    const cfg = teamSickConfig();
    cfg.types = [CalendarRecordType.Vacation];
    const items = [
      vac({
        requestedDay: "2026-07-10",
        userId: OTHER,
        vacationType: AWAY_RECORD_TYPE,
      }),
    ];

    expect(buildPreviewEntries(cfg, items, ME, 2026, 7)).toEqual([]);
  });
});
