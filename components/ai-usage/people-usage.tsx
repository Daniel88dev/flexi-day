"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pushToast } from "@/components/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { appLabel } from "@/lib/api/ai-connections";
import { formatUsd } from "@/lib/api/ai-settings";
import {
  REFUSED_WARNING,
  type AiUsage,
  type AiUsageApp,
  type AiUsagePersonToday,
} from "@/lib/api/ai-usage";
import { useRevokeAiConnection } from "@/lib/api/ai-usage-queries";
import { errorCopy } from "@/lib/api/client";
import { relativeTime } from "@/lib/calendar-sync/relative-time";
import { formatDate } from "@/lib/directory/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

const personKey = (person: AiUsagePersonToday) => person.userId ?? "deleted";

/** One row per person: this week's Assistant spend, refused turns, calls today and their apps. */
export function PeopleUsage({ usage }: { usage: AiUsage }) {
  const { t } = useTranslation();
  const copy = t.aiUsage.people;
  const phone = useIsMobile();
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (key: string) => setOpen((current) => (current === key ? null : key));

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          {copy.title}
        </CardTitle>
        <p className="text-muted-foreground text-sm">{copy.lead}</p>
      </CardHeader>
      <CardContent>
        {usage.people.length === 0 ? (
          <p className="text-muted-foreground text-sm">{copy.noUsage}</p>
        ) : phone ? (
          <ul className="space-y-3" aria-label={copy.title} data-testid="ai-usage-people-cards">
            {usage.people.map((person) => (
              <PersonCard
                key={personKey(person)}
                person={person}
                usage={usage}
                open={open === personKey(person)}
                onToggle={() => toggle(personKey(person))}
              />
            ))}
          </ul>
        ) : (
          <table className="w-full text-sm" data-testid="ai-usage-people-table">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="py-2 font-medium">{copy.person}</th>
                {usage.assistant.on ? (
                  <>
                    <th className="py-2 text-right font-medium">{copy.assistantWeek}</th>
                    <th className="py-2 pl-4 text-right font-medium" title={copy.refusedHint}>
                      {copy.refused}
                    </th>
                  </>
                ) : null}
                {usage.aiConnections.on ? (
                  <>
                    <th className="py-2 pl-6 text-right font-medium">{copy.callsToday}</th>
                    <th className="py-2 pl-6 font-medium">{copy.apps}</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {usage.people.map((person) => {
                const key = personKey(person);
                const isOpen = open === key && person.apps.length > 0;
                const span = 1 + (usage.assistant.on ? 2 : 0) + (usage.aiConnections.on ? 2 : 0);
                return (
                  <Fragment key={key}>
                    <tr className="border-b">
                      <td className="py-2.5">
                        <PersonName person={person} open={isOpen} onToggle={() => toggle(key)} />
                      </td>
                      {usage.assistant.on ? (
                        <>
                          <td className="py-2.5 text-right tabular-nums">
                            <Spend person={person} />
                          </td>
                          <td className="py-2.5 pl-4 text-right tabular-nums">
                            <Refused count={person.refusedTurns} />
                          </td>
                        </>
                      ) : null}
                      {usage.aiConnections.on ? (
                        <>
                          <td className="py-2.5 pl-6 text-right tabular-nums">
                            <CallsToday
                              person={person}
                              limit={usage.aiConnections.memberDailyLimit}
                            />
                          </td>
                          <td className="py-2.5 pl-6">
                            <AppMarks apps={person.apps} />
                          </td>
                        </>
                      ) : null}
                    </tr>
                    {isOpen ? (
                      <tr className="border-b bg-[var(--surface-2)]/50">
                        <td colSpan={span} className="px-4 py-3 md:px-10">
                          <PersonApps organizationId={usage.organizationId} apps={person.apps} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function PersonName({
  person,
  open,
  onToggle,
}: {
  person: AiUsagePersonToday;
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const copy = t.aiUsage.people;
  const name = person.name ?? copy.deletedAccount;
  const label = (
    <span className={cn(person.name === null && "text-muted-foreground italic")}>{name}</span>
  );
  if (person.apps.length === 0) {
    return (
      <span className="flex items-center gap-2.5">
        <span className="size-4" aria-hidden />
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      className="flex items-center gap-2.5 text-left"
      aria-expanded={open}
      aria-label={copy.showApps(name)}
      onClick={onToggle}
    >
      {open ? (
        <ChevronDown className="text-muted-foreground size-4" aria-hidden />
      ) : (
        <ChevronRight className="text-muted-foreground size-4" aria-hidden />
      )}
      {label}
    </button>
  );
}

function Spend({ person }: { person: AiUsagePersonToday }) {
  const { locale } = useTranslation();
  return (
    <span className={cn(person.assistantMicroUsd === 0 && "text-muted-foreground")}>
      {formatUsd(locale, person.assistantMicroUsd)}
    </span>
  );
}

function Refused({ count }: { count: number }) {
  return (
    <span
      data-warning={count >= REFUSED_WARNING ? "true" : undefined}
      className={cn(
        count === 0 && "text-muted-foreground",
        count >= REFUSED_WARNING && "font-semibold text-amber-700 dark:text-amber-400"
      )}
    >
      {count}
    </span>
  );
}

function CallsToday({ person, limit }: { person: AiUsagePersonToday; limit: number }) {
  const { t } = useTranslation();
  const count = new Intl.NumberFormat(t.common.dateLocale).format(person.callsToday);
  if (person.callsToday >= limit) {
    return (
      <span className="text-destructive font-semibold" data-warning="true">
        {t.aiUsage.people.atLimit(count)}
      </span>
    );
  }
  return <span className={cn(person.callsToday === 0 && "text-muted-foreground")}>{count}</span>;
}

function AppMarks({ apps }: { apps: AiUsageApp[] }) {
  const { t } = useTranslation();
  if (apps.length === 0) {
    return <span className="text-muted-foreground">{t.aiUsage.people.none}</span>;
  }
  return <span>{apps.map((app) => appLabel(app.app)).join(", ")}</span>;
}

function PersonCard({
  person,
  usage,
  open,
  onToggle,
}: {
  person: AiUsagePersonToday;
  usage: AiUsage;
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const copy = t.aiUsage.people;
  return (
    <li className="rounded-lg border p-3 text-sm">
      <PersonName person={person} open={open && person.apps.length > 0} onToggle={onToggle} />
      <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
        {usage.assistant.on ? (
          <>
            <dt className="text-muted-foreground">{copy.assistantWeek}</dt>
            <dd className="text-right tabular-nums">
              <Spend person={person} />
            </dd>
            <dt className="text-muted-foreground">{copy.refused}</dt>
            <dd className="text-right tabular-nums">
              <Refused count={person.refusedTurns} />
            </dd>
          </>
        ) : null}
        {usage.aiConnections.on ? (
          <>
            <dt className="text-muted-foreground">{copy.callsToday}</dt>
            <dd className="text-right tabular-nums">
              <CallsToday person={person} limit={usage.aiConnections.memberDailyLimit} />
            </dd>
            <dt className="text-muted-foreground">{copy.apps}</dt>
            <dd className="text-right">
              <AppMarks apps={person.apps} />
            </dd>
          </>
        ) : null}
      </dl>
      {open && person.apps.length > 0 ? (
        <div className="mt-3 border-t pt-3">
          <PersonApps organizationId={usage.organizationId} apps={person.apps} stacked />
        </div>
      ) : null}
    </li>
  );
}

/** A person's apps with Revoke and its inline confirm. */
function PersonApps({
  organizationId,
  apps,
  stacked = false,
}: {
  organizationId: string;
  apps: AiUsageApp[];
  stacked?: boolean;
}) {
  const { t } = useTranslation();
  const copy = t.aiUsage.people;
  const grants = t.aiConnectionGrants.settings;
  const revoke = useRevokeAiConnection(organizationId);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirmRevoke(app: AiUsageApp) {
    setError(null);
    try {
      await revoke.mutateAsync(app.grantId);
      setConfirming(null);
      pushToast(copy.revoked(appLabel(app.app)));
    } catch (err) {
      setError(errorCopy(err, {}, copy.revokeFailed));
    }
  }

  return (
    <div className="space-y-2">
      {stacked ? null : (
        <div
          aria-hidden
          className="text-muted-foreground grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_10.5rem] gap-x-4 border-b pb-2 text-xs font-medium"
        >
          <span>{copy.app}</span>
          <span>{copy.access}</span>
          <span>{copy.connected}</span>
          <span>{copy.lastUsed}</span>
          <span />
        </div>
      )}
      <ul aria-label={copy.apps} className="text-sm">
        {apps.map((app) => {
          const name = appLabel(app.app);
          return (
            <li
              key={app.grantId}
              className={cn(
                "items-center gap-x-4 gap-y-1 border-b py-2.5 last:border-0",
                stacked
                  ? "grid grid-cols-[1fr_auto]"
                  : "grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_10.5rem]"
              )}
            >
              <span className="leading-tight">
                <span className="block font-medium">{name}</span>
                <span className="text-muted-foreground block text-xs">
                  {app.app.host}
                  {app.app.verified ? null : ` · ${grants.notVerified}`}
                </span>
              </span>
              {stacked ? null : (
                <>
                  <span>{grants.access[app.access]}</span>
                  <span className="text-muted-foreground">
                    {formatDate(app.connectedAt, t.common.dateLocale)}
                  </span>
                  <span>{relativeTime(app.lastUsedAt, t)}</span>
                </>
              )}
              <span className={cn("flex justify-end", stacked && "row-span-2")}>
                {confirming === app.grantId ? (
                  <span className="inline-flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={revoke.isPending}
                      onClick={() => void confirmRevoke(app)}
                    >
                      {revoke.isPending ? copy.revoking : copy.revoke}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setConfirming(null);
                        setError(null);
                      }}
                    >
                      {copy.keep}
                    </Button>
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={copy.revokeApp(name)}
                    onClick={() => {
                      setConfirming(app.grantId);
                      setError(null);
                    }}
                  >
                    {copy.revoke}
                  </Button>
                )}
              </span>
              {stacked ? (
                <span className="text-muted-foreground text-xs">
                  {grants.access[app.access]} · {grants.lastUsed(relativeTime(app.lastUsedAt, t))}
                </span>
              ) : null}
              {confirming === app.grantId ? (
                <p className={cn("text-sm font-medium", stacked ? "col-span-2" : "col-span-5")}>
                  {copy.stopsAtNextCall}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
