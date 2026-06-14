"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, User as UserIcon, Users } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { signUpWithTeam } from "@/lib/api/auth-signup";
import { Button } from "@/components/ui/button";
import {
  AuthCard,
  AuthDivider,
  AuthError,
  AuthSuccess,
  GoogleButton,
} from "@/components/auth/auth-card";
import { FieldInput } from "@/components/auth/field-input";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const teamName = team.trim();
      if (teamName) {
        const result = await signUpWithTeam({ name, email, password, teamName });
        if (result.token) {
          router.replace("/dashboard");
          router.refresh();
        } else {
          setSuccess(
            "Check your inbox for a verification email. You'll be signed in automatically once you verify."
          );
        }
      } else {
        const result = await authClient.signUp.email({ name, email, password });
        if (result.error) {
          setError(result.error.message ?? "Sign-up failed");
        } else {
          setSuccess(
            "Check your inbox for a verification email. You'll be signed in automatically once you verify."
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your team"
      description="Free for up to 10 people. No credit card needed."
      footer={
        <>
          <span>
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-bold hover:underline"
              style={{ color: "var(--primary)" }}
            >
              Sign in
            </Link>
          </span>
          <p
            className="mt-4 text-center text-[12.5px]"
            style={{ color: "var(--text-faint)", lineHeight: 1.5 }}
          >
            By creating a team you agree to our{" "}
            <a href="#" className="underline" style={{ color: "var(--text-muted)" }}>
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="underline" style={{ color: "var(--text-muted)" }}>
              Privacy Policy
            </a>
            .
          </p>
        </>
      }
    >
      <GoogleButton label="Continue with Google" />
      <AuthDivider />
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />
        <AuthSuccess message={success} />
        <FieldInput
          id="name"
          label="Your name"
          type="text"
          icon={<UserIcon className="h-[17px] w-[17px]" />}
          placeholder="Dana Holt"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
        <FieldInput
          id="team"
          label="Team / company"
          type="text"
          icon={<Users className="h-[17px] w-[17px]" />}
          placeholder="Northwind"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          autoComplete="organization"
        />
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
        <FieldInput
          id="password"
          label="Password"
          type="password"
          icon={<Lock className="h-[17px] w-[17px]" />}
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          {loading ? "Creating…" : "Create team & continue"}{" "}
          <ArrowRight className="h-[18px] w-[18px]" />
        </Button>
      </form>
    </AuthCard>
  );
}
