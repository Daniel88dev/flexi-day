"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateGroupInvite,
  useGroupInvites,
  useGroupUsers,
  useGroup,
  useRevokeGroupInvite,
  useSubscription,
} from "@/lib/api/queries";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Invite people by email. The code is shown alongside so an admin can pass it
 * on directly — useful when the mail bounces, and the only way to recover an
 * invite whose email never arrived.
 */
export function InvitesTab({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) {
  const { t } = useTranslation();
  const invitesQuery = useGroupInvites(groupId, isAdmin);
  const createInvite = useCreateGroupInvite();
  const revokeInvite = useRevokeGroupInvite(groupId);
  const membersQuery = useGroupUsers(groupId);
  const groupQuery = useGroup(groupId);
  const billingQuery = useSubscription();

  // Entitlements come from the viewer's own organization, so they only describe
  // this group when the viewer owns it. For a group in someone else's org the
  // caps are theirs, not ours — show nothing and let the backend decide.
  const group = groupQuery.data;
  const ownsThisGroup =
    billingQuery.data?.organization != null &&
    group?.organizationId === billingQuery.data.organization.id;

  // Mirrors the backend gate: pending invites reserve their seat.
  const maxMembers = ownsThisGroup ? billingQuery.data?.entitlements.maxMembersPerGroup : undefined;
  const seatsTaken = (membersQuery.data?.length ?? 0) + (invitesQuery.data?.length ?? 0);
  const atMemberCap = maxMembers !== undefined && seatsTaken >= maxMembers;

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ email: string; delivered: boolean } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isAdmin) {
    return <p className="text-muted-foreground text-sm">{t.groupDetail.invites.adminOnly}</p>;
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const result = await createInvite.mutateAsync({ groupId, email: email.trim() });
      setNotice({ email: email.trim(), delivered: result.emailDelivered });
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.groupDetail.invites.failed);
    }
  }

  async function copyCode(id: string, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
    } catch {
      // Clipboard access can be denied; the code is visible on screen anyway.
    }
  }

  const invites = invitesQuery.data ?? [];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>{t.groupDetail.invites.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[260px] flex-1 space-y-1.5">
              <Label htmlFor="inviteEmail">{t.groupDetail.invites.emailLabel}</Label>
              <Input
                id="inviteEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.groupDetail.invites.emailPlaceholder}
              />
            </div>
            <Button type="submit" disabled={createInvite.isPending || !email.trim() || atMemberCap}>
              {createInvite.isPending ? t.groupDetail.invites.sending : t.groupDetail.invites.send}
            </Button>
          </form>
          {atMemberCap && maxMembers !== undefined ? (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span>{t.billing.memberLimitReached(maxMembers)}</span>
              <Link
                href="/billing"
                className="text-primary font-semibold underline underline-offset-2"
              >
                {t.billing.upgrade}
              </Link>
            </p>
          ) : null}
          {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}
          {notice ? (
            <p
              className={cn(
                "mt-3 text-sm",
                notice.delivered ? "text-green-700 dark:text-green-400" : "text-amber-700"
              )}
            >
              {notice.delivered
                ? t.groupDetail.invites.sent(notice.email)
                : t.groupDetail.invites.sentNoEmail(notice.email)}
            </p>
          ) : null}
          <p className="text-muted-foreground mt-3 text-xs">{t.groupDetail.invites.note}</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">{t.groupDetail.invites.pendingTitle}</h2>
        {invitesQuery.error ? (
          <p className="text-destructive text-sm">{invitesQuery.error.message}</p>
        ) : invitesQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">{t.common.loading}</p>
        ) : invites.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t.groupDetail.invites.none}</p>
        ) : (
          <div className="border-border overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.groupDetail.invites.columns.email}</TableHead>
                  <TableHead>{t.groupDetail.invites.columns.code}</TableHead>
                  <TableHead>{t.groupDetail.invites.columns.expires}</TableHead>
                  <TableHead className="text-right">{t.groupDetail.columns.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="text-sm">{invite.email}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => void copyCode(invite.id, invite.code)}
                        title={t.groupDetail.invites.copy}
                        className="bg-muted hover:ring-foreground/30 rounded px-2 py-1 font-mono text-xs tracking-wider hover:ring-1"
                      >
                        {copiedId === invite.id ? t.groupDetail.invites.copied : invite.code}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(invite.expiresAt).toLocaleDateString(t.common.dateLocale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={revokeInvite.isPending}
                        onClick={() => revokeInvite.mutate(invite.id)}
                      >
                        {t.groupDetail.invites.revoke}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
