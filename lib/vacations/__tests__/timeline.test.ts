import { describe, expect, it } from "vitest";
import { CalendarRecordType, type Attachment, type VacationDetail } from "@/lib/api/types";
import { mergeTimeline, namedPeople, resolveActor } from "../timeline";

const dana = { id: "u-1", name: "Dana Holt", initials: "DH", avatarColor: "x" };
const ada = { id: "u-2", name: "Ada Lovelace", initials: "AL", avatarColor: "y" };

const detail: VacationDetail = {
  id: "v-1",
  userId: "u-1",
  groupId: "g-1",
  groupName: "Platform",
  requestedDay: "2026-08-12",
  rangeStart: "2026-08-12",
  rangeEnd: "2026-08-12",
  vacationIds: ["v-1"],
  requestId: "r-1",
  startTime: null,
  endTime: null,
  vacationType: CalendarRecordType.Vacation,
  halfDay: false,
  note: null,
  rejectionReason: null,
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectedBy: null,
  deletedAt: null,
  deletedByUserId: null,
  createdByUserId: null,
  createdAt: "2026-07-20T09:00:00.000Z",
  updatedAt: "2026-07-20T09:00:00.000Z",
  user: dana,
  approvedByUser: null,
  rejectedByUser: null,
  createdByUser: null,
  deletedByUser: null,
  canApprove: false,
  canCancel: true,
  canEdit: false,
  history: [
    {
      id: "e-1",
      vacationId: "v-1",
      eventType: "CREATED",
      actor: dana,
      reason: null,
      createdAt: "2026-07-20T09:00:00.000Z",
    },
    {
      id: "e-2",
      vacationId: "v-1",
      eventType: "APPROVED",
      actor: ada,
      reason: null,
      createdAt: "2026-08-01T09:00:00.000Z",
    },
  ],
};

const note: Attachment = {
  id: "a-1",
  requestId: "r-1",
  fileName: "doctors-note.jpg",
  contentType: "image/jpeg",
  size: 2048,
  status: "READY",
  rejectionReason: null,
  uploadedByUserId: "u-1",
  createdAt: "2026-07-21T09:00:00.000Z",
  deletedAt: null,
  deletedByUserId: null,
};

describe("mergeTimeline", () => {
  it("returns the history alone when the payload carries no attachments", () => {
    expect(mergeTimeline(detail).map((entry) => entry.kind)).toEqual(["CREATED", "APPROVED"]);
  });

  it("slots an added entry per attachment into the history by time", () => {
    const entries = mergeTimeline({ ...detail, attachments: [note] });

    expect(entries.map((entry) => entry.kind)).toEqual(["CREATED", "ATTACHMENT_ADDED", "APPROVED"]);
    expect(entries[1]).toMatchObject({
      id: "ATTACHMENT_ADDED-a-1",
      actor: { kind: "named", user: dana },
      fileName: "doctors-note.jpg",
      createdAt: "2026-07-21T09:00:00.000Z",
    });
  });

  it("adds a removed entry for a soft-deleted attachment, naming who removed it", () => {
    const removed = {
      ...note,
      deletedAt: "2026-08-02T09:00:00.000Z",
      deletedByUserId: "u-2",
    };
    const entries = mergeTimeline({ ...detail, attachments: [removed] });

    expect(entries.map((entry) => entry.kind)).toEqual([
      "CREATED",
      "ATTACHMENT_ADDED",
      "APPROVED",
      "ATTACHMENT_REMOVED",
    ]);
    expect(entries[3]).toMatchObject({
      id: "ATTACHMENT_REMOVED-a-1",
      actor: { kind: "named", user: ada },
      fileName: "doctors-note.jpg",
      createdAt: "2026-08-02T09:00:00.000Z",
    });
  });

  it("keeps a history event ahead of an attachment stamped at the same moment", () => {
    const entries = mergeTimeline({
      ...detail,
      attachments: [{ ...note, createdAt: "2026-07-20T09:00:00.000Z" }],
    });

    expect(entries.map((entry) => entry.kind)).toEqual(["CREATED", "ATTACHMENT_ADDED", "APPROVED"]);
  });

  it("tells an actor the detail cannot name from a removed account", () => {
    const entries = mergeTimeline({
      ...detail,
      attachments: [
        { ...note, uploadedByUserId: "u-admin" },
        { ...note, id: "a-2", uploadedByUserId: null },
      ],
    });

    expect(entries[1].actor).toEqual({ kind: "unnamed" });
    expect(entries[2].actor).toEqual({ kind: "gone" });
  });

  it("gives a file that never passed the checks no added entry, only a removal if cleared", () => {
    const rejected = {
      ...note,
      status: "REJECTED" as const,
      rejectionReason: "PDF_JAVASCRIPT" as const,
    };
    const cleared = {
      ...rejected,
      id: "a-2",
      deletedAt: "2026-08-02T09:00:00.000Z",
      deletedByUserId: "u-2",
    };
    const entries = mergeTimeline({ ...detail, attachments: [rejected, cleared] });

    expect(entries.map((entry) => [entry.kind, entry.id])).toEqual([
      ["CREATED", "e-1"],
      ["APPROVED", "e-2"],
      ["ATTACHMENT_REMOVED", "ATTACHMENT_REMOVED-a-2"],
    ]);
  });

  it("names an actor who only appears in the history", () => {
    const entries = mergeTimeline({
      ...detail,
      attachments: [{ ...note, uploadedByUserId: "u-2" }],
    });

    expect(entries[1].actor).toEqual({ kind: "named", user: ada });
  });

  it("marks a history event whose account is gone the same way", () => {
    const entries = mergeTimeline({
      ...detail,
      history: [{ ...detail.history[0], actor: null }],
    });

    expect(entries[0].actor).toEqual({ kind: "gone" });
  });
});

describe("resolveActor", () => {
  it("names a listed person, and tells a removed account from an unlisted one", () => {
    expect(resolveActor([dana], "u-1")).toEqual({ kind: "named", user: dana });
    expect(resolveActor([dana], null)).toEqual({ kind: "gone" });
    expect(resolveActor([dana], "u-9")).toEqual({ kind: "unnamed" });
  });
});

describe("namedPeople", () => {
  it("collects everyone the detail names, without repeats", () => {
    const people = namedPeople({ ...detail, createdByUser: ada, deletedByUser: dana });

    expect(people).toEqual([dana, ada]);
  });
});
