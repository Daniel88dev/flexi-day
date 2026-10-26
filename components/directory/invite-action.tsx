"use client";

import { useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { pushToast } from "@/components/toast";
import { errorCopy } from "@/lib/api/client";
import type { DirectoryProfile } from "@/lib/api/directory";
import {
  useDirectoryOrganizations,
  useOrganization,
  useSendDirectoryInvite,
} from "@/lib/api/queries";
import { administers } from "@/lib/directory/directory-access";
import { profileEditHref } from "@/lib/directory/routes";
import { useTranslation } from "@/lib/i18n/use-translation";

/** Send directory invite on the profile of a person without an account. */
export function InviteAction({ profile }: { profile: DirectoryProfile }) {
  const { t } = useTranslation();
  const copy = t.directory.invite;
  const [open, setOpen] = useState(false);
  const organization = useDirectoryOrganizations().data?.find(
    (entry) => entry.organizationId === profile.organizationId
  );
  const lapsed = organization ? !organization.writable : false;
  const sent = profile.markers.includes("INVITE_SENT");

  return (
    <>
      {lapsed ? <span className="text-muted-foreground text-xs">{copy.lapsed}</span> : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={lapsed}
        onClick={() => setOpen(true)}
      >
        <Send className="h-4 w-4" aria-hidden />
        {sent ? copy.again : copy.action}
      </Button>
      {open ? (
        <InviteDialog
          profile={profile}
          sent={sent}
          administers={!!organization && administers(organization)}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function InviteDialog({
  profile,
  sent,
  administers,
  onClose,
}: {
  profile: DirectoryProfile;
  sent: boolean;
  administers: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const copy = t.directory.invite;
  const email = profile.account?.signInEmail ?? null;
  const send = useSendDirectoryInvite(profile.organizationId, profile.employmentId);
  const groups = useOrganization(administers ? profile.organizationId : null).data?.groups ?? [];
  const [groupId, setGroupId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    try {
      const result = await send.mutateAsync(groupId || null);
      pushToast(result.emailDelivered ? copy.done(result.invite.email) : copy.notDelivered);
      onClose();
    } catch (err) {
      setError(errorCopy(err, copy.errors, copy.errors.failed));
    }
  }

  return (
    <Dialog open onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title(profile.name)}</DialogTitle>
          <DialogDescription>{email ? copy.description(email) : copy.noEmail}</DialogDescription>
        </DialogHeader>
        {email ? (
          <div className="space-y-3">
            {groups.length > 0 ? (
              <div className="space-y-1.5">
                <Label htmlFor="invite-group">{copy.group}</Label>
                <select
                  id="invite-group"
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  value={groupId}
                  onChange={(event) => setGroupId(event.target.value)}
                  aria-describedby="invite-group-hint"
                >
                  <option value="">{copy.noGroup}</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.groupName}
                    </option>
                  ))}
                </select>
                <p id="invite-group-hint" className="text-muted-foreground text-xs">
                  {copy.groupHint}
                </p>
              </div>
            ) : null}
            {sent ? <p className="text-muted-foreground text-sm">{copy.resendNote}</p> : null}
            {error ? (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {copy.cancel}
          </Button>
          {email ? (
            <Button type="button" onClick={submit} disabled={send.isPending}>
              {send.isPending ? copy.sending : copy.confirm}
            </Button>
          ) : (
            <Button asChild>
              <Link href={profileEditHref(profile.organizationId, profile.employmentId, "record")}>
                {copy.addEmail}
              </Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
