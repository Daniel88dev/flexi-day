"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthError } from "@/components/auth/auth-card";
import { API_BASE_URL } from "@/lib/api/client";

const DEV_TOKEN = process.env.NEXT_PUBLIC_DEV_TOOLS_TOKEN ?? "";
const DEV_DOMAIN = process.env.NEXT_PUBLIC_DEV_SEED_DOMAIN ?? "dev.local";

const ACCOUNTS = [
  { local: "owner", label: "Owner / approver" },
  { local: "alice", label: "Alice (member)" },
  { local: "bob", label: "Bob (member)" },
  { local: "carol", label: "Carol (member)" },
];

async function devApi<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/api/dev${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "include",
    headers: {
      "x-dev-token": DEV_TOKEN,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const parsed: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      (parsed as { errors?: { message?: string }[]; message?: string } | null)?.errors?.[0]
        ?.message ??
      (parsed as { message?: string } | null)?.message ??
      `Dev request failed (${res.status})`;
    throw new Error(message);
  }
  return parsed as T;
}

export default function DevSignInPage() {
  return (
    <Suspense fallback={null}>
      <DevSignInConsole />
    </Suspense>
  );
}

function DevSignInConsole() {
  const router = useRouter();
  const params = useSearchParams();
  const requestedEmail = params.get("email");
  const redirectTo = params.get("redirect") || "/dashboard";

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const signInAs = useCallback(
    async (email: string) => {
      setError(null);
      setBusy(email);
      try {
        await devApi("/session", { email });
        router.replace(redirectTo);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Dev sign-in failed");
        setBusy(null);
      }
    },
    [redirectTo, router]
  );

  // `?email=` makes the whole page a one-hop redirect into an authenticated
  // session, which is what a test driver navigates to. Deferred by a tick so
  // the request does not set state synchronously inside the effect.
  useEffect(() => {
    if (!requestedEmail) return;
    const timer = setTimeout(() => void signInAs(requestedEmail), 0);
    return () => clearTimeout(timer);
  }, [requestedEmail, signInAs]);

  const run = async (label: string, fn: () => Promise<string>) => {
    setError(null);
    setNote(null);
    setBusy(label);
    try {
      setNote(await fn());
    } catch (err) {
      setError(err instanceof Error ? err.message : `${label} failed`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <AuthCard
      title="Dev sign-in"
      description={`Local only — signs in without email verification via ${API_BASE_URL}/api/dev.`}
    >
      {error && (
        <div className="mb-4">
          <AuthError message={error} />
        </div>
      )}
      {note && (
        <p className="mb-4 text-[13px]" style={{ color: "var(--text-muted)" }}>
          {note}
        </p>
      )}

      <div className="space-y-2">
        {ACCOUNTS.map((account) => {
          const email = `${account.local}@${DEV_DOMAIN}`;
          return (
            <Button
              key={email}
              onClick={() => void signInAs(email)}
              disabled={busy !== null}
              size="lg"
              variant="outline"
              className="w-full justify-between rounded-full"
            >
              <span>{account.label}</span>
              <span style={{ color: "var(--text-muted)" }}>{email}</span>
            </Button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-2">
        <Button
          variant="secondary"
          className="flex-1 rounded-full"
          disabled={busy !== null}
          onClick={() =>
            void run("seed", async () => {
              const result = await devApi<{
                owner: { password: string };
                vacationsCreated: number;
              }>("/scenario", {});
              return `Seeded. Shared password: ${result.owner.password} (${result.vacationsCreated} bookings)`;
            })
          }
        >
          Seed scenario
        </Button>
        <Button
          variant="secondary"
          className="flex-1 rounded-full"
          disabled={busy !== null}
          onClick={() =>
            void run("reset", async () => {
              const result = await devApi<{ deleted: { users: number; groups: number } }>(
                "/reset",
                {}
              );
              return `Deleted ${result.deleted.users} users and ${result.deleted.groups} teams.`;
            })
          }
        >
          Reset data
        </Button>
      </div>
    </AuthCard>
  );
}
