"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthError, AuthSuccess } from "@/components/auth/auth-card";
import { FieldInput } from "@/components/auth/field-input";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  defaultTwoFactorMethod,
  isChallengeDead,
  parseTwoFactorMethods,
  twoFactorErrorKey,
  type TwoFactorMethod,
} from "@/lib/auth/two-factor";

const RESEND_COOLDOWN_S = 30;

// Mid-flow like /reset-password: no GuestGuard. The server holds the
// challenge in a short-lived signed cookie; there is no session yet.
export default function TwoFactorPage() {
  return (
    <Suspense fallback={null}>
      <TwoFactorForm />
    </Suspense>
  );
}

function TwoFactorForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();

  // Same-origin paths only — this value reaches router.replace().
  const requested = params.get("redirect");
  const redirectTo =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/dashboard";
  const methods = parseTwoFactorMethods(params.get("methods"));
  const otpOffered = methods.includes("otp");

  const [method, setMethod] = useState<TwoFactorMethod>(() => defaultTwoFactorMethod(methods));
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [dead, setDead] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const sendOtp = useCallback(async () => {
    setError(null);
    setInfo(null);
    setSending(true);
    const result = await authClient.twoFactor.sendOtp();
    setSending(false);
    if (result.error) {
      const key = twoFactorErrorKey(result.error.status, result.error.code);
      setError(t.auth.twoFactor.errors[key]);
      if (isChallengeDead(key, "otp")) setDead(true);
    } else {
      setInfo(t.auth.twoFactor.sent);
      setCooldown(RESEND_COOLDOWN_S);
    }
  }, [t]);

  // One automatic send when email is the factor in use; resends are manual.
  const autoSent = useRef(false);
  useEffect(() => {
    if (method !== "otp" || autoSent.current) return;
    autoSent.current = true;
    void sendOtp();
  }, [method, sendOtp]);

  function switchMethod(next: TwoFactorMethod) {
    setMethod(next);
    setCode("");
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const body = { code: code.trim(), trustDevice };
      const result =
        method === "totp"
          ? await authClient.twoFactor.verifyTotp(body)
          : method === "otp"
            ? await authClient.twoFactor.verifyOtp(body)
            : await authClient.twoFactor.verifyBackupCode(body);
      if (result.error) {
        const key = twoFactorErrorKey(result.error.status, result.error.code);
        // Emailed-code exhaustion is recoverable in place: the resend button
        // mints a fresh code with a fresh attempt budget.
        if (key === "tooManyAttempts" && method === "otp") {
          setError(t.auth.twoFactor.errors.tooManyAttemptsOtp);
        } else {
          setError(t.auth.twoFactor.errors[key]);
        }
        if (isChallengeDead(key, method)) setDead(true);
      } else {
        router.replace(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.twoFactor.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  const description =
    method === "totp"
      ? t.auth.twoFactor.totpDescription
      : method === "otp"
        ? t.auth.twoFactor.otpDescription
        : t.auth.twoFactor.backupDescription;

  return (
    <AuthCard
      title={t.auth.twoFactor.title}
      description={description}
      footer={
        <Link
          href="/sign-in"
          className="font-bold hover:underline"
          style={{ color: "var(--primary)" }}
        >
          {t.auth.twoFactor.backToSignIn}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthError message={error} />
        <AuthSuccess message={info} />
        <FieldInput
          id="code"
          label={method === "backup" ? t.auth.twoFactor.backupCode : t.auth.twoFactor.code}
          icon={<KeyRound className="h-[17px] w-[17px]" />}
          placeholder={
            method === "backup"
              ? t.auth.twoFactor.backupPlaceholder
              : t.auth.twoFactor.codePlaceholder
          }
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="one-time-code"
          inputMode={method === "backup" ? "text" : "numeric"}
          required
          disabled={dead}
        />
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <input
            type="checkbox"
            className="accent-primary h-4 w-4"
            checked={trustDevice}
            onChange={(e) => setTrustDevice(e.target.checked)}
            disabled={dead}
          />
          {t.auth.twoFactor.trustDevice}
        </label>
        <Button
          type="submit"
          size="lg"
          className="w-full rounded-full"
          disabled={loading || dead || code.trim() === ""}
        >
          {loading ? t.auth.twoFactor.submitting : t.auth.twoFactor.submit}
        </Button>
      </form>
      <div className="mt-5 space-y-1.5 text-center text-[13.5px]" hidden={dead}>
        {method === "otp" && !dead ? (
          <div>
            <button
              type="button"
              className="font-semibold hover:underline disabled:opacity-50"
              style={{ color: "var(--primary)" }}
              onClick={() => void sendOtp()}
              disabled={cooldown > 0 || sending}
            >
              {t.auth.twoFactor.resend}
              {cooldown > 0 ? ` (${cooldown})` : ""}
            </button>
          </div>
        ) : null}
        {!dead && method !== "totp" && methods.includes("totp") ? (
          <div>
            <button
              type="button"
              className="font-semibold hover:underline"
              style={{ color: "var(--primary)" }}
              onClick={() => switchMethod("totp")}
            >
              {t.auth.twoFactor.useAuthenticator}
            </button>
          </div>
        ) : null}
        {!dead && method !== "otp" && otpOffered ? (
          <div>
            <button
              type="button"
              className="font-semibold hover:underline"
              style={{ color: "var(--primary)" }}
              onClick={() => switchMethod("otp")}
            >
              {t.auth.twoFactor.useEmail}
            </button>
          </div>
        ) : null}
        {!dead && method !== "backup" ? (
          <div>
            <button
              type="button"
              className="font-semibold hover:underline"
              style={{ color: "var(--primary)" }}
              onClick={() => switchMethod("backup")}
            >
              {t.auth.twoFactor.useBackup}
            </button>
          </div>
        ) : null}
      </div>
    </AuthCard>
  );
}
