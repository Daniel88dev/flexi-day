"use client";

// PROTOTYPE (T-680): three layouts for where the owner's AI settings, usage and the
// organization's AI connections live, ?variant=A|B|C, walked through ?state=.
//   A: cards on the Organization page.
//   B: an AI tab on the Organization page, a settings layout without cards.
//   C: a person-first "AI usage" page in the sidebar; the switches stay on the Organization page.
// Lives on prototype/* branches only. Nothing here calls the backend.

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrototypeSwitcher } from "@/components/dev/prototype-switcher";
import type { NavLink } from "@/lib/navigation/shell-links";
import { cn } from "@/lib/utils";
import {
  CONNECTIONS,
  ORG,
  PAST_WEEKS,
  PEOPLE,
  STATES,
  WEEKLY_LIMIT,
  count,
  money,
  scenario,
} from "@/components/ai-settings/prototype/data";
import {
  AppMark,
  AssistantControl,
  ConnectionCalls,
  ConnectionsControl,
  Initials,
  Muted,
  OrgConnections,
  PastWeeks,
  PeopleUsage,
  WeeklyMeter,
  useAiSettings,
} from "@/components/ai-settings/prototype/parts";

export const VARIANTS = [
  { key: "A", name: "Cards on Organization" },
  { key: "B", name: "AI tab, settings layout" },
  { key: "C", name: "AI usage page, per person" },
] as const;

export function useAiPrototype() {
  const params = useSearchParams();
  const variant = params.get("variant") ?? "A";
  const state = params.get("state");
  const dialog = params.get("dialog");
  return { variant, state, dialog, s: scenario(state) };
}

/** Keeps ?variant and ?state when moving between the prototype's pages. */
export function useProtoHref() {
  const params = useSearchParams();
  return (path: string, extra?: Record<string, string>) => {
    const search = new URLSearchParams();
    for (const key of ["variant", "state"]) {
      const v = params.get(key);
      if (v) search.set(key, v);
    }
    for (const [k, v] of Object.entries(extra ?? {})) search.set(k, v);
    const q = search.toString();
    return q ? `${path}?${q}` : path;
  };
}

export function AiPrototypeSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const state = params.get("state") ?? "on";
  return (
    <PrototypeSwitcher
      variants={VARIANTS}
      extra={
        <select
          aria-label="State"
          value={state}
          onChange={(e) => {
            const search = new URLSearchParams(params.toString());
            search.set("state", e.target.value);
            search.delete("dialog");
            router.replace(`${pathname}?${search.toString()}`, { scroll: false });
          }}
          className="ml-1 rounded-full bg-white/15 px-2 py-1 text-[12px] font-medium text-white"
        >
          {STATES.map((st) => (
            <option key={st.key} value={st.key} className="text-black">
              {st.name}
            </option>
          ))}
        </select>
      }
    />
  );
}

/** Variant C's sidebar entry, under Organization. */
export function useAiUsagePrototypeLink(): NavLink | null {
  const params = useSearchParams();
  const pathname = usePathname();
  const show = params.get("variant") === "C" || pathname.startsWith("/ai-usage");
  if (!show) return null;
  const search = new URLSearchParams();
  search.set("variant", "C");
  const st = params.get("state");
  if (st) search.set("state", st);
  return { href: `/ai-usage?${search.toString()}`, label: "AI usage", icon: Sparkles };
}

