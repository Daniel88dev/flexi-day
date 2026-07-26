"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard, AuthError } from "@/components/auth/auth-card";
import { useTranslation } from "@/lib/i18n/use-translation";

function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(t.auth.reset.missingToken);
      return;
    }
    if (password.length < 8) {
      setError(t.auth.reset.passwordTooShort);
      return;
    }
    if (password !== confirm) {
      setError(t.auth.reset.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError(result.error.message ?? t.auth.reset.failed);
      } else {
        router.replace("/sign-in");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.reset.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title={t.auth.reset.title}
      description={t.auth.reset.description}
      footer={
        <Link href="/sign-in" className="text-primary font-medium hover:underline">
          {t.auth.reset.backToSignIn}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />
        <div className="space-y-1.5">
          <Label htmlFor="password">{t.auth.reset.newPassword}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">{t.auth.reset.confirmPassword}</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? t.auth.reset.submitting : t.auth.reset.submit}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
