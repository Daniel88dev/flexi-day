"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthDivider, AuthError, GoogleButton } from "@/components/auth/auth-card";
import { FieldInput } from "@/components/auth/field-input";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? "Sign-in failed");
      } else {
        router.replace(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to see who's in and who's away."
      footer={
        <span>
          New to flexiday?{" "}
          <Link
            href="/sign-up"
            className="font-bold hover:underline"
            style={{ color: "var(--primary)" }}
          >
            Create a team
          </Link>
        </span>
      }
    >
      <GoogleButton label="Continue with Google" />
      <AuthDivider />
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />
        <FieldInput
          id="email"
          label="Work email"
          type="email"
          icon={<Mail className="h-[17px] w-[17px]" />}
          placeholder="dana@northwind.co"
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
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[13px] font-semibold"
              style={{ color: "var(--primary)" }}
            >
              Forgot?
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
          {loading ? "Signing in…" : "Sign in"} <ArrowRight className="h-[18px] w-[18px]" />
        </Button>
      </form>
    </AuthCard>
  );
}
