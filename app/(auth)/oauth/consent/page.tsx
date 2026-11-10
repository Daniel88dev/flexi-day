"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthError } from "@/components/auth/auth-card";
import {
  ConnectFallback,
  ConnectHeader,
  useConnectContext,
} from "@/components/ai-connect/connect-parts";
import { ApiError } from "@/lib/api/client";
import {
  acceptedScopes,
  answerConsent,
  appName,
  goTo,
  offersWrite,
  WRITE_SCOPE,
} from "@/lib/api/oauth-connect";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

/** What the app may do, in which organization, and where the browser goes afterwards. */
export default function ConnectConsentPage() {
  return (
    <Suspense fallback={null}>
      <ConnectConsentContent />
    </Suspense>
  );
}

function ConnectConsentContent() {
  const { t } = useTranslation();
  const { oauthQuery, state } = useConnectContext();
  const [write, setWrite] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (state.status !== "ready") return <ConnectFallback status={state.status} />;
  const { context } = state;
  const name = appName(context);
  const organization = context.organization;

  async function answer(accept: boolean) {
    setError(null);
    setWorking(true);
    try {
      const result = accept
        ? await answerConsent(oauthQuery, {
            accept: true,
            scope: acceptedScopes(oauthQuery, write && offersWrite(context)),
          })
        : await answerConsent(oauthQuery, { accept: false });
      goTo(result.url);
    } catch (err) {
      setWorking(false);
      setError(
        err instanceof ApiError && err.status === 403
          ? t.aiConnect.consent.notEligible(name)
          : t.aiConnect.consent.failed
      );
    }
  }

  if (!organization) {
    return (
      <div>
        <ConnectHeader context={context} title={t.aiConnect.consent.title(name)} />
        <p className="mb-6 text-[15px]">{t.aiConnect.consent.noOrganization}</p>
        <Button asChild size="lg" className="w-full rounded-full">
          <Link href={`/oauth/organization/?${oauthQuery}`}>{t.aiConnect.consent.pickAgain}</Link>
        </Button>
      </div>
    );
  }

  const canWrite = offersWrite(context);
  const readOnlyNote =
    context.scopes.includes(WRITE_SCOPE) && organization.access === "read"
      ? t.aiConnect.consent.readOnly(organization.organizationName, name)
      : null;

  return (
    <div>
      <ConnectHeader context={context} title={t.aiConnect.consent.title(name)} />

      <dl className="mb-6 grid grid-cols-[110px_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t.aiConnect.consent.app}</dt>
        <dd>
          {name}
          <span className="text-muted-foreground">
            {" · "}
            {context.client.verified
              ? t.aiConnect.consent.checked(context.client.host)
              : t.aiConnect.consent.notVerified}
          </span>
        </dd>
        <dt className="text-muted-foreground">{t.aiConnect.consent.organization}</dt>
        <dd>
          {organization.organizationName}{" "}
          <Link
            href={`/oauth/organization/?${oauthQuery}`}
            className="text-primary ml-1 underline-offset-2 hover:underline"
          >
            {t.aiConnect.consent.change}
          </Link>
        </dd>
        <dt className="text-muted-foreground">{t.aiConnect.consent.afterwards}</dt>
        <dd>{t.aiConnect.consent.goesBackTo(context.redirect.host)}</dd>
      </dl>

      {context.redirect.local ? (
        <div
          role="alert"
          className="mb-6 flex gap-2.5 rounded-2xl bg-amber-500/10 px-3.5 py-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
          <p>{t.aiConnect.consent.localApp(name)}</p>
        </div>
      ) : null}

      <p className="mb-2 text-sm font-semibold">{t.aiConnect.consent.ableTo(name)}</p>
      <div className="space-y-2">
        <div className="flex items-start gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3">
          <Lock className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <span className="block text-sm font-medium">{t.aiConnect.consent.read}</span>
            <span className="text-muted-foreground block text-sm">
              {t.aiConnect.consent.readHint}
            </span>
          </span>
        </div>
        {canWrite ? (
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3",
              write ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <Checkbox
              className="mt-0.5"
              checked={write}
              onCheckedChange={(value) => setWrite(value === true)}
              aria-label={t.aiConnect.consent.write}
            />
            <span>
              <span className="block text-sm font-medium">{t.aiConnect.consent.write}</span>
              <span className="text-muted-foreground block text-sm">
                {t.aiConnect.consent.writeHint(name)}
              </span>
            </span>
          </label>
        ) : readOnlyNote ? (
          <p className="text-muted-foreground px-1 text-sm">{readOnlyNote}</p>
        ) : null}
      </div>

      <p className="text-muted-foreground mt-4 text-sm">{t.aiConnect.consent.permissions(name)}</p>
      {context.client.policyUri || context.client.tosUri ? (
        <p className="mt-2 flex gap-4 text-sm">
          {context.client.policyUri ? (
            <a
              href={context.client.policyUri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t.aiConnect.consent.privacy}
            </a>
          ) : null}
          {context.client.tosUri ? (
            <a
              href={context.client.tosUri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t.aiConnect.consent.terms}
            </a>
          ) : null}
        </p>
      ) : null}

      <div className="mt-4">
        <AuthError message={error} />
      </div>
      <div className="mt-6 flex gap-3">
        <Button
          size="lg"
          className="flex-1 rounded-full"
          disabled={working}
          onClick={() => void answer(true)}
        >
          {working ? t.aiConnect.consent.working : t.aiConnect.consent.allow}
        </Button>
        <Button size="lg" variant="ghost" disabled={working} onClick={() => void answer(false)}>
          {t.aiConnect.consent.cancel}
        </Button>
      </div>
    </div>
  );
}
