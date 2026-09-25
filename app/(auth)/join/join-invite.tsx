"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AuthCard, AuthError } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";
import { ApiError } from "@/lib/api/client";
import { useGroups, useInvitePreview, useJoinGroupByLink } from "@/lib/api/queries";
import { planLimitMessage } from "@/lib/billing/plan-limit-error";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  closedInviteCopy,
  closedStatusOf,
  errorCode,
  type ClosedStatus,
} from "@/lib/invites/invite-errors";
import { JoinSignUp } from "./join-sign-up";

/** `dana@northwind.co` → `d…@northwind.co`: enough to pick the right account. */
const maskEmail = (email: string): string => {
  const at = email.lastIndexOf("@");
  if (at <= 0) return "…";
  return `${email[0]}…${email.slice(at)}`;
};

const groupHref = (groupId: string) => `/groups/detail?groupId=${groupId}`;

export function JoinInvite() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const { data: session, isPending: sessionPending, refetch: refetchSession } = useSession();
  const signedIn = Boolean(session);
  const preview = useInvitePreview(token);
  const groups = useGroups(signedIn);
  const joinGroup = useJoinGroupByLink();

  const closedCopy = closedInviteCopy(t);

  const [joinClosed, setJoinClosed] = useState<ClosedStatus | null>(null);
  const [joinedAlready, setJoinedAlready] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const signInHref = `/sign-in?redirect=${encodeURIComponent(
    `/join/?token=${encodeURIComponent(token)}`
  )}`;

  const loading = (
    <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center text-sm">
      <span className="bg-primary mr-2 inline-block size-2 animate-pulse rounded-full" />
      {t.auth.loading}
    </div>
  );

  const notFound = (
    <AuthCard title={t.join.notFoundTitle} description={t.join.notFound}>
      <DashboardLink label={t.join.toDashboard} />
    </AuthCard>
  );

  if (!token) return notFound;
  if (leaving) return loading;
  if (preview.isPending || sessionPending || (signedIn && groups.isPending)) return loading;

  if (preview.error) {
    if (preview.error instanceof ApiError && preview.error.status === 404) return notFound;
    return (
      <AuthCard title={t.join.notFoundTitle}>
        <AuthError message={t.join.loadFailed} />
      </AuthCard>
    );
  }

  const invite = preview.data;
  const isMember = joinedAlready || (groups.data ?? []).some((g) => g.id === invite.groupId);

  if (signedIn && isMember) {
    return (
      <AuthCard
        title={t.join.alreadyMemberTitle}
        description={t.join.alreadyMember(invite.groupName)}
      >
        <Button asChild size="lg" className="w-full gap-2 rounded-full">
          <Link href={groupHref(invite.groupId)}>
            {t.join.openGroup} <ArrowRight className="h-[18px] w-[18px]" />
          </Link>
        </Button>
      </AuthCard>
    );
  }

  const closed = joinClosed ?? (invite.status === "open" ? null : invite.status);
  if (closed) {
    return (
      <AuthCard title={closedCopy[closed].title} description={closedCopy[closed].body}>
        <DashboardLink label={t.join.toDashboard} />
      </AuthCard>
    );
  }

  const title = t.join.title(invite.groupName);
  const description = invite.inviterName
    ? t.join.invitedBy(invite.inviterName)
    : t.join.invitedByUnknown;

  if (!session) {
    // The sign-up response set the session cookie; the session store has to
    // see it before the dashboard's guard does, or it bounces to sign-in.
    async function handleSignedUp(signedIn: boolean) {
      setLeaving(true);
      if (!signedIn) {
        // Joined and verified, but the session could not be started.
        router.replace("/sign-in?notice=account-ready");
        return;
      }
      try {
        await refetchSession();
      } finally {
        router.replace("/dashboard");
      }
    }

    return (
      <AuthCard
        title={title}
        description={description}
        footer={
          <>
            <span>
              {t.join.haveAccount}{" "}
              <Link
                href={signInHref}
                className="font-bold hover:underline"
                style={{ color: "var(--primary)" }}
              >
                {t.join.signInToJoin}
              </Link>
            </span>
            <p
              className="mt-4 text-center text-[12.5px]"
              style={{ color: "var(--text-faint)", lineHeight: 1.5 }}
            >
              {t.auth.signUp.agreePrefix}{" "}
              <Link href="/terms" className="underline" style={{ color: "var(--text-muted)" }}>
                {t.auth.signUp.terms}
              </Link>{" "}
              {t.auth.signUp.and}{" "}
              <Link href="/privacy" className="underline" style={{ color: "var(--text-muted)" }}>
                {t.auth.signUp.privacy}
              </Link>
              .
            </p>
          </>
        }
      >
        <JoinSignUp
          token={token}
          invitedEmail={invite.invitedEmail}
          signInHref={signInHref}
          onSignedUp={handleSignedUp}
          onClosed={setJoinClosed}
        />
      </AuthCard>
    );
  }

  if (session.user.email.toLowerCase() !== invite.invitedEmail.toLowerCase()) {
    async function handleSignOut() {
      setSigningOut(true);
      try {
        await signOut();
        router.replace(signInHref);
      } finally {
        setSigningOut(false);
      }
    }

    return (
      <AuthCard
        title={t.join.wrongAccountTitle}
        description={t.join.wrongAccount(maskEmail(invite.invitedEmail), session.user.email)}
      >
        <Button
          size="lg"
          className="w-full rounded-full"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? t.join.signingOut : t.join.signOutAndContinue}
        </Button>
      </AuthCard>
    );
  }

  async function handleJoin() {
    setJoinError(null);
    try {
      await joinGroup.mutateAsync(token);
      router.replace("/dashboard");
    } catch (err) {
      const code = errorCode(err);
      if (code === "ALREADY_MEMBER") return setJoinedAlready(true);
      const closedStatus = closedStatusOf(code);
      if (closedStatus) return setJoinClosed(closedStatus);
      setJoinError(planLimitMessage(err, t) ?? t.join.failed);
    }
  }

  return (
    <AuthCard title={title} description={description}>
      <div className="space-y-4">
        <AuthError message={joinError} />
        {/* The only trigger: mail scanners open links, so loading this page
            must never redeem the invite. */}
        <Button
          size="lg"
          className="w-full gap-2 rounded-full"
          onClick={handleJoin}
          disabled={joinGroup.isPending}
        >
          {joinGroup.isPending ? t.join.joining : t.join.join}{" "}
          <ArrowRight className="h-[18px] w-[18px]" />
        </Button>
      </div>
    </AuthCard>
  );
}

function DashboardLink({ label }: { label: string }) {
  return (
    <Button asChild variant="outline" size="lg" className="w-full rounded-full">
      <Link href="/dashboard">{label}</Link>
    </Button>
  );
}
