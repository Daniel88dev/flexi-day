"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { GoogleIcon, MicrosoftIcon } from "@/components/auth/provider-icons";
import { useTranslation } from "@/lib/i18n/use-translation";

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({ title, description, children, footer, className }: AuthCardProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-7 space-y-2">
        <h1
          className="font-display font-semibold"
          style={{ fontSize: 34, letterSpacing: "-0.03em" }}
        >
          {title}
        </h1>
        {description ? (
          <p className="text-[16px]" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        ) : null}
      </div>
      {children}
      {footer ? (
        <div className="mt-6 text-center text-[14.5px]" style={{ color: "var(--text-muted)" }}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="bg-destructive/10 text-destructive border-destructive/30 rounded-2xl border px-3 py-2 text-sm"
    >
      {message}
    </div>
  );
}

export function AuthSuccess({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="rounded-2xl border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
    >
      {message}
    </div>
  );
}

/**
 * Renders the `?error=` better-auth appends when it bounces the browser back
 * after a failed social sign-in. Must sit inside a Suspense boundary.
 */
export function OAuthErrorAlert() {
  const params = useSearchParams();
  const { t } = useTranslation();
  const code = params.get("error");
  if (!code) return null;

  const message =
    code === "account_not_linked"
      ? t.auth.socialError.accountNotLinked
      : code === "access_denied"
        ? t.auth.socialError.cancelled
        : t.auth.socialError.generic;

  return <AuthError message={message} />;
}

function SocialButton({
  provider,
  label,
  icon,
  callbackURL = "/dashboard",
  onError,
}: {
  provider: "google" | "microsoft";
  label: string;
  icon: React.ReactNode;
  callbackURL?: string;
  onError?: (message: string) => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      // better-auth resolves a RELATIVE callbackURL against its own baseURL
      // (the backend), which would land the user on api.flexi-day.com/dashboard.
      // Resolve it to an absolute URL on THIS (frontend) origin so the browser
      // returns to the SPA. The origin must be in the backend's trustedOrigins.
      const absoluteCallbackURL = new URL(callbackURL, window.location.origin).toString();
      // Failures default to the BACKEND's own /api/auth/error page — the wrong
      // origin, untranslated, with no way back into the app. Microsoft makes
      // that the common path rather than the rare one: an address Entra has not
      // vouched for cannot link onto an existing account, so it errors here.
      // Keep the rest of the query (notably ?redirect=) so a deep link is not
      // lost when sign-in fails. Stale error params are stripped first —
      // URLSearchParams.get returns the FIRST match, so appending a second
      // `error` on a repeat failure would surface the previous one.
      const errorParams = new URLSearchParams(window.location.search);
      errorParams.delete("error");
      errorParams.delete("error_description");
      const errorQuery = errorParams.toString();
      const errorCallbackURL =
        window.location.origin + window.location.pathname + (errorQuery ? `?${errorQuery}` : "");
      // Redirects the browser to the provider, which returns to the backend at
      // {API}/api/auth/callback/{provider}; better-auth sets the session cookie
      // and then sends the browser to callbackURL. On success the page
      // navigates away, so we only reset loading if the redirect never happens.
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: absoluteCallbackURL,
        errorCallbackURL,
      });
      if (error) {
        setLoading(false);
        // Deliberately not error.message: better-auth always sets one, so a
        // `??` fallback never fires and a raw English backend string lands in
        // the middle of a Czech page.
        onError?.(t.auth.socialError.generic);
      }
    } catch {
      setLoading(false);
      onError?.(t.auth.socialError.generic);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-busy={loading}
      className="flex w-full items-center justify-center gap-2.5 rounded-full border px-4 py-3 text-[15px] font-semibold transition-colors disabled:opacity-60"
      style={{
        borderColor: "var(--border-strong)",
        background: "var(--surface)",
        color: "var(--text)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export function GoogleButton({
  label,
  callbackURL,
  onError,
}: {
  label: string;
  callbackURL?: string;
  onError?: (message: string) => void;
}) {
  return (
    <SocialButton
      provider="google"
      label={label}
      callbackURL={callbackURL}
      onError={onError}
      icon={<GoogleIcon />}
    />
  );
}

export function MicrosoftButton({
  label,
  callbackURL,
  onError,
}: {
  label: string;
  callbackURL?: string;
  onError?: (message: string) => void;
}) {
  return (
    <SocialButton
      provider="microsoft"
      label={label}
      callbackURL={callbackURL}
      onError={onError}
      icon={<MicrosoftIcon />}
    />
  );
}

export function AuthDivider({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className="my-5 flex items-center gap-3.5 text-[13px]"
      style={{ color: "var(--text-faint)" }}
    >
      <span className="h-px flex-1" style={{ background: "var(--border)" }} />
      {label ?? t.auth.orWithEmail}
      <span className="h-px flex-1" style={{ background: "var(--border)" }} />
    </div>
  );
}
