import type { InvitePreview } from "@/lib/api/types";
import type { Dictionary } from "@/lib/i18n";

export type InviteCopy = { title: string; description: string; join: string };

/** The join screen's title, description and button: a directory invite names no group. */
export function inviteCopy(
  t: Dictionary,
  invite: Pick<InvitePreview, "groupId" | "groupName" | "organizationName" | "inviterName">
): InviteCopy {
  const { inviterName, organizationName } = invite;
  if (invite.groupId === null) {
    return {
      title: t.join.directoryTitle(organizationName),
      description: inviterName
        ? t.join.directoryInvitedBy(inviterName, organizationName)
        : t.join.directoryInvitedByUnknown(organizationName),
      join: t.join.directoryJoin,
    };
  }
  return {
    title: t.join.title(invite.groupName ?? ""),
    description: inviterName ? t.join.invitedBy(inviterName) : t.join.invitedByUnknown,
    join: t.join.join,
  };
}
