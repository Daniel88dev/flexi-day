"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { appName, getConnectContext, type ConnectContext } from "@/lib/api/oauth-connect";
import { useTranslation } from "@/lib/i18n/use-translation";

type ContextState =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "error" }
  | { status: "ready"; context: ConnectContext };

/**
 * Reads the signed query off this page's URL and asks the backend what it
 * describes. Needs a Suspense boundary, as `useSearchParams` does in a static
 * export. Re-encoding the query is harmless: the signature covers the
 * parameters, not their spelling.
 */
export function useConnectContext(): { oauthQuery: string; state: ContextState } {
  const oauthQuery = useSearchParams().toString();
  const [answer, setAnswer] = useState<{ query: string; state: ContextState } | null>(null);

  useEffect(() => {
    if (!oauthQuery) return;
    let live = true;
    getConnectContext(oauthQuery).then(
      (context) => {
        if (live) setAnswer({ query: oauthQuery, state: { status: "ready", context } });
      },
      (error: unknown) => {
        if (!live) return;
        const status = error instanceof ApiError && error.status === 400 ? "invalid" : "error";
        setAnswer({ query: oauthQuery, state: { status } });
      }
    );
    return () => {
      live = false;
    };
  }, [oauthQuery]);

  const state: ContextState = !oauthQuery
    ? { status: "invalid" }
    : answer?.query === oauthQuery
      ? answer.state
      : { status: "loading" };
  return { oauthQuery, state };
}

/** The app asking for access: its logo (https only, the backend checks), name and host. */
export function ConnectHeader({ context, title }: { context: ConnectContext; title: string }) {
  const { t } = useTranslation();
  const name = appName(context);
  return (
    <div className="mb-7 space-y-4">
      <div className="flex items-center gap-3">
        {context.client.logoUri ? (
          // eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimizer
          <img
            src={context.client.logoUri}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-lg object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg font-semibold"
          >
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="text-muted-foreground text-sm">
          {t.aiConnect.requester(name, context.client.host)}
        </span>
      </div>
      <h1 className="font-display font-semibold" style={{ fontSize: 30, letterSpacing: "-0.03em" }}>
        {title}
      </h1>
    </div>
  );
}

/** Loading, an expired or altered link, or a failed read: everything before there is a context. */
export function ConnectFallback({ status }: { status: "loading" | "invalid" | "error" }) {
  const { t } = useTranslation();
  if (status === "loading") {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center text-sm">
        <span className="bg-primary mr-2 inline-block size-2 animate-pulse rounded-full" />
        {t.aiConnect.loading}
      </div>
    );
  }
  return (
    <div role="alert">
      <h1
        className="font-display mb-3 font-semibold"
        style={{ fontSize: 30, letterSpacing: "-0.03em" }}
      >
        {t.aiConnect.invalid.title}
      </h1>
      <p className="text-muted-foreground text-[15px]">{t.aiConnect.invalid.body}</p>
    </div>
  );
}

/** A full-width secondary action, such as "Go back to Claude". */
export function ConnectSecondaryButton(props: React.ComponentProps<typeof Button>) {
  return <Button variant="outline" size="lg" className="w-full rounded-full" {...props} />;
}
