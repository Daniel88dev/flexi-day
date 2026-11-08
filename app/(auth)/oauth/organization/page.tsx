"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthError } from "@/components/auth/auth-card";
import {
  ConnectFallback,
  ConnectHeader,
  ConnectSecondaryButton,
  useConnectContext,
} from "@/components/ai-connect/connect-parts";
import { errorCode } from "@/lib/api/client";
import {
  answerConsent,
  appName,
  chooseConnectOrganization,
  continueAfterPicker,
  goTo,
} from "@/lib/api/oauth-connect";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

/** The post-login step: which one organization the app acts in. Shown on every new connection. */
export default function ConnectOrganizationPage() {
  return (
    <Suspense fallback={null}>
      <ConnectOrganizationContent />
    </Suspense>
  );
}

function ConnectOrganizationContent() {
  const { t } = useTranslation();
  const { oauthQuery, state } = useConnectContext();
  const [picked, setPicked] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (state.status !== "ready") return <ConnectFallback status={state.status} />;
  const { context } = state;
  const name = appName(context);

  async function leave() {
    setWorking(true);
    try {
      goTo((await answerConsent(oauthQuery, { accept: false })).url);
    } catch {
      setWorking(false);
      setError(t.aiConnect.picker.failed);
    }
  }

  if (!context.signedIn || !context.organizations) {
    return (
      <div>
        <ConnectHeader context={context} title={t.aiConnect.picker.title(name)} />
        <p className="mb-6 text-[15px]">{t.aiConnect.picker.signedOut}</p>
        <Button asChild size="lg" className="w-full rounded-full">
          <Link href={`/oauth/sign-in/?${oauthQuery}`}>{t.aiConnect.picker.signInAgain}</Link>
        </Button>
      </div>
    );
  }

  const { eligible, leftOut } = context.organizations;

  if (eligible.length === 0) {
    return (
      <div>
        <ConnectHeader context={context} title={t.aiConnect.none.title(name)} />
        <p className="text-[15px] leading-relaxed">{t.aiConnect.none.body}</p>
        {leftOut.length > 0 ? (
          <ul className="text-muted-foreground mt-3 space-y-1 text-sm">
            {leftOut.map((o) => (
              <li key={o.organizationId}>
                {t.aiConnect.none.owner(o.organizationName, o.ownerName)}
              </li>
            ))}
          </ul>
        ) : null}
        {leftOut.some((o) => o.reason === "PLAN") ? (
          <p className="text-muted-foreground mt-4 text-sm">{t.aiConnect.none.free}</p>
        ) : null}
        <AuthError message={error} />
        <div className="mt-6">
          <ConnectSecondaryButton onClick={() => void leave()} disabled={working}>
            {t.aiConnect.none.goBack(name)}
          </ConnectSecondaryButton>
        </div>
      </div>
    );
  }

  const selected =
    picked ?? context.organization?.organizationId ?? eligible[0]?.organizationId ?? null;

  async function handleContinue() {
    if (!selected) return;
    setError(null);
    setWorking(true);
    try {
      await chooseConnectOrganization(selected);
      goTo((await continueAfterPicker(oauthQuery)).url);
    } catch (err) {
      setWorking(false);
      setError(
        errorCode(err) === "AI_ORGANIZATION_NOT_ELIGIBLE"
          ? t.aiConnect.picker.notEligible
          : t.aiConnect.picker.failed
      );
    }
  }

  return (
    <div>
      <ConnectHeader context={context} title={t.aiConnect.picker.title(name)} />
      <fieldset className="space-y-2">
        <legend className="sr-only">{t.aiConnect.picker.legend}</legend>
        {eligible.map((o) => (
          <label
            key={o.organizationId}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3",
              selected === o.organizationId ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <input
              type="radio"
              name="organization"
              className="accent-primary"
              checked={selected === o.organizationId}
              onChange={() => setPicked(o.organizationId)}
            />
            <span className="flex-1">
              <span className="block text-sm font-medium">{o.organizationName}</span>
              <span className="text-muted-foreground block text-xs">
                {t.aiConnect.picker.access[o.access]}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      {leftOut.map((o) => (
        <p key={o.organizationId} className="text-muted-foreground mt-3 text-sm">
          {t.aiConnect.picker.leftOut[o.reason](o.organizationName)}
        </p>
      ))}
      <p className="text-muted-foreground mt-3 text-sm">
        {t.aiConnect.picker.oneOrganization(name)}
      </p>
      <div className="mt-4">
        <AuthError message={error} />
      </div>
      <div className="mt-6 flex gap-3">
        <Button
          size="lg"
          className="flex-1 rounded-full"
          disabled={working || !selected}
          onClick={() => void handleContinue()}
        >
          {working ? t.aiConnect.picker.working : t.aiConnect.picker.continue}
        </Button>
        <Button size="lg" variant="ghost" disabled={working} onClick={() => void leave()}>
          {t.aiConnect.picker.cancel}
        </Button>
      </div>
    </div>
  );
}
