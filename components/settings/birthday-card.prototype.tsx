"use client";

// PROTOTYPE (T-339): three looks for the birthday settings card, switched with ?variant=A|B|C.
// Fixtures only, nothing saves. ?pro=some|all|none sets which groups are on Pro,
// ?bday=set|empty the starting state. Lives on prototype/birthday-settings only.

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Cake, Check, Lock, Minus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PrototypeSwitcher } from "@/components/dev/prototype-switcher";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TODAY = new Date(2026, 9, 17);

type Birthday = { day: number | null; month: number | null; year: string };
type Group = { name: string; pro: boolean };

function fixtureGroups(pro: string | null): Group[] {
  const groups = [
    { name: "Platform", pro: true },
    { name: "Support Prague", pro: true },
    { name: "Climbing club", pro: false },
  ];
  if (pro === "all") return groups.map((g) => ({ ...g, pro: true }));
  if (pro === "none") return groups.map((g) => ({ ...g, pro: false }));
  return groups;
}

function daysIn(month: number | null) {
  if (month === null) return 31;
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

function validYear(year: string) {
  const n = Number(year);
  return /^\d{4}$/.test(year) && n >= 1900 && n <= TODAY.getFullYear();
}

function ageOf(b: Birthday) {
  if (!b.day || !b.month || !validYear(b.year)) return null;
  const y = Number(b.year);
  const hadIt =
    TODAY.getMonth() + 1 > b.month ||
    (TODAY.getMonth() + 1 === b.month && TODAY.getDate() >= b.day);
  return TODAY.getFullYear() - y - (hadIt ? 0 : 1);
}

function dateLabel(b: Birthday, withYear = true) {
  if (!b.day || !b.month) return null;
  const base = `${b.day} ${MONTHS[b.month - 1]}`;
  return withYear && validYear(b.year) ? `${base} ${b.year}` : base;
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function DateFields({
  value,
  onChange,
  compact,
}: {
  value: Birthday;
  onChange: (b: Birthday) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-3",
        compact ? "grid-cols-[4.5rem_1fr_5.5rem]" : "grid-cols-[5.5rem_1fr_7rem]"
      )}
    >
      <div className="space-y-1.5">
        <Label htmlFor="bday-day">Day</Label>
        <Select
          value={value.day ? String(value.day) : ""}
          onValueChange={(v) => onChange({ ...value, day: Number(v) })}
        >
          <SelectTrigger id="bday-day" className="w-full">
            <SelectValue placeholder="-" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: daysIn(value.month) }, (_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bday-month">Month</Label>
        <Select
          value={value.month ? String(value.month) : ""}
          onValueChange={(v) => {
            const month = Number(v);
            onChange({
              ...value,
              month,
              day: value.day && value.day > daysIn(month) ? null : value.day,
            });
          }}
        >
          <SelectTrigger id="bday-month" className="w-full">
            <SelectValue placeholder="-" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={m} value={String(i + 1)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bday-year">
          Year <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="bday-year"
          inputMode="numeric"
          maxLength={4}
          value={value.year}
          onChange={(e) => onChange({ ...value, year: e.target.value.replace(/\D/g, "") })}
        />
      </div>
    </div>
  );
}

function LeapNote({ b }: { b: Birthday }) {
  if (b.day !== 29 || b.month !== 2) return null;
  return (
    <p className="text-muted-foreground text-sm">
      In years without 29 February, it shows on 28 February.
    </p>
  );
}

function ProNote({ groups, sharing }: { groups: Group[]; sharing: boolean }) {
  const pro = groups.filter((g) => g.pro).map((g) => g.name);
  const free = groups.filter((g) => !g.pro).map((g) => g.name);
  if (!sharing) return null;
  return (
    <p className="text-muted-foreground text-sm">
      Shown in {joinNames(pro)}.{" "}
      {free.length > 0
        ? `${joinNames(free)} ${free.length === 1 ? "is" : "are"} on the Free plan, so it doesn't show there.`
        : null}
    </p>
  );
}

function NoProNotice() {
  return (
    <div className="bg-muted text-muted-foreground flex items-start gap-2.5 rounded-lg p-3 text-sm">
      <Lock className="mt-0.5 size-4 flex-none" />
      <span>
        None of your groups is on the Pro plan, so there is nowhere to share your birthday yet. You
        still see it on your own calendar.
      </span>
    </div>
  );
}

function SaveRow({
  dirty,
  onSave,
  onCancel,
}: {
  dirty: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button onClick={onSave} disabled={!dirty}>
        Save
      </Button>
      {dirty ? (
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      ) : null}
    </div>
  );
}

type VariantProps = {
  stored: Birthday;
  setStored: (b: Birthday) => void;
  sharing: boolean;
  setSharing: (v: boolean) => void;
  groups: Group[];
  firstName: string;
};

/* A: one form, top to bottom, like the dashboard calendar card. */
function VariantA({ stored, setStored, sharing, setSharing, groups }: VariantProps) {
  const [draft, setDraft] = useState<Birthday | null>(null);
  const value = draft ?? stored;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(stored);
  const age = ageOf(value);
  const anyPro = groups.some((g) => g.pro);
  const hasDate = Boolean(stored.day && stored.month);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Birthday</CardTitle>
        <CardDescription>Optional. Your groups see it only if you share it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <DateFields value={value} onChange={setDraft} />
          <p className="text-muted-foreground text-sm">
            {age !== null
              ? `With the year, anyone who sees your birthday also sees your age (${age}). Remove the year and the age goes with it.`
              : "No year, so no one sees your age. Add a year and anyone who sees your birthday also sees your age."}
          </p>
          <LeapNote b={value} />
        </div>

        <div className="border-t pt-5">
          {anyPro ? (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-1">
                  <Label htmlFor="bday-share">Share my birthday with my groups</Label>
                  <p className="text-muted-foreground text-sm">
                    Members see it on the group calendar and on team calendar feeds, where it never
                    shows your age. It never goes into anyone&apos;s Google or Microsoft calendar.
                  </p>
                </div>
                <Switch
                  id="bday-share"
                  checked={sharing}
                  disabled={!hasDate}
                  onCheckedChange={setSharing}
                />
              </div>
              <ProNote groups={groups} sharing={sharing && hasDate} />
            </div>
          ) : (
            <NoProNotice />
          )}
        </div>

        <div className="flex items-center justify-between">
          <SaveRow
            dirty={dirty}
            onSave={() => {
              setStored(value);
              setDraft(null);
            }}
            onCancel={() => setDraft(null)}
          />
          {hasDate && !draft ? (
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() => {
                setStored({ day: null, month: null, year: "" });
                setSharing(false);
              }}
            >
              Remove birthday
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function Chip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-semibold",
        muted
          ? "text-muted-foreground bg-transparent line-through decoration-1"
          : "bg-[color-mix(in_oklch,oklch(0.62_0.15_40)_14%,transparent)] text-[color-mix(in_oklch,oklch(0.62_0.15_40)_70%,var(--foreground))]"
      )}
    >
      <Cake className="size-3.5" />
      {children}
    </span>
  );
}

