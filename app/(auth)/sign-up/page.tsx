"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail, User as UserIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  AuthCard,
  AuthDivider,
  AuthError,
  AuthSuccess,
  GoogleButton,
} from "@/components/auth/auth-card";
import { FieldInput } from "@/components/auth/field-input";
import { GuestGuard } from "@/components/auth/guest-guard";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function SignUpPage() {
  return (
    <GuestGuard>
      <SignUpForm />
    </GuestGuard>
  );
}

function SignUpForm() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError(t.auth.signUp.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.auth.signUp.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      // No group is created here. A new account belongs to nothing until the
      // user creates a group or redeems an invite code, and booking time off
      // is gated on that membership.
      const result = await authClient.signUp.email({ name, email, password });
      if (result.error) {
        setError(result.error.message ?? t.auth.signUp.failed);
      } else {
        setSuccess(t.auth.signUp.checkInbox);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.signUp.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title={t.auth.signUp.title}
      description={t.auth.signUp.description}
      footer={
        <>
          <span>
            {t.auth.signUp.haveAccount}{" "}
            <Link
              href="/sign-in"
              className="font-bold hover:underline"
              style={{ color: "var(--primary)" }}
            >
              {t.auth.signUp.signIn}
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
      <GoogleButton label={t.auth.continueWithGoogleNotReady} />
      <AuthDivider />
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />
        <AuthSuccess message={success} />
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
        <FieldInput
          id="email"
          label={t.auth.workEmail}
          type="email"
          icon={<Mail className="h-[17px] w-[17px]" />}
          placeholder={t.auth.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
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
          disabled={loading}
        >
          {loading ? t.auth.signUp.submitting : t.auth.signUp.submit}{" "}
          <ArrowRight className="h-[18px] w-[18px]" />
        </Button>
      </form>
    </AuthCard>
  );
}
