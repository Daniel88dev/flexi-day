"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  AuthCard,
  AuthDivider,
  AuthError,
  GoogleButton,
  MicrosoftButton,
  OAuthErrorAlert,
} from "@/components/auth/auth-card";
import { FieldInput } from "@/components/auth/field-input";
import { GuestGuard } from "@/components/auth/guest-guard";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function SignInPage() {
  return (
    <GuestGuard>
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </GuestGuard>
  );
}

function SignInForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  // Same-origin paths only. The value reaches router.replace() and, since the
  // social buttons landed, an OAuth callbackURL too — an absolute or
  // protocol-relative value would turn this page into an open redirect off a
  // link an attacker can send ("?redirect=https://flexi-day-login.evil.com/").
  const requested = params.get("redirect");
  const redirectTo =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? t.auth.signIn.failed);
      } else if (
        result.data &&
        "twoFactorRedirect" in result.data &&
        result.data.twoFactorRedirect
      ) {
        // The password was right but no session exists yet — the server set a
        // short-lived challenge cookie and expects a second factor.
        const methods =
          "twoFactorMethods" in result.data &&
          Array.isArray(result.data.twoFactorMethods)
            ? result.data.twoFactorMethods.join(",")
            : "";
        router.replace(
          `/two-factor/?redirect=${encodeURIComponent(redirectTo)}&methods=${encodeURIComponent(methods)}`,
        );
      } else {
        router.replace(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.signIn.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title={t.auth.signIn.title}
      description={t.auth.signIn.description}
      footer={
        <span>
          {t.auth.signIn.newToApp}{" "}
          <Link
            href="/sign-up"
            className="font-bold hover:underline"
            style={{ color: "var(--primary)" }}
          >
            {t.auth.signIn.createTeam}
          </Link>
        </span>
      }
    >
      <div className="space-y-2.5">
        <OAuthErrorAlert />
        <AuthError message={socialError} />
        {/* Same destination as the password form, so a deep link survives
            being bounced through the provider. */}
        <GoogleButton
          label={t.auth.continueWithGoogle}
          callbackURL={redirectTo}
          onError={setSocialError}
        />
        <MicrosoftButton
          label={t.auth.continueWithMicrosoft}
          callbackURL={redirectTo}
          onError={setSocialError}
        />
      </div>
      <AuthDivider />
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />
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
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-[13px] font-semibold tracking-[0.01em]"
              style={{ color: "var(--text-muted)" }}
            >
              {t.auth.password}
            </label>
            <Link
              href="/forgot-password"
              className="text-[13px] font-semibold"
              style={{ color: "var(--primary)" }}
            >
              {t.auth.signIn.forgot}
            </Link>
          </div>
          <FieldInput
            id="password"
            type="password"
            icon={<Lock className="h-[17px] w-[17px]" />}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="mt-1 w-full gap-2 rounded-full"
          disabled={loading}
        >
          {loading ? t.auth.signIn.submitting : t.auth.signIn.submit}{" "}
          <ArrowRight className="h-[18px] w-[18px]" />
        </Button>
      </form>
    </AuthCard>
  );
}
