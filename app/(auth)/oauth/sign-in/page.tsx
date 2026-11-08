"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AppleButton,
  AuthDivider,
  AuthError,
  GoogleButton,
  MicrosoftButton,
} from "@/components/auth/auth-card";
import { FieldInput } from "@/components/auth/field-input";
import {
  ConnectFallback,
  ConnectHeader,
  useConnectContext,
} from "@/components/ai-connect/connect-parts";
import { appName, goTo, signInForConnection } from "@/lib/api/oauth-connect";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Where an AI app's authorization request lands when nobody is signed in. Not
 * behind `GuestGuard`: a session must not bounce the visitor to the dashboard,
 * since the authorization server only sends signed-out people here.
 */
export default function ConnectSignInPage() {
  return (
    <Suspense fallback={null}>
      <ConnectSignInContent />
    </Suspense>
  );
}

function ConnectSignInContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { oauthQuery, state } = useConnectContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);

  if (state.status !== "ready") return <ConnectFallback status={state.status} />;
  const name = appName(state.context);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signInForConnection({ email, password, oauthQuery });
      if ("twoFactorRedirect" in result && result.twoFactorRedirect) {
        // The second factor runs on the usual page; the signed query goes with
        // it so the verify call can continue the flow.
        const methods = Array.isArray(result.twoFactorMethods)
          ? result.twoFactorMethods.join(",")
          : "";
        const params = new URLSearchParams({ methods, oauth_query: oauthQuery });
        router.replace(`/two-factor/?${params.toString()}`);
      } else if ("url" in result) {
        goTo(result.url);
      }
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t.auth.signIn.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <ConnectHeader context={state.context} title={t.aiConnect.signIn.title(name)} />
      <p className="-mt-4 mb-6 text-[15px]" style={{ color: "var(--text-muted)" }}>
        {t.aiConnect.signIn.description(name)}
      </p>
      <div className="space-y-2.5">
        <AuthError message={socialError} />
        <AppleButton
          label={t.auth.continueWithApple}
          onError={setSocialError}
          oauthQuery={oauthQuery}
        />
        <GoogleButton
          label={t.auth.continueWithGoogle}
          onError={setSocialError}
          oauthQuery={oauthQuery}
        />
        <MicrosoftButton
          label={t.auth.continueWithMicrosoft}
          onError={setSocialError}
          oauthQuery={oauthQuery}
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
        <FieldInput
          id="password"
          label={t.auth.password}
          type="password"
          icon={<Lock className="h-[17px] w-[17px]" />}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
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
      <p className="mt-6 text-center text-[14px]" style={{ color: "var(--text-muted)" }}>
        {t.aiConnect.signIn.noAccount}{" "}
        <Link
          href="/sign-up"
          target="_blank"
          rel="noopener"
          className="font-bold hover:underline"
          style={{ color: "var(--primary)" }}
        >
          {t.aiConnect.signIn.signUpElsewhere}
        </Link>
      </p>
    </div>
  );
}
