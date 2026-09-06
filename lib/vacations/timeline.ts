import type {
  Attachment,
  UserSummary,
  VacationDetail,
  VacationEvent,
  VacationEventKind,
} from "@/lib/api/types";

export type TimelineKind = VacationEventKind | "ATTACHMENT_ADDED" | "ATTACHMENT_REMOVED";

/**
 * Who did something. `gone` is an account since removed; `unnamed` is a user
 * the detail carries no summary for, which only an admin acting from outside
 * the record's cast can be.
 */
export type TimelineActor =
  { kind: "named"; user: UserSummary } | { kind: "gone" } | { kind: "unnamed" };

export type TimelineEntry = {
  id: string;
  kind: TimelineKind;
  actor: TimelineActor;
  reason: string | null;
  fileName: string | null;
  createdAt: string;
};

/** Everyone the detail names, once each: the owner, deciders and history actors. */
export function namedPeople(detail: VacationDetail): UserSummary[] {
  const seen = new Map<string, UserSummary>();
  const candidates = [
    detail.user,
    detail.createdByUser,
    detail.approvedByUser,
    detail.rejectedByUser,
    detail.deletedByUser,
    ...detail.history.map((event) => event.actor),
  ];
  for (const person of candidates) {
    if (person && !seen.has(person.id)) seen.set(person.id, person);
  }
  return Array.from(seen.values());
}

export function resolveActor(people: readonly UserSummary[], userId: string | null): TimelineActor {
  if (userId === null) return { kind: "gone" };
  const user = people.find((p) => p.id === userId);
  return user ? { kind: "named", user } : { kind: "unnamed" };
}

function fromEvent(event: VacationEvent): TimelineEntry {
  return {
    id: event.id,
    kind: event.eventType,
    actor: event.actor ? { kind: "named", user: event.actor } : { kind: "gone" },
    reason: event.reason,
    fileName: null,
    createdAt: event.createdAt,
  };
}

function fromAttachment(
  attachment: Attachment,
  people: readonly UserSummary[],
  moment: { kind: "ATTACHMENT_ADDED" | "ATTACHMENT_REMOVED"; by: string | null; at: string }
): TimelineEntry {
  return {
    id: `${moment.kind}-${attachment.id}`,
    kind: moment.kind,
    actor: resolveActor(people, moment.by),
    reason: null,
    fileName: attachment.fileName,
    createdAt: moment.at,
  };
}

/**
 * The history with the attachments folded in: one entry for each file that
 * was accepted and one for each removed, in time order. Attachments carry no
 * events of their own, so they are read off the rows; a file that never got
 * past the checks was never attached, so it gets no entry until someone
 * clears it. A history event stamped at the same moment as a file stays
 * ahead of it.
 */
export function mergeTimeline(detail: VacationDetail): TimelineEntry[] {
  const people = namedPeople(detail);
  const entries = detail.history.map(fromEvent);
  for (const attachment of detail.attachments ?? []) {
    if (attachment.status === "READY") {
      entries.push(
        fromAttachment(attachment, people, {
          kind: "ATTACHMENT_ADDED",
          by: attachment.uploadedByUserId,
          at: attachment.createdAt,
        })
      );
    }
    if (attachment.deletedAt) {
      entries.push(
        fromAttachment(attachment, people, {
          kind: "ATTACHMENT_REMOVED",
          by: attachment.deletedByUserId,
          at: attachment.deletedAt,
        })
      );
    }
  }
  return entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
