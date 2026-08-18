"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard, AuthError, AuthSuccess } from "@/components/auth/auth-card";
import { GuestGuard } from "@/components/auth/guest-guard";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function ForgotPasswordPage() {
  return (
    <GuestGuard>
      <ForgotPasswordForm />
    </GuestGuard>
  );
}

function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const result = await authClient.requestPasswordReset({
        email,
        // Trailing slash to match the exported route; the backend overwrites
        // this anyway so the mailed link cannot depend on the caller.
        redirectTo: `${window.location.origin}/reset-password/`,
      });
      if (result.error) {
        setError(result.error.message ?? t.auth.forgot.sendFailed);
      } else {
        setSuccess(t.auth.forgot.sent);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.forgot.sendFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title={t.auth.forgot.title}
      description={t.auth.forgot.description}
      footer={
        <Link href="/sign-in" className="text-primary font-medium hover:underline">
          {t.auth.forgot.backToSignIn}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />
        <AuthSuccess message={success} />
        <div className="space-y-1.5">
          <Label htmlFor="email">{t.auth.forgot.email}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? t.auth.forgot.submitting : t.auth.forgot.submit}
        </Button>
      </form>
    </AuthCard>
  );
}