function dialogFor(dialog: string | null) {
  return {
    assistant: dialog === "assistant-on" ? ("on" as const) : undefined,
    connections:
      dialog === "connections-on"
        ? ("read" as const)
        : dialog === "lower"
          ? ("read" as const)
          : dialog === "connections-off"
            ? ("off" as const)
            : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* A: cards on the Organization page                                    */
/* ------------------------------------------------------------------ */

export function OrganizationAiSectionA() {
  const { s, dialog, state } = useAiPrototype();
  const st = useAiSettings(s);
  const d = dialogFor(dialog);
  const [tab, setTab] = useState<"week" | "past" | "calls">("week");
  const assistantUsage = s.plan === "enterprise" && st.assistant;

  return (
    <div key={state} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" aria-hidden />
            AI
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8 md:grid-cols-2">
          <AssistantControl s={s} st={st} showFacts="inline" forceDialog={d.assistant} />
          <ConnectionsControl s={s} st={st} showFacts="inline" forceDialog={d.connections} />
        </CardContent>
      </Card>

      {assistantUsage || st.connections !== "off" ? (
        <Card id="usage">
          <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle>Usage</CardTitle>
            <div className="flex gap-1 rounded-lg bg-[var(--surface-2)] p-1">
              {(
                [
                  ["week", "Assistant this week", assistantUsage],
                  ["past", "Past weeks", assistantUsage],
                  ["calls", "AI connections", st.connections !== "off"],
                ] as const
              )
                .filter(([, , show]) => show)
                .map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={tab === key}
                    onClick={() => setTab(key)}
                    className={cn(
                      "rounded-md px-3 py-1 text-sm font-medium",
                      tab === key
                        ? "text-foreground bg-[var(--surface)] shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
            </div>
          </CardHeader>
          <CardContent>
            {tab === "week" && assistantUsage ? (
              <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                <WeeklyMeter s={s} />
                <PeopleUsage s={s} />
              </div>
            ) : tab === "past" && assistantUsage ? (
              <PastWeeks s={s} />
            ) : (
              <ConnectionCalls s={{ ...s, connections: st.connections }} />
            )}
          </CardContent>
        </Card>
      ) : null}

      {s.plan !== "free" && st.connections !== "off" ? (
        <Card>
          <CardHeader>
            <CardTitle>Connected AI apps</CardTitle>
            <Muted>
              Apps members in {ORG} have connected. Revoking one disconnects it for that member
              only.
            </Muted>
          </CardHeader>
          <CardContent>
            <OrgConnections s={{ ...s, connections: st.connections }} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* B: an AI tab on the Organization page                                */
/* ------------------------------------------------------------------ */

export function OrganizationTabsB() {
  const params = useSearchParams();
  const href = useProtoHref();
  const tab = params.get("tab") === "ai" ? "ai" : "general";
  return (
    <nav className="flex gap-6 border-b" aria-label="Organization sections">
      {(
        [
          ["general", "General"],
          ["ai", "AI"],
        ] as const
      ).map(([key, label]) => (
        <Link
          key={key}
          href={href("/organization", key === "ai" ? { tab: "ai" } : {})}
          aria-current={tab === key ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 pb-2.5 text-sm font-medium",
            tab === key
              ? "border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground border-transparent"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function SettingsRow({
  title,
  lead,
  children,
  id,
}: {
  title: string;
  lead: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="grid gap-x-12 gap-y-4 border-b py-8 last:border-0 lg:grid-cols-[280px_minmax(0,1fr)]"
    >
      <div className="space-y-1.5">
        <h2 className="font-heading text-base font-semibold">{title}</h2>
        <div className="text-muted-foreground text-sm leading-relaxed">{lead}</div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function OrganizationAiPageB() {
  const { s, dialog, state } = useAiPrototype();
  const st = useAiSettings(s);
  const d = dialogFor(dialog);
  const assistantUsage = s.plan === "enterprise" && st.assistant;

  return (
    <div key={state} className="max-w-[1100px]">
      <SettingsRow
        title="Assistant"
        lead="An in-app chat for every member, on Enterprise. Off until you turn it on."
      >
        <AssistantControl s={s} st={st} showFacts="inline" forceDialog={d.assistant} />
      </SettingsRow>
      <SettingsRow
        title="AI connections"
        lead="Members connect AI apps they already use, such as Claude or ChatGPT. Off until you turn it on."
      >
        <ConnectionsControl s={s} st={st} showFacts="inline" forceDialog={d.connections} />
      </SettingsRow>
      {assistantUsage ? (
        <>
          <SettingsRow
            id="usage"
            title="Assistant usage this week"
            lead={`AI use is counted in dollars against a Weekly limit of ${money(WEEKLY_LIMIT)} for the whole organization. Members see only a percentage near the limit.`}
          >
            <div className="space-y-6">
              <WeeklyMeter s={s} />
              <PeopleUsage s={s} />
            </div>
          </SettingsRow>
          <SettingsRow
            title="Past weeks"
            lead="Open a week to see who used what. Per-person usage is kept for 180 days."
          >
            <PastWeeks s={s} />
          </SettingsRow>
        </>
      ) : null}
      {s.plan !== "free" && st.connections !== "off" ? (
        <>
          <SettingsRow
            title="AI connection calls"
            lead="Every lookup or change an app makes is one call. Reaching a limit sends no email; apps get an error until 01:00."
          >
            <ConnectionCalls s={{ ...s, connections: st.connections }} />
          </SettingsRow>
          <SettingsRow
            title="Connected apps"
            lead="Revoking an app disconnects it for that member only. It stops at its next call."
          >
            <OrgConnections s={{ ...s, connections: st.connections }} />
          </SettingsRow>
        </>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* C: an AI usage page in the sidebar, organised per person            */
/* ------------------------------------------------------------------ */

export function OrganizationAiCardC() {
  const { s, dialog, state } = useAiPrototype();
  const st = useAiSettings(s);
  const d = dialogFor(dialog);
  const href = useProtoHref();
  return (
    <Card key={state} className="md:col-span-2">
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" aria-hidden />
          AI
        </CardTitle>
        {s.plan !== "free" ? (
          <Button asChild size="sm" variant="outline">
            <Link href={href("/ai-usage")}>See AI usage</Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-8 md:grid-cols-2">
        <AssistantControl s={s} st={st} showFacts="dialog" forceDialog={d.assistant} />
        <ConnectionsControl s={s} st={st} showFacts="dialog" forceDialog={d.connections} />
      </CardContent>
    </Card>
  );
}

export function AiUsagePageC() {
  const { s, state } = useAiPrototype();
  const href = useProtoHref();
  const [openPerson, setOpenPerson] = useState<string | null>("petr");
  const assistantOn = s.plan === "enterprise" && s.assistant;
  const connectionsOn = s.plan !== "free" && s.connections !== "off";

  if (!assistantOn && !connectionsOn) {
    return (
      <div className="space-y-3">
        <h1 className="font-heading text-2xl font-bold">AI usage</h1>
        <Muted>
          The Assistant and AI connections are both off in {ORG}, so there is nothing to show.
        </Muted>
        <Button asChild size="sm" variant="outline">
          <Link href={href("/organization")}>Open organization settings</Link>
        </Button>
      </div>
    );
  }

  const weeks = [...PAST_WEEKS].reverse();

  return (
    <div key={state} className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">AI usage</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {ORG} · the Assistant and members&apos; connected AI apps
          </p>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href={href("/organization")}>Settings</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Assistant this week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {assistantOn ? (
              <>
                <WeeklyMeter s={s} />
                {!s.empty ? (
                  <div>
                    <div
                      className="flex h-24 items-end gap-2"
                      role="img"
                      aria-label="Assistant usage per week"
                    >
                      {[
                        ...weeks,
                        {
                          label: "This week",
                          used: s.used,
                          limitReachedAt: s.limitReachedAt ?? undefined,
                        },
                      ].map((w) => (
                        <div key={w.label} className="flex h-full flex-1 flex-col justify-end">
                          <div
                            title={`${w.label}: ${money(w.used)}`}
                            className={cn(
                              "w-full rounded-sm",
                              w.limitReachedAt
                                ? "bg-destructive/80"
                                : w.label === "This week"
                                  ? "bg-primary"
                                  : "bg-primary/35"
                            )}
                            style={{ height: `${Math.max(2, (w.used / WEEKLY_LIMIT) * 100)}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="text-muted-foreground mt-1.5 flex justify-between text-xs">
                      <span>{weeks[0].label}</span>
                      <span>This week</span>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <Muted>
                {s.plan === "enterprise"
                  ? "The Assistant is off."
                  : "The Assistant comes with Enterprise."}
              </Muted>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI connections today</CardTitle>
          </CardHeader>
          <CardContent>
            {connectionsOn ? (
              <ConnectionCalls s={s} perMember={false} />
            ) : (
              <Muted>AI connections are off.</Muted>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
          <Muted>Open a person to see the apps they connected and revoke one.</Muted>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="py-2 font-medium">Person</th>
                {assistantOn ? (
                  <>
                    <th className="py-2 text-right font-medium">Assistant this week</th>
                    <th className="py-2 text-right font-medium">Refused</th>
                  </>
                ) : null}
                {connectionsOn ? (
                  <>
                    <th className="py-2 pl-6 text-right font-medium">AI calls today</th>
                    <th className="py-2 pl-6 font-medium">Connected apps</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {PEOPLE.map((p) => {
                const apps = CONNECTIONS.filter(
                  (c) => c.personId === p.id && (s.connections === "write" || c.access === "read")
                );
                const open = openPerson === p.id && connectionsOn && apps.length > 0;
                return (
                  <PersonRow
                    key={p.id}
                    open={open}
                    onToggle={() => setOpenPerson(open ? null : p.id)}
                    expandable={connectionsOn && apps.length > 0}
                    cells={
                      <>
                        <td className="py-2.5">
                          <span className="flex items-center gap-2.5">
                            {connectionsOn && apps.length > 0 ? (
                              open ? (
                                <ChevronDown className="text-muted-foreground size-4" aria-hidden />
                              ) : (
                                <ChevronRight
                                  className="text-muted-foreground size-4"
                                  aria-hidden
                                />
                              )
                            ) : (
                              <span className="size-4" />
                            )}
                            <Initials text={p.initials} faint={p.deleted} />
                            <span className={cn(p.deleted && "text-muted-foreground italic")}>
                              {p.name}
                            </span>
                          </span>
                        </td>
                        {assistantOn ? (
                          <>
                            <td className="py-2.5 text-right tabular-nums">
                              {s.empty ? (
                                <span className="text-muted-foreground">$0.00</span>
                              ) : (
                                money(p.used)
                              )}
                            </td>
                            <td className="py-2.5 text-right tabular-nums">
                              {s.empty || p.rejected === 0 ? (
                                <span className="text-muted-foreground">0</span>
                              ) : (
                                <span
                                  className={cn(
                                    p.rejected >= 3 &&
                                      "font-semibold text-amber-700 dark:text-amber-400"
                                  )}
                                >
                                  {p.rejected}
                                </span>
                              )}
                            </td>
                          </>
                        ) : null}
                        {connectionsOn ? (
                          <>
                            <td className="py-2.5 pl-6 text-right tabular-nums">
                              {p.callsToday >= 1000 ? (
                                <span className="text-destructive font-semibold">
                                  {count(p.callsToday)} · limit
                                </span>
                              ) : p.callsToday > 0 ? (
                                count(p.callsToday)
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </td>
                            <td className="py-2.5 pl-6">
                              <span className="flex items-center gap-1">
                                {apps.length === 0 ? (
                                  <span className="text-muted-foreground">None</span>
                                ) : (
                                  apps.map((c) => <AppMark key={c.id} app={c.app} size={22} />)
                                )}
                              </span>
                            </td>
                          </>
                        ) : null}
                      </>
                    }
                    detail={<OrgConnections s={s} rows={apps} showPerson={false} />}
                    span={1 + (assistantOn ? 2 : 0) + (connectionsOn ? 2 : 0)}
                  />
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {assistantOn && !s.empty ? (
        <Card>
          <CardHeader>
            <CardTitle>Past weeks</CardTitle>
          </CardHeader>
          <CardContent>
            <PastWeeks s={s} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function PersonRow({
  cells,
  detail,
  open,
  onToggle,
  expandable,
  span,
}: {
  cells: ReactNode;
  detail: ReactNode;
  open: boolean;
  onToggle: () => void;
  expandable: boolean;
  span: number;
}) {
  return (
    <>
      <tr
        className={cn("border-b", expandable && "hover:bg-muted/40 cursor-pointer")}
        onClick={expandable ? onToggle : undefined}
        aria-expanded={expandable ? open : undefined}
      >
        {cells}
      </tr>
      {open ? (
        <tr className="border-b bg-[var(--surface-2)]/50">
          <td colSpan={span} className="px-10 py-3">
            {detail}
          </td>
        </tr>
      ) : null}
    </>
  );
}
