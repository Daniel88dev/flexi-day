"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pushToast } from "@/components/toast";
import {
  FRESH_SIGN_IN_MS,
  deletionRefusal,
  type DeletionBlocker,
} from "@/lib/api/account-deletion";
import {
  qk,
  useAccountDeletionStatus,
  useDeleteMyAccount,
  useOrganizations,
} from "@/lib/api/queries";
import { authClient, useSession } from "@/lib/auth-client";
import { useOpenBillingPortal } from "@/lib/billing/use-open-billing-portal";
import type { Dictionary } from "@/lib/i18n";
import { useTranslation } from "@/lib/i18n/use-translation";

const LINK_PARAM = "delete-account";
/** App Store review and the phone link here, so this exact URL is a contract. */
const DELETE_ACCOUNT_LINK = `/settings/?${LINK_PARAM}`;

/**
 * Lets the signed-in user delete their own account. Reads `useSearchParams`, so
 * it must sit inside a Suspense boundary.
 *
 * `layoutReady` says the cards above have their final height. The direct link
 * scrolls only then, or a card appearing above would push this one out of view.
 */
export function DeleteAccountCard({ layoutReady }: { layoutReady: boolean }) {
  const { t } = useTranslation();
  const d = t.settings.deleteAccount;
  const qc = useQueryClient();
  const params = useSearchParams();
  const { data: session } = useSession();
  const statusQuery = useAccountDeletionStatus();
  const organizationsQuery = useOrganizations();
  const deleteAccount = useDeleteMyAccount();
  const portal = useOpenBillingPortal();
  const titleId = useId();
  const passwordErrorId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);

  const [password, setPassword] = useState("");
  const [passwordInvalid, setPasswordInvalid] = useState(false);
  const [reauthRequired, setReauthRequired] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const linkedHere = params.has(LINK_PARAM);
  const statusSettled = !statusQuery.isPending;

  useEffect(() => {
    if (!linkedHere || !layoutReady || !statusSettled || scrolledRef.current) return;
    scrolledRef.current = true;
    cardRef.current?.scrollIntoView({ block: "start" });
    cardRef.current?.focus({ preventScroll: true });
  }, [linkedHere, layoutReady, statusSettled]);

  const status = statusQuery.data;
  const usesPassword = status?.confirmation === "password";
  // The backend only lets a social-only user delete from a fresh session; the
  // session's age is the one signal that they have just signed in again.
  const mustSignInAgain =
    status?.confirmation === "recent-sign-in" &&
    (reauthRequired || !signedInRecently(session?.session?.createdAt));

  async function confirmDelete() {
    try {
      await deleteAccount.mutateAsync(usesPassword ? password : undefined);
    } catch (err) {
      setConfirming(false);
      switch (deletionRefusal(err)) {
        case "PASSWORD_INVALID":
          setPasswordInvalid(true);
          return;
        case "REAUTH_REQUIRED":
          setReauthRequired(true);
          return;
        case "DELETION_BLOCKED":
          void qc.invalidateQueries({ queryKey: qk.accountDeletion() });
          return;
        default:
          pushToast(err instanceof Error ? err.message : d.failed, "danger");
          return;
      }
    }
    // The full page load discards the query cache and better-auth's session
    // store; the backend has already expired the cookies. Clearing the cache by
    // hand first only makes the mounted queries refetch into 401s.
    window.location.replace("/sign-in/?notice=account-deleted");
  }

  async function signInAgain() {
    setSigningOut(true);
    try {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message);
    } catch {
      setSigningOut(false);
      pushToast(d.signOutFailed, "danger");
      return;
    }
    window.location.replace(`/sign-in/?redirect=${encodeURIComponent(DELETE_ACCOUNT_LINK)}`);
  }

  const ownedOrganizations = (organizationsQuery.data ?? []).filter((org) => org.isOwner);

  return (
    <Card
      ref={cardRef}
      id={LINK_PARAM}
      role="region"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="ring-destructive/30 focus:ring-destructive/60 outline-none focus:ring-2"
    >
      <CardHeader>
        <CardTitle id={titleId} className="text-destructive">
          {d.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{d.hint}</p>

        {statusQuery.isPending ? (
          <p className="text-muted-foreground text-sm">{t.common.loading}</p>
        ) : !status ? (
          <p className="text-destructive text-sm">{d.loadFailed}</p>
        ) : !status.canDelete ? (
          <div className="space-y-4">
            <p className="text-sm font-medium">{d.blockedIntro}</p>
            <ul className="list-disc space-y-3 pl-5">
              {status.blockers.map((blocker) => (
                <li key={blockerKey(blocker)} className="text-sm">
                  <p>{blockerText(blocker, t)}</p>
                  {blocker.kind === "SUBSCRIPTION_RENEWING" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      disabled={portal.isPending}
                      onClick={() => void portal.open()}
                    >
                      {portal.isPending ? t.billing.openingPortal : d.openBillingPortal}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
            <Button variant="destructive" disabled>
              {d.delete}
            </Button>
          </div>
        ) : mustSignInAgain ? (
          <div className="space-y-4">
            <p className="text-sm">{d.reauthHint}</p>
            <Button variant="outline" disabled={signingOut} onClick={() => void signInAgain()}>
              {signingOut ? d.signingOut : d.signInAgain}
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setConfirming(true);
            }}
          >
            {usesPassword ? (
              <div className="space-y-1.5">
                <Label htmlFor="deleteAccountPassword">{d.password}</Label>
                <p className="text-muted-foreground text-sm">{d.passwordHint}</p>
                <Input
                  id="deleteAccountPassword"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  aria-invalid={passwordInvalid}
                  aria-describedby={passwordInvalid ? passwordErrorId : undefined}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordInvalid(false);
                  }}
                  required
                />
                {passwordInvalid ? (
                  <p id={passwordErrorId} className="text-destructive text-sm">
                    {d.passwordInvalid}
                  </p>
                ) : null}
              </div>
            ) : null}
            <Button type="submit" variant="destructive" disabled={usesPassword && !password}>
              {d.delete}
            </Button>
          </form>
        )}
      </CardContent>

      <Dialog
        open={confirming}
        onOpenChange={(open) => {
          if (!deleteAccount.isPending) setConfirming(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{d.confirmTitle}</DialogTitle>
            <DialogDescription>{d.confirmIntro}</DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>{d.confirmAccount}</li>
            <li>{d.confirmRecords}</li>
            <li>{d.confirmAttachments}</li>
            <li>{d.confirmSettings}</li>
            {ownedOrganizations.map((org) => (
              <li key={org.id}>{d.confirmOrganization(org.name)}</li>
            ))}
            {organizationsQuery.isError ? <li>{d.confirmOwnedOrganizations}</li> : null}
          </ul>
          <p className="text-sm font-medium">{d.confirmIrreversible}</p>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deleteAccount.isPending}
              onClick={() => setConfirming(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteAccount.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteAccount.isPending ? d.deleting : d.confirmDelete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function signedInRecently(createdAt: Date | string | undefined): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < FRESH_SIGN_IN_MS;
}

function blockerKey(blocker: DeletionBlocker): string {
  switch (blocker.kind) {
    case "GROUP_HAS_MEMBERS":
      return `${blocker.kind}-${blocker.groupId}`;
    case "ORGANIZATION_HAS_MEMBERS":
    case "SUBSCRIPTION_RENEWING":
      return `${blocker.kind}-${blocker.organizationId}`;
    case "SUPPORT_ADMIN":
      return blocker.kind;
  }
}

function blockerText(blocker: DeletionBlocker, t: Dictionary): string {
  const text = t.settings.deleteAccount.blockers;
  switch (blocker.kind) {
    case "GROUP_HAS_MEMBERS":
      return text.groupHasMembers(blocker.groupName, blocker.otherMembers);
    case "ORGANIZATION_HAS_MEMBERS":
      return text.organizationHasMembers(blocker.organizationName, blocker.otherMembers);
    case "SUBSCRIPTION_RENEWING":
      return text.subscriptionRenewing(blocker.organizationName);
    case "SUPPORT_ADMIN":
      return text.supportAdmin;
  }
}
