"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard, AuthError } from "@/components/auth/auth-card";

function ResetPasswordForm() {
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
      setError("Missing or invalid reset token.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError(result.error.message ?? "Could not reset password");
      } else {
        router.replace("/sign-in");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Set a new password"
      description="Pick something memorable but secure."
      footer={
        <Link href="/sign-in" className="text-primary font-medium hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
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
          <Label htmlFor="confirm">Confirm password</Label>
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
          {loading ? "Saving…" : "Reset password"}
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
