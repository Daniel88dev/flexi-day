"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail, User as UserIcon } from "lucide-react";
import {
  AuthDivider,
  AuthError,
  GoogleButton,
  MicrosoftButton,
  OAuthErrorAlert,
} from "@/components/auth/auth-card";
import { FieldInput } from "@/components/auth/field-input";
import { Button } from "@/components/ui/button";
import { useSignUpWithInvite } from "@/lib/api/queries";
import { planLimitMessage } from "@/lib/billing/plan-limit-error";
import { useTranslation } from "@/lib/i18n/use-translation";
import { closedStatusOf, errorCode, type ClosedStatus } from "@/lib/invites/invite-errors";

/**
 * Sign-up for an invitee with no account. The address is the invited one and
 * cannot be changed: the backend verifies it on the strength of the invite
 * link, which only proves that one mailbox.
 */
export function JoinSignUp({
  token,
  invitedEmail,
  signInHref,
  onSignedUp,
  onClosed,
}: {
  token: string;
  invitedEmail: string;
  signInHref: string;
  onSignedUp: (signedIn: boolean) => Promise<void>;
  onClosed: (status: ClosedStatus) => void;
}) {
  const { t } = useTranslation();
  const signUp = useSignUpWithInvite();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [accountExists, setAccountExists] = useState(false);

  const joinPath = `/join/?token=${encodeURIComponent(token)}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAccountExists(false);

    if (password.length < 8) return setError(t.auth.signUp.passwordTooShort);
    if (password !== confirmPassword) return setError(t.auth.signUp.passwordMismatch);

    let signedIn: boolean;
    try {
      const result = await signUp.mutateAsync({ token, name, email: invitedEmail, password });
      signedIn = result.user !== null;
    } catch (err) {
      const code = errorCode(err);
      if (code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") return setAccountExists(true);
      const closedStatus = closedStatusOf(code);
      if (closedStatus) return onClosed(closedStatus);
      if (code === "PASSWORD_COMPROMISED") return setError(t.join.passwordCompromised);
      if (code === "PASSWORD_TOO_SHORT") return setError(t.auth.signUp.passwordTooShort);
      if (code === "PASSWORD_TOO_LONG") return setError(t.join.passwordTooLong);
      return setError(planLimitMessage(err, t) ?? t.join.signUpFailed);
    }

    await onSignedUp(signedIn);
  }

  return (
    <>
      <div className="space-y-2.5">
        <OAuthErrorAlert />
        <AuthError message={socialError} />
        {/* A provider account comes back here unverified; pressing Join then
            verifies it through the link. */}
        <GoogleButton
          label={t.auth.continueWithGoogle}
          callbackURL={joinPath}
          onError={setSocialError}
        />
        <MicrosoftButton
          label={t.auth.continueWithMicrosoft}
          callbackURL={joinPath}
          onError={setSocialError}
        />
      </div>
      <AuthDivider />
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />
        {accountExists ? (
          <div
            role="alert"
            className="bg-destructive/10 text-destructive border-destructive/30 space-y-2 rounded-2xl border px-3 py-2 text-sm"
          >
            <p>{t.join.accountExists(invitedEmail)}</p>
            <p>{t.join.accountUnconfirmed}</p>
            <p className="flex flex-wrap gap-x-4 font-semibold">
              <Link href={signInHref} className="underline">
                {t.join.signInToJoin}
              </Link>
              <Link href="/forgot-password" className="underline">
                {t.join.forgotPassword}
              </Link>
            </p>
          </div>
        ) : null}
        <FieldInput
          id="name"
          label={t.auth.signUp.yourName}
          type="text"
          icon={<UserIcon className="h-[17px] w-[17px]" />}
          placeholder={t.auth.signUp.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
        <div>
          <FieldInput
            id="email"
            label={t.auth.workEmail}
            type="email"
            icon={<Mail className="h-[17px] w-[17px]" />}
            value={invitedEmail}
            readOnly
            aria-describedby="invited-email-note"
            autoComplete="email"
            className="cursor-not-allowed opacity-75"
          />
          <p
            id="invited-email-note"
            className="mt-1.5 text-[12.5px]"
            style={{ color: "var(--text-faint)" }}
          >
            {t.join.invitedAddressNote}
          </p>
        </div>
        <FieldInput
          id="password"
          label={t.auth.signUp.password}
          type="password"
          icon={<Lock className="h-[17px] w-[17px]" />}
          placeholder={t.auth.signUp.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <FieldInput
          id="confirmPassword"
          label={t.auth.signUp.confirmPassword}
          type="password"
          icon={<Lock className="h-[17px] w-[17px]" />}
          placeholder={t.auth.signUp.confirmPlaceholder}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Button
          type="submit"
          size="lg"
          className="mt-1 w-full gap-2 rounded-full"
          disabled={signUp.isPending}
        >
          {signUp.isPending ? t.join.signUpSubmitting : t.join.signUpSubmit}{" "}
          <ArrowRight className="h-[18px] w-[18px]" />
        </Button>
      </form>
    </>
  );
}