/* B: the form on the left, what each audience sees on the right, live. */
function VariantB({ stored, setStored, sharing, setSharing, groups, firstName }: VariantProps) {
  const [draft, setDraft] = useState<Birthday | null>(null);
  const value = draft ?? stored;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(stored);
  const age = ageOf(value);
  const anyPro = groups.some((g) => g.pro);
  const hasDate = Boolean(value.day && value.month);
  const proNames = groups.filter((g) => g.pro).map((g) => g.name);
  const shown = sharing && anyPro && hasDate;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Birthday</CardTitle>
        <CardDescription>Optional. The panel shows who sees what.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="space-y-5">
            <div className="space-y-2">
              <DateFields value={value} onChange={setDraft} compact />
              <p className="text-muted-foreground text-sm">
                The year shows your age to everyone who sees the birthday. Leave it empty to keep
                your age private.
              </p>
              <LeapNote b={value} />
            </div>
            {anyPro ? (
              <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <Label htmlFor="bday-share-b" className="leading-snug">
                  Share my birthday with my groups
                </Label>
                <Switch
                  id="bday-share-b"
                  checked={sharing}
                  disabled={!hasDate}
                  onCheckedChange={setSharing}
                />
              </div>
            ) : (
              <NoProNotice />
            )}
            <SaveRow
              dirty={dirty}
              onSave={() => {
                setStored(value);
                setDraft(null);
              }}
              onCancel={() => setDraft(null)}
            />
          </div>

          <aside className="bg-muted/60 space-y-4 rounded-xl p-4">
            <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              What others see
            </p>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Your calendar</p>
              {hasDate ? (
                <Chip>{age !== null ? `You turn ${age + 1}` : "Your birthday"}</Chip>
              ) : (
                <p className="text-muted-foreground text-sm">Nothing yet</p>
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">
                Group calendar{proNames.length > 0 ? `: ${joinNames(proNames)}` : ""}
              </p>
              {shown ? (
                <Chip>
                  {age !== null ? `${firstName} turns ${age + 1}` : `${firstName}'s birthday`}
                </Chip>
              ) : (
                <Chip muted>{`${firstName}'s birthday`}</Chip>
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Team calendar feeds</p>
              {shown ? (
                <Chip>{`${firstName}'s birthday`}</Chip>
              ) : (
                <Chip muted>{`${firstName}'s birthday`}</Chip>
              )}
              <p className="text-muted-foreground text-xs">Never with your age.</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Colleagues&apos; Google or Microsoft calendars</p>
              <p className="text-muted-foreground text-sm">Never</p>
            </div>
          </aside>
        </div>
      </CardContent>
    </Card>
  );
}

function Mark({ on }: { on: boolean }) {
  return on ? (
    <Check className="text-primary mx-auto size-4" aria-label="Yes" />
  ) : (
    <Minus className="text-muted-foreground/60 mx-auto size-4" aria-label="No" />
  );
}

/* C: a summary row you edit in place, and a who-sees-what table under the share switch. */
function VariantC({ stored, setStored, sharing, setSharing, groups }: VariantProps) {
  const [editing, setEditing] = useState<Birthday | null>(null);
  const [confirmYear, setConfirmYear] = useState(false);
  const anyPro = groups.some((g) => g.pro);
  const hasDate = Boolean(stored.day && stored.month);
  const hasYear = validYear(stored.year);
  const age = ageOf(stored);
  const shown = sharing && anyPro && hasDate;
  const proNames = groups.filter((g) => g.pro).map((g) => g.name);

  const rows: { who: string; date: boolean; age: boolean }[] = [
    { who: "You", date: hasDate, age: hasDate && hasYear },
    {
      who: `Members of ${proNames.length > 0 ? joinNames(proNames) : "your groups"}`,
      date: shown,
      age: shown && hasYear,
    },
    { who: "Team calendar feeds", date: shown, age: false },
    { who: "Anyone's Google or Microsoft calendar", date: false, age: false },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Birthday</CardTitle>
        {!editing && hasDate ? (
          <CardAction>
            <Button variant="ghost" size="sm" onClick={() => setEditing(stored)}>
              <Pencil className="size-3.5" /> Edit
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        {editing ? (
          <div className="space-y-3">
            <DateFields value={editing} onChange={setEditing} />
            <LeapNote b={editing} />
            {confirmYear ? (
              <div className="bg-muted flex flex-wrap items-center gap-3 rounded-lg p-3 text-sm">
                <span className="flex-1">Remove the year? Your age stops showing everywhere.</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setStored({ ...editing, year: "" });
                    setEditing(null);
                    setConfirmYear(false);
                  }}
                >
                  Remove year
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmYear(false)}>
                  Keep it
                </Button>
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <Button
                disabled={!editing.day || !editing.month}
                onClick={() => {
                  if (hasYear && !validYear(editing.year)) {
                    setConfirmYear(true);
                    return;
                  }
                  setStored(editing);
                  setEditing(null);
                }}
              >
                Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              {hasDate ? (
                <Button
                  variant="ghost"
                  className="text-destructive ml-auto"
                  onClick={() => {
                    setStored({ day: null, month: null, year: "" });
                    setSharing(false);
                    setEditing(null);
                  }}
                >
                  Remove birthday
                </Button>
              ) : null}
            </div>
          </div>
        ) : hasDate ? (
          <div className="flex items-baseline gap-3">
            <Cake className="text-muted-foreground size-4 self-center" />
            <span className="text-lg font-semibold">{dateLabel(stored)}</span>
            {age !== null ? <span className="text-muted-foreground text-sm">age {age}</span> : null}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed p-4">
            <p className="text-muted-foreground text-sm">
              No birthday set. Add one to see it on your calendar, and share it if you like.
            </p>
            <Button
              variant="outline"
              onClick={() => setEditing({ day: null, month: null, year: "" })}
            >
              Add birthday
            </Button>
          </div>
        )}

        <div className="space-y-3 border-t pt-5">
          {anyPro ? (
            <div className="flex items-center justify-between gap-6">
              <Label htmlFor="bday-share-c">Share my birthday with my groups</Label>
              <Switch
                id="bday-share-c"
                checked={sharing}
                disabled={!hasDate}
                onCheckedChange={setSharing}
              />
            </div>
          ) : (
            <NoProNotice />
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs">
                <th className="py-1.5 text-left font-medium">Who</th>
                <th className="w-16 py-1.5 font-medium">Date</th>
                <th className="w-16 py-1.5 font-medium">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.who}>
                  <td className="py-2">{r.who}</td>
                  <td>
                    <Mark on={r.date} />
                  </td>
                  <td>
                    <Mark on={r.age} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ProNote groups={groups} sharing={shown} />
          {!hasYear && hasDate ? (
            <p className="text-muted-foreground text-sm">Add a year in Edit to show your age.</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

const VARIANTS = [
  { key: "A", name: "One form" },
  { key: "B", name: "Live preview" },
  { key: "C", name: "Summary + who sees what" },
];

function ToggleParam({ param, values }: { param: string; values: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get(param) ?? values[0];
  const next = values[(values.indexOf(current) + 1) % values.length];
  return (
    <button
      type="button"
      onClick={() => {
        const search = new URLSearchParams(params.toString());
        search.set(param, next);
        router.replace(`${pathname}?${search.toString()}`, { scroll: false });
      }}
      className="rounded-full bg-white/10 px-2.5 py-1 hover:bg-white/20"
    >
      {param}: {current}
    </button>
  );
}

export function BirthdayCardPrototype() {
  const params = useSearchParams();
  const { data: session } = useSession();
  const variant = params.get("variant") ?? "A";
  const pro = params.get("pro");
  const startEmpty = params.get("bday") === "empty";
  const groups = useMemo(() => fixtureGroups(pro), [pro]);
  const firstName = session?.user?.name?.split(" ")[0] ?? "Alex";

  const [stored, setStored] = useState<Birthday>(
    startEmpty ? { day: null, month: null, year: "" } : { day: 14, month: 3, year: "1988" }
  );
  const [sharing, setSharing] = useState(false);
  const props = { stored, setStored, sharing, setSharing, groups, firstName };

  return (
    <>
      {variant === "A" && <VariantA key={`a${startEmpty}`} {...props} />}
      {variant === "B" && <VariantB key={`b${startEmpty}`} {...props} />}
      {variant === "C" && <VariantC key={`c${startEmpty}`} {...props} />}
      <PrototypeSwitcher
        variants={VARIANTS}
        extra={
          <>
            <ToggleParam param="pro" values={["some", "all", "none"]} />
            <ToggleParam param="bday" values={["set", "empty"]} />
          </>
        }
      />
      <StateReadout stored={stored} sharing={sharing} groups={groups} />
    </>
  );
}

function StateReadout({
  stored,
  sharing,
  groups,
}: {
  stored: Birthday;
  sharing: boolean;
  groups: Group[];
}) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <p className="rounded-md border border-dashed border-yellow-500/60 px-3 py-2 font-mono text-[11px] text-yellow-700 dark:text-yellow-300">
      prototype state: {dateLabel(stored) ?? "no birthday"}, age {ageOf(stored) ?? "hidden"},
      sharing {String(sharing)}, Pro groups:{" "}
      {groups
        .filter((g) => g.pro)
        .map((g) => g.name)
        .join(", ") || "none"}
    </p>
  );
}
