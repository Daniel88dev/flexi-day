"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleIcon, MicrosoftIcon } from "@/components/auth/provider-icons";
import { pushToast } from "@/components/toast";
import { authClient } from "@/lib/auth-client";
import {
  linkedAccountsKey,
  PASSWORD_PROVIDER_ID,
  useLinkedAccounts,
} from "@/lib/auth/use-linked-accounts";
import { useTranslation } from "@/lib/i18n/use-translation";

type Provider = "google" | "microsoft";

const PROVIDERS: { id: Provider; name: string; icon: React.ReactNode }[] = [
  { id: "google", name: "Google", icon: <GoogleIcon size={20} /> },
  { id: "microsoft", name: "Microsoft", icon: <MicrosoftIcon size={20} /> },
];

/**
 * Lets a signed-in user attach Google or Microsoft to the account they already
 * have. Social sign-in cannot do this on its own: the account's address is
 * proven by our own confirmation email, never by a provider's claim, so
 * better-auth is configured to refuse the automatic linking it would otherwise
 * do at sign-in (see `accountLinking` in the backend's auth.ts). Consenting
 * from inside an authenticated session is what replaces that claim.
 *
 * Reads `useSearchParams`, so it must sit inside a Suspense boundary.
 */
export function ConnectedAccountsCard() {
  const { t, localeReady } = useTranslation();
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<Provider | null>(null);
  const [dismissedLinkError, setDismissedLinkError] = useState(false);
  const announced = useRef(false);

  const accountsQuery = useLinkedAccounts();

  // The provider redirects the browser back here rather than resolving a
  // promise, so the outcome of a connect arrives as a query parameter: `linked`
  // is ours, `error` is better-auth's. Both are read at render rather than
  // copied into state — the URL already is the state. An unrecognised `linked`
  // is ignored: it reaches a success-styled toast, so a crafted link must not
  // be able to put its own words there.
  const linked = PROVIDERS.find((p) => p.id === params.get("linked")) ?? null;
  // The `error` param is deliberately never stripped from the URL, so it has
  // to be dismissed explicitly — otherwise a refused link's message sits under
  // the success toast of every action taken afterwards.
  const linkError = dismissedLinkError ? null : params.get("error");
  const error = actionError ?? (linkError ? linkErrorMessage(linkError, t) : null);

  function startAction() {
    setActionError(null);
    setDismissedLinkError(true);
  }

  // Success has nothing to show once the row says "Connected", so it is
  // announced and the marker dropped. `error` deliberately stays in the URL,
  // as it does on the sign-in page: the next attempt overwrites it, and
  // stripping it would erase the message the user has not read yet.
  //
  // The ref, not the deps, is what makes this fire once. `router.replace` is
  // async and the locale provider swaps `t` from its own mount effect, so the
  // effect can re-run with `linked` still set.
  useEffect(() => {
    // `localeReady` is the gate, not an optimisation: `I18nProvider` corrects
    // the locale from its own mount effect, which runs *after* this one, so
    // firing immediately would announce a Czech page's success in English.
    if (!linked || announced.current || !localeReady) return;
    announced.current = true;
    pushToast(t.settings.connectedAccounts.connectedToast(linked.name));
    const next = new URLSearchParams(params);
    next.delete("linked");
    const query = next.toString();
    router.replace(pathname + (query ? `?${query}` : ""), { scroll: false });
  }, [linked, localeReady, params, pathname, router, t]);

  const unlink = useMutation({
    mutationFn: async (provider: Provider) => {
      const { error } = await authClient.unlinkAccount({ providerId: provider });
      if (error) throw new UnlinkError(error.code, error.message);
    },
    // A previous failure's message must not outlive the attempt that replaces
    // it — otherwise a successful disconnect shows a green toast under a red
    // error about the one before.
    onMutate: startAction,
    onSuccess: (_data, provider) => {
      const name = PROVIDERS.find((p) => p.id === provider)?.name ?? provider;
      pushToast(t.settings.connectedAccounts.disconnectedToast(name));
      void qc.invalidateQueries({ queryKey: linkedAccountsKey });
    },
    onError: (err) => {
      setActionError(unlinkErrorMessage(err, t));
    },
  });

  async function connect(provider: Provider) {
    startAction();
    setPending(provider);
    try {
      // Relative URLs resolve against the BACKEND origin inside better-auth, so
      // both are absolutized onto this origin — the same reason the sign-in
      // buttons do it. `linked` is ours; `error` is appended by better-auth.
      // The rest of the query survives the round trip, so an open request
      // detail (`?vacationId=`) is still there on the way back.
      const here = window.location.origin + window.location.pathname;
      const keep = new URLSearchParams(window.location.search);
      keep.delete("linked");
      keep.delete("error");
      keep.delete("error_description");
      const errorQuery = keep.toString();
      keep.set("linked", provider);
      const { error } = await authClient.linkSocial({
        provider,
        callbackURL: `${here}?${keep.toString()}`,
        errorCallbackURL: here + (errorQuery ? `?${errorQuery}` : ""),
      });
      // Reached only when no redirect happened; otherwise the page is gone.
      if (error) {
        setPending(null);
        setActionError(t.settings.connectedAccounts.errors.generic);
      }
    } catch {
      setPending(null);
      setActionError(t.settings.connectedAccounts.errors.generic);
    }
  }

  // Leaving the page for the provider and coming back through the browser's
  // back button restores this component from bfcache with `pending` still set,
  // which would leave the clicked button reading "Redirecting…" for good.
  useEffect(() => {
    const clear = (event: PageTransitionEvent) => {
      if (event.persisted) setPending(null);
    };
    window.addEventListener("pageshow", clear);
    return () => window.removeEventListener("pageshow", clear);
  }, []);

  // The list is only rendered once the answer is known. Falling back to an
  // empty array would claim a linked provider is "Not connected" and, worse,
  // pair that with the last-method notice about a method it is not showing.
  const accounts = accountsQuery.data;
  const linkedProviders = new Set(accounts?.map((a) => a.providerId));
  const hasPassword = linkedProviders.has(PASSWORD_PROVIDER_ID);
  const isLastMethod = accounts !== undefined && accounts.length <= 1;
  // The notice explains a *disabled Disconnect button*, so it only belongs
  // where one is rendered. A password-only account trips `isLastMethod` too,
  // and there it would explain a control the card never shows.
  const explainLastMethod = isLastMethod && PROVIDERS.some((p) => linkedProviders.has(p.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.settings.connectedAccounts.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{t.settings.connectedAccounts.hint}</p>

        {accounts ? (
          <ul className="divide-border divide-y">
            {hasPassword ? (
              <MethodRow
                icon={<KeyRound className="h-5 w-5" />}
                name={t.settings.connectedAccounts.password}
                status={t.settings.connectedAccounts.inUse}
              />
            ) : null}

            {PROVIDERS.map((provider) => {
              const connected = linkedProviders.has(provider.id);
              const busy = unlink.isPending && unlink.variables === provider.id;
              return (
                <MethodRow
                  key={provider.id}
                  icon={provider.icon}
                  name={provider.name}
                  status={
                    connected
                      ? t.settings.connectedAccounts.connected
                      : t.settings.connectedAccounts.notConnected
                  }
                  action={
                    connected ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy || isLastMethod}
                        title={isLastMethod ? t.settings.connectedAccounts.lastMethod : undefined}
                        onClick={() => unlink.mutate(provider.id)}
                      >
                        {busy
                          ? t.common.saving
                          : t.settings.connectedAccounts.disconnect(provider.name)}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending === provider.id}
                        onClick={() => void connect(provider.id)}
                      >
                        {pending === provider.id
                          ? t.settings.connectedAccounts.connecting
                          : t.settings.connectedAccounts.connect(provider.name)}
                      </Button>
                    )
                  }
                />
              );
            })}
          </ul>
        ) : null}

        {explainLastMethod ? (
          <p className="text-muted-foreground text-sm">{t.settings.connectedAccounts.lastMethod}</p>
        ) : null}
        {accounts && !hasPassword ? (
          <p className="text-muted-foreground text-sm">{t.settings.connectedAccounts.noPassword}</p>
        ) : null}
        {accountsQuery.error ? (
          <p className="text-destructive text-sm">{t.settings.connectedAccounts.loadFailed}</p>
        ) : null}
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function MethodRow({
  icon,
  name,
  status,
  action,
}: {
  icon: React.ReactNode;
  name: string;
  status: string;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-muted-foreground text-sm">{status}</p>
        </div>
      </div>
      {action}
    </li>
  );
}

class UnlinkError extends Error {
  constructor(
    readonly code: string | undefined,
    message: string | undefined
  ) {
    super(message);
  }
}

type Dictionary = ReturnType<typeof useTranslation>["t"];

/** Codes better-auth appends to `errorCallbackURL` when a link is refused. */
function linkErrorMessage(code: string, t: Dictionary) {
  const errors = t.settings.connectedAccounts.errors;
  switch (code) {
    case "email_doesn't_match":
      return errors.emailMismatch;
    case "account_already_linked_to_different_user":
      return errors.alreadyLinked;
    case "access_denied":
      return errors.cancelled;
    default:
      return errors.generic;
  }
}

function unlinkErrorMessage(err: unknown, t: Dictionary) {
  const errors = t.settings.connectedAccounts.errors;
  const code = err instanceof UnlinkError ? err.code : undefined;
  switch (code) {
    // better-auth requires a session younger than its `freshAge` for this one.
    case "SESSION_NOT_FRESH":
      return errors.notFresh;
    case "FAILED_TO_UNLINK_LAST_ACCOUNT":
      return errors.lastAccount;
    default:
      return errors.generic;
  }
}
