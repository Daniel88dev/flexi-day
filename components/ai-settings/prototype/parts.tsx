"use client";

// PROTOTYPE (T-680): shared pieces for the owner settings, usage and AI connections design.
// Lives on prototype/* branches only. Nothing here calls the backend.

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Check, ChevronDown, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  APPS,
  CALL_DAYS,
  CALLS_TODAY,
  CONNECTIONS,
  DAILY_CONNECTION_LIMIT,
  MEMBER_DAILY_LIMIT,
  OLD_WEEKS_NOTE,
  ORG,
  OWNER,
  PAST_WEEKS,
  PEOPLE,
  RESET_LABEL,
  WEEKLY_LIMIT,
  count,
  money,
  type AppId,
  type Connection,
  type ConnectionsSetting,
  type Scenario,
} from "@/components/ai-settings/prototype/data";

/* ------------------------------------------------------------------ */
/* Small atoms                                                          */
/* ------------------------------------------------------------------ */

export function AppMark({ app, size = 28 }: { app: AppId; size?: number }) {
  const tone: Record<AppId, string> = {
    claude: "oklch(0.62 0.13 45)",
    chatgpt: "oklch(0.3 0.01 250)",
    cursor: "oklch(0.45 0.02 260)",
    unknown: "oklch(0.6 0.02 80)",
  };
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
      style={{ width: size, height: size, background: tone[app] }}
    >
      {APPS[app].mark}
    </span>
  );
}

export function Initials({ text, faint }: { text: string; faint?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
        faint
          ? "bg-[var(--surface-2)] text-[color:var(--text-faint)]"
          : "bg-primary/10 text-primary"
      )}
    >
      {text || "–"}
    </span>
  );
}

export function AccessLabel({ access }: { access: "read" | "write" }) {
  return <span className="text-sm">{access === "write" ? "Read and write" : "Read only"}</span>;
}

export function Muted({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-muted-foreground text-sm", className)}>{children}</p>;
}

export function OwnerOnlyNote() {
  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <Lock className="size-3.5" aria-hidden /> Only {OWNER}, the owner, can change this.
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* What leaves Flexi Day: the explanation an owner reads first          */
/* ------------------------------------------------------------------ */

export function AssistantFacts({ compact }: { compact?: boolean }) {
  const rows: [string, string][] = [
    [
      "What it does",
      "Members ask it about their time off, attendance and colleagues, and ask it to make changes. Every change waits for the member to confirm it.",
    ],
    [
      "What leaves Flexi Day",
      "Each message, and the Flexi Day data the Assistant reads to answer it, goes to Anthropic, our AI provider, in the United States. It reads only what the member asking can already see.",
    ],
    [
      "How long it's kept",
      "Flexi Day keeps chats for 180 days and members can delete their own. Anthropic deletes a chat 30 days after its last message and doesn't train models on it.",
    ],
    [
      "What it costs",
      `Nothing extra on Enterprise. The organization gets a Weekly limit of ${money(WEEKLY_LIMIT)} of AI use. When it runs out, the Assistant pauses for everyone until Monday 01:00.`,
    ],
    [
      "What you see",
      "You and org admins see each person's usage and how many of their messages were refused. Never what anyone wrote.",
    ],
  ];
  return (
    <dl
      className={cn("grid gap-x-6", compact ? "gap-y-2.5" : "gap-y-3.5 sm:grid-cols-[170px_1fr]")}
    >
      {rows.map(([term, text]) => (
        <div key={term} className="contents">
          <dt className="text-sm font-semibold">{term}</dt>
          <dd className={cn("text-sm leading-relaxed", compact ? "mb-1.5" : "")}>{text}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ConnectionsFacts({
  plan,
  compact,
}: {
  plan: "enterprise" | "pro";
  compact?: boolean;
}) {
  const rows: [string, string][] = [
    [
      "What it does",
      `Members connect AI apps they already use, such as Claude or ChatGPT, to their Flexi Day account. The app works with that member's own permissions in ${ORG}.`,
    ],
    [
      "What leaves Flexi Day",
      "What the app reads goes to the company behind that app, under the member's own agreement with them. Flexi Day has no agreement with those companies.",
    ],
    [
      "Read only",
      "Apps see what the member can see: requests, balances, who is away, attendance, the directory.",
    ],
    [
      "Read and write",
      "Apps can also create and cancel the member's own requests and clock them in and out. They never approve or reject requests.",
    ],
    [
      "Limits",
      `${count(DAILY_CONNECTION_LIMIT[plan])} calls a day for the organization, ${count(MEMBER_DAILY_LIMIT)} a day per member. Nothing extra to pay.`,
    ],
  ];
  return (
    <dl
      className={cn("grid gap-x-6", compact ? "gap-y-2.5" : "gap-y-3.5 sm:grid-cols-[170px_1fr]")}
    >
      {rows.map(([term, text]) => (
        <div key={term} className="contents">
          <dt className="text-sm font-semibold">{term}</dt>
          <dd className={cn("text-sm leading-relaxed", compact ? "mb-1.5" : "")}>{text}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* The two settings, with their confirm dialogs                        */
/* ------------------------------------------------------------------ */

export function useAiSettings(s: Scenario) {
  const [assistant, setAssistant] = useState(s.assistant);
  const [connections, setConnections] = useState<ConnectionsSetting>(s.connections);
  return { assistant, setAssistant, connections, setConnections };
}
export type AiSettingsState = ReturnType<typeof useAiSettings>;

/** The Assistant switch. Off by default; turning it on goes through the explanation. */
export function AssistantControl({
  s,
  st,
  showFacts = "dialog",
  forceDialog,
}: {
  s: Scenario;
  st: AiSettingsState;
  /** "inline" shows the explanation beside the switch while it is off; "dialog" only in the confirm. */
  showFacts?: "inline" | "dialog";
  forceDialog?: "on" | "off";
}) {
  const [dialog, setDialog] = useState<"on" | "off" | null>(forceDialog ?? null);
  const owner = s.role === "owner";

  if (s.plan !== "enterprise") {
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Assistant</p>
            <Muted>An in-app chat that answers questions and makes changes for members.</Muted>
          </div>
          <Switch checked={false} disabled aria-label="Assistant" />
        </div>
        <div className="rounded-lg bg-[var(--surface-2)] px-4 py-3">
          <p className="text-sm">The Assistant comes with Enterprise.</p>
          {owner ? (
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href="/billing">See Enterprise</Link>
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Assistant</p>
          <Muted>
            {st.assistant
              ? "On. Every member can open it from the top bar."
              : "Off. Members don't see it. Turn it on to let them ask questions and make changes in chat."}
          </Muted>
        </div>
        <Switch
          checked={st.assistant}
          disabled={!owner}
          aria-label="Assistant"
          onCheckedChange={(next) => setDialog(next ? "on" : "off")}
        />
      </div>
      {!st.assistant && showFacts === "inline" ? (
        <div className="rounded-lg bg-[var(--surface-2)] px-4 py-4">
          <AssistantFacts compact />
        </div>
      ) : null}
      {!owner ? <OwnerOnlyNote /> : null}

      <Dialog open={dialog === "on"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Turn on the Assistant for {ORG}?</DialogTitle>
            <DialogDescription>
              Read this before you turn it on. You can turn it off any time.
            </DialogDescription>
          </DialogHeader>
          <AssistantFacts />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                st.setAssistant(true);
                setDialog(null);
              }}
            >
              Turn on the Assistant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "off"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Turn off the Assistant?</DialogTitle>
            <DialogDescription>
              Members lose the Assistant at once. Their chats stay readable until they are 180 days
              old, and come back to life if you turn it on again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Keep it on
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                st.setAssistant(false);
                setDialog(null);
              }}
            >
              Turn off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const SEGMENTS: { key: ConnectionsSetting; label: string }[] = [
  { key: "off", label: "Off" },
  { key: "read", label: "Read only" },
  { key: "write", label: "Read and write" },
];

/** AI connections: Off / Read only / Read and write. Going down deletes grants, so it confirms. */
export function ConnectionsControl({
  s,
  st,
  showFacts = "dialog",
  forceDialog,
}: {
  s: Scenario;
  st: AiSettingsState;
  showFacts?: "inline" | "dialog";
  forceDialog?: ConnectionsSetting;
}) {
  const [pending, setPending] = useState<ConnectionsSetting | null>(forceDialog ?? null);
  const [firstChoice, setFirstChoice] = useState<"read" | "write">("read");
  const owner = s.role === "owner";
  const writeGrants = CONNECTIONS.filter((c) => c.access === "write").length;

  if (s.plan === "free") {
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold">AI connections</p>
          <Muted>Let members connect AI apps such as Claude or ChatGPT to Flexi Day.</Muted>
        </div>
        <Segmented value="off" disabled onChange={() => {}} />
        <div className="rounded-lg bg-[var(--surface-2)] px-4 py-3">
          <p className="text-sm">AI connections come with every paid plan.</p>
          <Button asChild size="sm" variant="outline" className="mt-2">
            <Link href="/billing">See plans</Link>
          </Button>
        </div>
      </div>
    );
  }

  const plan = s.plan === "pro" ? "pro" : "enterprise";
  function choose(next: ConnectionsSetting) {
    if (next === st.connections) return;
    if (st.connections === "off") {
      setFirstChoice(next === "write" ? "write" : "read");
      setPending("read");
      return;
    }
    if (next === "write") {
      st.setConnections("write");
      return;
    }
    setPending(next);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold">AI connections</p>
        <Muted>
          {st.connections === "off"
            ? "Off. Members can't connect AI apps such as Claude or ChatGPT to Flexi Day."
            : st.connections === "read"
              ? "Members' AI apps can read what the member can see."
              : "Members' AI apps can read, and change the member's own requests and attendance."}
        </Muted>
      </div>
      <Segmented value={st.connections} disabled={!owner} onChange={choose} />
      {st.connections === "off" && showFacts === "inline" ? (
        <div className="rounded-lg bg-[var(--surface-2)] px-4 py-4">
          <ConnectionsFacts plan={plan} compact />
        </div>
      ) : null}
      {!owner ? <OwnerOnlyNote /> : null}

      <Dialog
        open={pending !== null}
        onOpenChange={(o) => {
          if (!o) setPending(null);
        }}
      >
        <DialogContent className="sm:max-w-[620px]">
          {st.connections === "off" ? (
            <>
              <DialogHeader>
                <DialogTitle>Turn on AI connections for {ORG}?</DialogTitle>
                <DialogDescription>
                  Read this before you turn it on. You can turn it off any time.
                </DialogDescription>
              </DialogHeader>
              <ConnectionsFacts plan={plan} />
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-semibold">Start with</legend>
                {(["read", "write"] as const).map((key) => (
                  <label
                    key={key}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3",
                      firstChoice === key ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <input
                      type="radio"
                      name="first-choice"
                      className="accent-primary mt-1"
                      checked={firstChoice === key}
                      onChange={() => setFirstChoice(key)}
                    />
                    <span className="space-y-0.5">
                      <span className="block text-sm font-medium">
                        {key === "read" ? "Read only" : "Read and write"}
                      </span>
                      <span className="text-muted-foreground block text-sm">
                        {key === "read"
                          ? "Apps can look things up. A safe way to start."
                          : "Apps can also create and cancel the member's own requests and clock in and out."}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setPending(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    st.setConnections(firstChoice);
                    setPending(null);
                  }}
                >
                  Turn on AI connections
                </Button>
              </DialogFooter>
            </>
          ) : pending === "read" ? (
            <>
              <DialogHeader>
                <DialogTitle>Switch AI connections to read only?</DialogTitle>
              </DialogHeader>
              <WarningBox>
                This disconnects the {writeGrants} apps that have write access now. Their members
                can connect again with read access.
              </WarningBox>
              <AffectedList connections={CONNECTIONS.filter((c) => c.access === "write")} />
              <DialogFooter>
                <Button variant="ghost" onClick={() => setPending(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    st.setConnections("read");
                    setPending(null);
                  }}
                >
                  Disconnect {writeGrants} apps and switch
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Turn off AI connections?</DialogTitle>
              </DialogHeader>
              <WarningBox>
                This disconnects all {CONNECTIONS.length} connected apps now. If you turn it on
                again, every member has to connect again.
              </WarningBox>
              <AffectedList connections={CONNECTIONS} />
              <DialogFooter>
                <Button variant="ghost" onClick={() => setPending(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    st.setConnections("off");
                    setPending(null);
                  }}
                >
                  Disconnect all and turn off
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Segmented({
  value,
  disabled,
  onChange,
}: {
  value: ConnectionsSetting;
  disabled?: boolean;
  onChange: (v: ConnectionsSetting) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="AI connections"
      className="inline-flex rounded-lg bg-[var(--surface-2)] p-1"
    >
      {SEGMENTS.map((seg) => (
        <button
          key={seg.key}
          type="button"
          role="radio"
          aria-checked={value === seg.key}
          disabled={disabled}
          onClick={() => onChange(seg.key)}
          className={cn(
            "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed",
            value === seg.key
              ? "text-foreground bg-[var(--surface)] shadow-sm"
              : "text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground"
          )}
        >
          {seg.label}
        </button>
      ))}
    </div>
  );
}

function WarningBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-lg bg-amber-500/10 px-3.5 py-3 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
      <p>{children}</p>
    </div>
  );
}

function AffectedList({ connections }: { connections: Connection[] }) {
  return (
    <ul className="divide-border divide-y text-sm">
      {connections.map((c) => (
        <li key={c.id} className="flex items-center gap-3 py-2">
          <AppMark app={c.app} size={22} />
          <span className="font-medium">{APPS[c.app].name}</span>
          <span className="text-muted-foreground">{c.person}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Usage                                                                */
/* ------------------------------------------------------------------ */

export function WeeklyMeter({ s, size = "large" }: { s: Scenario; size?: "large" | "small" }) {
  const ratio = Math.min(1, s.used / WEEKLY_LIMIT);
  const reached = s.limitReachedAt !== null;
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={cn(
            "font-heading font-bold tabular-nums",
            size === "large" ? "text-4xl tracking-tight" : "text-2xl"
          )}
        >
          {money(s.used)}
        </span>
        <span className="text-muted-foreground text-sm">
          of {money(WEEKLY_LIMIT)} Weekly limit · {Math.round(ratio * 100)}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className={cn("h-full rounded-full", reached ? "bg-destructive" : "bg-primary")}
          style={{ width: `${Math.max(ratio * 100, s.used > 0 ? 1 : 0)}%` }}
        />
      </div>
      {reached ? (
        <p className="text-sm">
          <span className="text-destructive font-semibold">Weekly limit reached</span> on{" "}
          {s.limitReachedAt}. The Assistant is paused for everyone until {RESET_LABEL}.
        </p>
      ) : (
        <Muted>Resets {RESET_LABEL}. Includes answers being written right now.</Muted>
      )}
    </div>
  );
}

export function PeopleUsage({ s, compact }: { s: Scenario; compact?: boolean }) {
  if (s.empty) {
    return <Muted>No one has used the Assistant this week.</Muted>;
  }
  const rows = s.limitReachedAt
    ? PEOPLE.map((p, i) => ({ ...p, used: i === 0 ? p.used + 3.58 : p.used }))
    : PEOPLE;
  const max = Math.max(...rows.map((p) => p.used));
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-muted-foreground border-b text-left">
          <th className="py-2 font-medium">Person</th>
          {!compact ? <th className="hidden w-[38%] py-2 font-medium sm:table-cell" /> : null}
          <th className="py-2 text-right font-medium">Used this week</th>
          <th
            className="py-2 pl-4 text-right font-medium"
            title="Messages refused as off topic or unsafe. What they said isn't kept."
          >
            Refused
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id} className="border-b last:border-0">
            <td className="py-2.5">
              <span className="flex items-center gap-2.5">
                <Initials text={p.initials} faint={p.deleted} />
                <span className={cn(p.deleted && "text-muted-foreground italic")}>{p.name}</span>
              </span>
            </td>
            {!compact ? (
              <td className="hidden py-2.5 pr-4 sm:table-cell">
                <div className="h-1.5 rounded-full bg-[var(--surface-2)]">
                  <div
                    className="bg-primary/70 h-full rounded-full"
                    style={{ width: `${(p.used / max) * 100}%` }}
                  />
                </div>
              </td>
            ) : null}
            <td className="py-2.5 text-right tabular-nums">{money(p.used)}</td>
            <td className="py-2.5 pl-4 text-right tabular-nums">
              {p.rejected > 0 ? (
                <span
                  className={cn(
                    p.rejected >= 3 && "font-semibold text-amber-700 dark:text-amber-400"
                  )}
                >
                  {p.rejected}
                </span>
              ) : (
                <span className="text-muted-foreground">0</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function PastWeeks({ s }: { s: Scenario }) {
  const [open, setOpen] = useState<string | null>(null);
  if (s.empty) return <Muted>Past weeks appear here after the first Monday.</Muted>;
  return (
    <div className="space-y-1">
      <ul>
        {PAST_WEEKS.map((w) => {
          const isOpen = open === w.label;
          return (
            <li key={w.label} className="border-b last:border-0">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : w.label)}
                aria-expanded={isOpen}
                className="hover:bg-muted/40 flex w-full items-center gap-3 rounded-md py-2.5 text-left text-sm"
              >
                {isOpen ? (
                  <ChevronDown className="text-muted-foreground size-4" aria-hidden />
                ) : (
                  <ChevronRight className="text-muted-foreground size-4" aria-hidden />
                )}
                <span className="w-28 shrink-0">{w.label}</span>
                <span className="hidden h-1.5 flex-1 rounded-full bg-[var(--surface-2)] sm:block">
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      w.limitReachedAt ? "bg-destructive/80" : "bg-primary/60"
                    )}
                    style={{ width: `${(w.used / WEEKLY_LIMIT) * 100}%` }}
                  />
                </span>
                <span className="w-16 text-right tabular-nums">{money(w.used)}</span>
                <span className="text-muted-foreground w-44 text-right text-xs">
                  {w.limitReachedAt ? `Limit reached ${w.limitReachedAt}` : ""}
                </span>
              </button>
              {isOpen ? (
                <div className="pb-3 pl-7">
                  <PeopleUsage s={{ ...s, limitReachedAt: null }} compact />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      <Muted className="pt-2 text-xs">
        {OLD_WEEKS_NOTE} Per-person usage is kept for 180 days.
      </Muted>
    </div>
  );
}

export function ConnectionCalls({ s, perMember = true }: { s: Scenario; perMember?: boolean }) {
  if (s.connections === "off" || s.plan === "free") {
    return <Muted>AI connections are off, so there are no calls to show.</Muted>;
  }
  const limit = DAILY_CONNECTION_LIMIT[s.plan === "pro" ? "pro" : "enterprise"];
  const max = Math.max(limit, ...CALL_DAYS.map((d) => d.calls));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="font-heading text-2xl font-bold tabular-nums">{count(CALLS_TODAY)}</span>
        <span className="text-muted-foreground text-sm">
          of {count(limit)} calls today, the daily AI connection limit · resets at 01:00
        </span>
      </div>
      <div>
        <div
          className="flex h-28 items-end gap-1.5"
          role="img"
          aria-label="Calls per day, last 14 days"
        >
          {CALL_DAYS.map((d) => (
            <div key={d.label} className="flex h-full flex-1 flex-col justify-end">
              <div
                title={`${d.label}: ${count(d.calls)} calls${d.limitReached ? ", limit reached" : ""}`}
                className={cn(
                  "w-full rounded-sm",
                  d.limitReached
                    ? "bg-destructive/80"
                    : d.label === "12 Nov"
                      ? "bg-primary"
                      : "bg-primary/35"
                )}
                style={{ height: `${Math.max(2, (d.calls / max) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="text-muted-foreground mt-1.5 flex justify-between text-xs">
          <span>30 Oct</span>
          <span className="text-destructive">4 Nov: limit reached</span>
          <span>Today</span>
        </div>
      </div>
      {perMember ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Today, per member</p>
          <ul className="text-sm">
            {PEOPLE.filter((p) => p.callsToday > 0).map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-b py-2 last:border-0">
                <Initials text={p.initials} />
                <span className="flex-1">{p.name}</span>
                <span className="tabular-nums">
                  {count(p.callsToday)}{" "}
                  <span className="text-muted-foreground">of {count(MEMBER_DAILY_LIMIT)}</span>
                </span>
                <span className="w-24 text-right text-xs">
                  {p.callsToday >= MEMBER_DAILY_LIMIT ? (
                    <span className="text-destructive font-semibold">Limit reached</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Connections: the organization's view, with revoke                   */
/* ------------------------------------------------------------------ */

export function AppCell({ app }: { app: AppId }) {
  const a = APPS[app];
  return (
    <span className="flex items-center gap-2.5">
      <AppMark app={app} />
      <span className="leading-tight">
        <span className="block font-medium">{a.name}</span>
        <span className="text-muted-foreground block text-xs">
          {a.host}
          {a.verified ? null : " · name not verified"}
        </span>
      </span>
    </span>
  );
}

export function OrgConnections({
  s,
  rows = CONNECTIONS,
  showPerson = true,
}: {
  s: Scenario;
  rows?: Connection[];
  showPerson?: boolean;
}) {
  const [revoked, setRevoked] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<string | null>(null);

  if (s.plan === "free" || s.connections === "off") {
    return <Muted>No apps are connected. AI connections are off.</Muted>;
  }
  const visible = rows
    .filter((c) => !revoked.has(c.id))
    .filter((c) => s.connections === "write" || c.access === "read");
  if (visible.length === 0) return <Muted>No member has connected an app yet.</Muted>;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-muted-foreground border-b text-left">
          {showPerson ? <th className="py-2 font-medium">Member</th> : null}
          <th className="py-2 font-medium">App</th>
          <th className="py-2 font-medium">Access</th>
          <th className="hidden py-2 font-medium md:table-cell">Connected</th>
          <th className="py-2 font-medium">Last used</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {visible.map((c) => (
          <tr key={c.id} className="border-b last:border-0">
            {showPerson ? <td className="py-2.5">{c.person}</td> : null}
            <td className="py-2.5">
              <AppCell app={c.app} />
            </td>
            <td className="py-2.5">
              <AccessLabel access={c.access} />
            </td>
            <td className="text-muted-foreground hidden py-2.5 md:table-cell">{c.connected}</td>
            <td className="py-2.5">{c.lastUsed}</td>
            <td className="py-2.5 text-right">
              {confirming === c.id ? (
                <span className="inline-flex items-center gap-2">
                  <span className="text-muted-foreground hidden text-xs lg:inline">
                    Stops at its next call
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setRevoked(new Set(revoked).add(c.id));
                      setConfirming(null);
                    }}
                  >
                    Revoke
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                    Keep
                  </Button>
                </span>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setConfirming(c.id)}>
                  Revoke
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function RevokedNote({ n }: { n: number }) {
  return n > 0 ? (
    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <Check className="size-3.5" aria-hidden /> {n} revoked
    </p>
  ) : null;
}
