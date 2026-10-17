"use client";

// PROTOTYPE (T-340): three looks for group events and birthdays on the dashboard calendar,
// switchable with ?variant=A|B|C, plus ?view=lanes|stripes, ?as=admin|member, ?plan=pro|free
// and ?dense=1. Events live in memory; nothing reaches the backend. Throwaway, never merged.

import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, CalendarPlus, Cake, ChevronDown, Plus, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrototypeSwitcher } from "@/components/dev/prototype-switcher";
import type { PinnedBar } from "@/components/dashboard/leave-calendar";
import type { IsoDate } from "@/lib/api/types";
import { gridRange } from "@/lib/calendar/month-grid";
import { cn } from "@/lib/utils";
import {
  YOU,
  birthdaysIn,
  createEvent,
  deleteEvent,
  expand,
  fixtures,
  oneOffChanges,
  parse,
  plusDays,
  ruleSummary,
  shortDate,
  updateEvent,
  weekdayOf,
  WEEKDAYS_LONG,
  type BirthdayOnDay,
  type EditScope,
  type GroupEvent,
  type Occurrence,
  type RepeatRule,
} from "./model";
import {
  BIRTHDAY_TINT,
  BirthdayRow,
  DayContextMenu,
  EVENT_INK,
  EventCard,
  EventFields,
  EventLine,
  ScopeDialog,
  blankDraft,
  birthdayText,
  draftFrom,
  draftProblem,
  type DayMenuApi,
  type FormDraft,
  type Role,
} from "./parts";

export const VARIANTS = [
  { key: "A", name: "In the lanes" },
  { key: "B", name: "Day chips + side sheet" },
  { key: "C", name: "Agenda rail" },
] as const;

type Variant = (typeof VARIANTS)[number]["key"];
type Point = { x: number; y: number };

type Editor =
  | { kind: "create"; draft: FormDraft; surface: "dialog" | "sheet" | "quick"; point?: Point }
  | {
      kind: "edit";
      occ: Occurrence;
      scope: EditScope | null;
      draft: FormDraft;
      surface: "dialog" | "sheet";
    };

type Prompt =
  | { action: "delete"; occ: Occurrence }
  | { action: "edit-first"; occ: Occurrence }
  | { action: "edit-save"; occ: Occurrence; draft: FormDraft; ruleChanged: boolean };

const sortOcc = (a: Occurrence, b: Occurrence) =>
  a.from.localeCompare(b.from) ||
  Number(!a.event.allDay) - Number(!b.event.allDay) ||
  (a.event.startTime ?? "").localeCompare(b.event.startTime ?? "");

export function useGroupEventsPrototype({
  year,
  month,
  scope,
  activeGroupName,
  groupNames,
  today,
  onRequestTimeOff,
}: {
  year: number;
  month: number;
  scope: "MINE" | "GROUP";
  activeGroupName: string | null;
  groupNames: string[];
  today: IsoDate;
  onRequestTimeOff: (date: IsoDate) => void;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const variant = (params.get("variant") ?? "A") as Variant;
  const role: Role = params.get("as") === "member" ? "member" : "admin";
  const pro = params.get("plan") !== "free";
  const dense = params.get("dense") === "1";
  const view = params.get("view");

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const home = activeGroupName ?? groupNames[0] ?? "Design";
  const other = groupNames.find((g) => g !== home) ?? "Dev Support";
  const seed = `${home}|${other}|${dense}`;
  const [store, setStore] = useState<{
    seed: string;
    events: GroupEvent[];
    birthdays: ReturnType<typeof fixtures>["birthdays"];
  } | null>(null);
  if (store === null || store.seed !== seed) {
    setStore({ seed, ...fixtures(today, home, other, dense) });
  }
  const events = store?.events ?? [];
  const setEvents = (fn: (e: GroupEvent[]) => GroupEvent[]) =>
    setStore((s) => (s ? { ...s, events: fn(s.events) } : s));

  const myGroups = useMemo(() => Array.from(new Set([home, other])), [home, other]);
  const inScope = (groupName: string) => scope === "MINE" || groupName === activeGroupName;
  const { from, to } = gridRange(year, month);
  const occurrences = useMemo(
    () =>
      expand(
        events.filter((e) => inScope(e.groupName)),
        from,
        to
      ).sort(sortOcc),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, from, to, scope, activeGroupName]
  );
  const birthdays = useMemo(
    () =>
      birthdaysIn(
        (store?.birthdays ?? []).filter((b) => b.person.isYou || inScope(b.groupName)),
        from,
        to
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, from, to, scope, activeGroupName]
  );
  const occurrencesOn = (date: IsoDate) =>
    occurrences.filter((o) => o.from <= date && o.to >= date);
  const birthdaysOn = (date: IsoDate) => birthdays.filter((b) => b.date === date);
  const showGroup = scope === "MINE";

  const [editor, setEditor] = useState<Editor | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [detail, setDetail] = useState<{ occ: Occurrence; point: Point } | null>(null);
  const [highlight, setHighlight] = useState<Set<IsoDate>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  const defaultDate =
    today.slice(0, 7) === `${year}-${String(month).padStart(2, "0")}`
      ? today
      : `${year}-${String(month).padStart(2, "0")}-01`;
  const createGroup = scope === "GROUP" && activeGroupName ? activeGroupName : home;
  const fullSurface = variant === "B" ? "sheet" : "dialog";

  function startCreate(date: IsoDate, point?: Point, endDate: IsoDate | null = null) {
    setDetail(null);
    setEditor({
      kind: "create",
      draft: blankDraft(date, endDate, createGroup),
      surface: variant === "C" ? "quick" : fullSurface,
      point,
    });
  }

  function openEditor(occ: Occurrence, scope: EditScope | null) {
    const e = occ.event;
    let draft = draftFrom(e, occ.from);
    if (scope === "this") draft = { ...draft, start: occ.from, end: occ.from };
    if (scope === "following") draft = { ...draft, start: occ.from, end: occ.from };
    if (scope === null && e.repeat) draft = { ...draft, start: occ.from, end: occ.from };
    setEditor({ kind: "edit", occ, scope, draft, surface: fullSurface });
  }

  function startEdit(occ: Occurrence) {
    setDetail(null);
    if (!occ.event.repeat) return openEditor(occ, "all");
    // B asks which dates on save, the way Google Calendar does; A and C ask first, so the form
    // can lock the repeat rule for a single-date change.
    if (variant === "B") return openEditor(occ, null);
    setPrompt({ action: "edit-first", occ });
  }

  function startDelete(occ: Occurrence) {
    setDetail(null);
    setPrompt({ action: "delete", occ });
  }

  function patchOf(d: FormDraft) {
    const { groupName: _g, ...patch } = d;
    void _g;
    return { ...patch, note: patch.note || undefined };
  }

  function save() {
    if (!editor || draftProblem(editor.draft)) return;
    if (editor.kind === "create") {
      setEvents((ev) => createEvent(ev, patchOf(editor.draft), editor.draft.groupName, YOU));
      setEditor(null);
      return;
    }
    const { occ, draft } = editor;
    if (editor.scope === null) {
      const ruleChanged = JSON.stringify(draft.repeat) !== JSON.stringify(occ.event.repeat);
      setPrompt({ action: "edit-save", occ, draft, ruleChanged });
      return;
    }
    applyEdit(occ, editor.scope, draft);
    setEditor(null);
  }

  function applyEdit(occ: Occurrence, scope: EditScope, draft: FormDraft) {
    const e = occ.event;
    let patch = patchOf(draft);
    if (variant === "B" && scope === "all" && e.repeat) {
      const shift = Math.round(
        (parse(draft.start).getTime() - parse(occ.from).getTime()) / 86400000
      );
      patch = { ...patch, start: plusDays(e.start, shift), end: plusDays(e.start, shift) };
    }
    if (scope === "this") patch = { ...patch, repeat: e.repeat, end: patch.start };
    setEvents((ev) => updateEvent(ev, e.id, occ.from, scope, patch));
  }

  const menuApi: DayMenuApi = {
    occurrencesOn,
    birthdaysOn,
    role,
    canCreate: pro,
    onRequestTimeOff,
    onNewEvent: (date, point) => startCreate(date, point),
    onOpenEvent: (occ, point) => setDetail({ occ, point }),
    onEdit: startEdit,
    onDelete: startDelete,
  };

  const card = (occ: Occurrence) => (
    <EventCard
      occ={occ}
      role={role}
      showGroup={showGroup}
      onEdit={() => startEdit(occ)}
      onDelete={() => startDelete(occ)}
    />
  );

  // ---------- A: events and birthdays take lanes ----------

  const pinned: PinnedBar[] =
    variant === "A"
      ? [
          ...occurrences.map((occ): PinnedBar => ({
            id: occ.key,
            from: occ.from,
            to: occ.to,
            render: ({ contL, contR }) => (
              <LaneEventBar occ={occ} contL={contL} contR={contR}>
                {card(occ)}
              </LaneEventBar>
            ),
            renderRow: () => (
              <div className="rounded-xl px-1.5 py-1.5 text-[13px] font-semibold">
                <EventLine occ={occ} />
              </div>
            ),
          })),
          ...birthdays.map((b): PinnedBar => ({
            id: b.key,
            from: b.date,
            to: b.date,
            render: () => <LaneBirthdayBar b={b} showGroup={showGroup} />,
            renderRow: () => (
              <div className="px-1.5 py-1.5">
                <BirthdayRow b={b} />
              </div>
            ),
          })),
        ]
      : [];

  // ---------- B: a chip in the day header; C: a count badge + rail highlight ----------

  const lanesDayAddon =
    variant === "B"
      ? (date: IsoDate) => (
          <HeaderChip
            date={date}
            occs={occurrencesOn(date)}
            bdays={birthdaysOn(date)}
            renderCard={card}
            showGroup={showGroup}
          />
        )
      : variant === "C"
        ? (date: IsoDate) => (
            <CornerBadge
              occs={occurrencesOn(date)}
              bdays={birthdaysOn(date)}
              highlighted={highlight.has(date)}
            />
          )
        : undefined;

  const stripesDayAddon = (date: IsoDate) => {
    const occs = occurrencesOn(date);
    const bdays = birthdaysOn(date);
    if (variant === "A") return <StripeLabel occs={occs} bdays={bdays} />;
    if (variant === "B") return <StripeDots occs={occs} bdays={bdays} />;
    return <CornerBadge occs={occs} bdays={bdays} highlighted={highlight.has(date)} small />;
  };

  const dayListExtra = (date: IsoDate) => {
    const occs = occurrencesOn(date);
    const bdays = birthdaysOn(date);
    return (
      <div className="mb-3 space-y-3">
        {occs.map((occ) => (
          <div
            key={occ.key}
            className="rounded-xl border p-3"
            style={{ borderColor: "var(--border)" }}
          >
            {card(occ)}
          </div>
        ))}
        {bdays.map((b) => (
          <BirthdayRow key={b.key} b={b} showGroup={showGroup} />
        ))}
        {pro ? (
          <Button variant="outline" size="sm" className="w-full" onClick={() => startCreate(date)}>
            <CalendarClock className="size-4" /> New group event on {shortDate(date)}
          </Button>
        ) : null}
      </div>
    );
  };

  // ---------- entry points ----------

  const headerAction =
    variant === "A" && pro ? (
      <Button variant="outline" size="sm" onClick={() => startCreate(defaultDate)}>
        <CalendarClock className="size-4" /> New event
      </Button>
    ) : null;

  const pageAction =
    variant === "B" ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Plus className="size-4" /> New <ChevronDown className="size-4 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => onRequestTimeOff(defaultDate)}>
            <CalendarPlus /> Time off request
          </DropdownMenuItem>
          {pro ? (
            <DropdownMenuItem onSelect={() => startCreate(defaultDate)}>
              <CalendarClock /> Group event
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null;

  const sidebar =
    variant === "C" ? (
      <AgendaRail
        month={month}
        occurrences={occurrences.filter(
          (o) =>
            o.to >= `${year}-${String(month).padStart(2, "0")}-01` &&
            o.from.slice(0, 7) <= `${year}-${String(month).padStart(2, "0")}`
        )}
        birthdays={birthdays.filter((b) => b.date.slice(5, 7) === String(month).padStart(2, "0"))}
        canCreate={pro}
        showGroup={showGroup}
        expanded={expanded}
        onExpand={setExpanded}
        onHover={setHighlight}
        onNew={(point) => startCreate(defaultDate, point)}
        renderCard={card}
      />
    ) : null;

  // ---------- overlays ----------

  const problem = editor ? draftProblem(editor.draft) : null;
  const editorTitle =
    editor?.kind === "edit"
      ? editor.scope === "this"
        ? `Change ${shortDate(editor.occ.from)} only`
        : editor.scope === "following"
          ? `Change from ${shortDate(editor.occ.from)} on`
          : "Edit group event"
      : "New group event";
  const fields = editor ? (
    <EventFields
      draft={editor.draft}
      onChange={(draft) => setEditor({ ...editor, draft } as Editor)}
      groups={editor.kind === "create" && scope === "MINE" ? myGroups : []}
      lockRepeat={editor.kind === "edit" && editor.scope === "this"}
      showPreview={variant === "B"}
    />
  ) : null;
  const saveLabel = editor?.kind === "create" ? "Create" : "Save";

  const overlays = (
    <>
      <Dialog open={editor?.surface === "dialog"} onOpenChange={(o) => !o && setEditor(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editorTitle}</DialogTitle>
          </DialogHeader>
          {fields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditor(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={Boolean(problem)} title={problem ?? undefined}>
              {saveLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={editor?.surface === "sheet"} onOpenChange={(o) => !o && setEditor(null)}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>{editorTitle}</SheetTitle>
            <SheetDescription>
              {editor?.draft.groupName}
              {editor?.kind === "edit" && editor.occ.event.repeat
                ? ` · ${ruleSummary(editor.occ.event.start, editor.occ.event.repeat)}`
                : ""}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4">{fields}</div>
          <SheetFooter className="flex-row justify-end border-t">
            <Button variant="outline" onClick={() => setEditor(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={Boolean(problem)} title={problem ?? undefined}>
              {saveLabel}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {editor?.surface === "quick" ? (
        <QuickCreate
          draft={editor.draft}
          point={editor.point}
          onChange={(draft) => setEditor({ ...editor, draft })}
          onClose={() => setEditor(null)}
          onMore={() => setEditor({ ...editor, surface: "dialog" })}
          onSave={save}
          problem={problem}
        />
      ) : null}

      <Popover open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <PopoverAnchor asChild>
          <span
            aria-hidden
            style={{
              position: "fixed",
              left: detail?.point.x ?? 0,
              top: detail?.point.y ?? 0,
              width: 1,
              height: 1,
            }}
          />
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-72 p-3"
          onFocusOutside={(e) => e.preventDefault()}
        >
          {detail ? card(detail.occ) : null}
        </PopoverContent>
      </Popover>

      <ScopeDialog
        key={prompt ? `${prompt.action}|${prompt.occ.key}` : "none"}
        open={prompt !== null}
        action={prompt?.action === "delete" ? "delete" : "edit"}
        occ={prompt?.occ ?? null}
        changes={prompt ? oneOffChanges(events, prompt.occ.event.id) : 0}
        ruleChanged={prompt?.action === "edit-save" ? prompt.ruleChanged : false}
        confirmLabel={prompt?.action === "edit-first" ? "Continue" : undefined}
        onCancel={() => setPrompt(null)}
        onConfirm={(s) => {
          if (!prompt) return;
          if (prompt.action === "delete")
            setEvents((ev) => deleteEvent(ev, prompt.occ.event.id, prompt.occ.from, s));
          if (prompt.action === "edit-first") openEditor(prompt.occ, s);
          if (prompt.action === "edit-save") {
            applyEdit(prompt.occ, s, prompt.draft);
            setEditor(null);
          }
          setPrompt(null);
        }}
      />

      <PrototypeSwitcher
        variants={VARIANTS}
        extra={
          <span className="ml-1 flex items-center gap-1 border-l border-white/25 pl-2 text-[12px]">
            {(
              [
                [
                  "view",
                  view === "stripes" ? "Stripes" : "Lanes",
                  () => setParam("view", view === "stripes" ? "lanes" : "stripes"),
                ],
                [
                  "as",
                  role === "admin" ? "Group admin" : "Member",
                  () => setParam("as", role === "admin" ? "member" : null),
                ],
                ["plan", pro ? "Pro" : "Free", () => setParam("plan", pro ? "free" : null)],
                ["dense", dense ? "Dense" : "Light", () => setParam("dense", dense ? null : "1")],
              ] as const
            ).map(([k, label, onClick]) => (
              <button
                key={k}
                type="button"
                onClick={onClick}
                className="rounded-full px-2 py-1 hover:bg-white/15"
              >
                {label}
              </button>
            ))}
          </span>
        }
      />
    </>
  );

  return {
    variant,
    viewOverride: view === "stripes" ? true : view === "lanes" ? false : null,
    headerAction,
    pageAction,
    sidebar,
    overlays,
    wrapCalendar: (node: ReactNode) => <DayContextMenu api={menuApi}>{node}</DayContextMenu>,
    lanesProps: { pinned, dayAddon: lanesDayAddon },
    stripesProps: { dayAddon: stripesDayAddon, dayListExtra },
    onRangeForEvent: pro
      ? (range: { from: IsoDate; to: IsoDate }) => startCreate(range.from, undefined, range.to)
      : null,
  };
}

// ---------- A ----------

function LaneEventBar({
  occ,
  contL,
  contR,
  children,
}: {
  occ: Occurrence;
  contL: boolean;
  contR: boolean;
  children: ReactNode;
}) {
  const r = (a: boolean) => (a ? 0 : 7);
  return (
    <Popover>
      <PopoverTrigger
        className="flex h-6 w-full min-w-0 items-center px-2 text-left text-[12px] font-semibold"
        style={{
          background: `color-mix(in oklch, ${EVENT_INK} 88%, var(--surface))`,
          color: "var(--surface)",
          borderRadius: `${r(contL)}px ${r(contR)}px ${r(contR)}px ${r(contL)}px`,
          marginLeft: contL ? -1 : 0,
          marginRight: contR ? -1 : 0,
        }}
        title={`${occ.event.title} · ${occ.event.allDay ? "All day" : `${occ.event.startTime} – ${occ.event.endTime}`}`}
      >
        {contL ? <span /> : <EventLine occ={occ} />}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        {children}
      </PopoverContent>
    </Popover>
  );
}

function LaneBirthdayBar({ b, showGroup }: { b: BirthdayOnDay; showGroup: boolean }) {
  const first = b.birthday.person.isYou ? "You" : b.birthday.person.name.split(" ")[0];
  return (
    <Popover>
      <PopoverTrigger
        className="flex h-6 w-full min-w-0 items-center gap-1.5 rounded-[7px] px-2 text-left text-[12px] font-semibold"
        style={{
          background: `color-mix(in oklch, ${BIRTHDAY_TINT} 16%, var(--surface))`,
          color: `color-mix(in oklch, ${BIRTHDAY_TINT} 60%, var(--text))`,
          border: `1px solid color-mix(in oklch, ${BIRTHDAY_TINT} 35%, transparent)`,
        }}
        title={birthdayText(b)}
      >
        <Cake className="size-3.5 shrink-0" />
        <span className="truncate">
          {first}
          {b.age ? ` · ${b.age}` : ""}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <BirthdayRow b={b} showGroup={showGroup} />
      </PopoverContent>
    </Popover>
  );
}

function StripeLabel({ occs, bdays }: { occs: Occurrence[]; bdays: BirthdayOnDay[] }) {
  if (occs.length === 0 && bdays.length === 0) return null;
  const first = occs[0];
  return (
    <>
      {bdays.length > 0 ? (
        <Cake
          className="absolute top-2 right-2 size-3.5"
          style={{ color: `color-mix(in oklch, ${BIRTHDAY_TINT} 75%, var(--text))` }}
        />
      ) : null}
      {first ? (
        <span
          className="absolute inset-x-1 bottom-[18px] hidden truncate rounded-[5px] px-1.5 py-[1px] text-[10.5px] font-semibold sm:block"
          style={{ background: EVENT_INK, color: "var(--surface)" }}
        >
          {first.event.allDay ? "" : `${first.event.startTime} `}
          {first.event.title}
          {occs.length > 1 ? ` +${occs.length - 1}` : ""}
        </span>
      ) : null}
    </>
  );
}

// ---------- B ----------

function HeaderChip({
  date,
  occs,
  bdays,
  renderCard,
  showGroup,
}: {
  date: IsoDate;
  occs: Occurrence[];
  bdays: BirthdayOnDay[];
  renderCard: (occ: Occurrence) => ReactNode;
  showGroup: boolean;
}) {
  if (occs.length === 0 && bdays.length === 0) return null;
  const first = occs.find((o) => o.from === date) ?? occs[0];
  const ribbon = occs.find((o) => o.from !== o.to);
  const stop = (e: SyntheticEvent) => e.stopPropagation();
  return (
    <>
      {ribbon ? (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: EVENT_INK, opacity: 0.85 }}
        />
      ) : null}
      <Popover>
        <PopoverTrigger
          onPointerDown={stop}
          onClick={stop}
          onKeyDown={stop}
          className="absolute top-[9px] right-1.5 flex h-[22px] max-w-[calc(100%-38px)] min-w-0 items-center gap-1 rounded-full border px-1.5 text-[11px] font-semibold transition-colors hover:bg-[var(--surface-2)]"
          style={{ borderColor: "var(--border-strong)", background: "var(--surface)" }}
          aria-label={`${occs.length} events, ${bdays.length} birthdays on ${shortDate(date)}`}
        >
          {bdays.length > 0 ? (
            <Cake
              className="size-3.5 shrink-0"
              style={{ color: `color-mix(in oklch, ${BIRTHDAY_TINT} 75%, var(--text))` }}
            />
          ) : null}
          {first ? (
            <>
              <span className="size-1.5 shrink-0 rounded-full" style={{ background: EVENT_INK }} />
              <span className="min-w-0 truncate">
                {first.event.title}
              </span>
            </>
          ) : null}
          {occs.length > 1 ? (
            <span className="shrink-0" style={{ color: "var(--text-muted)" }}>
              +{occs.length - 1}
            </span>
          ) : null}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 gap-0 p-0" onPointerDown={stop} onClick={stop}>
          <p
            className="border-b px-3 py-2 text-[12px] font-semibold"
            style={{ color: "var(--text-faint)", borderColor: "var(--border)" }}
          >
            {shortDate(date)}
          </p>
          <div className="max-h-[60dvh] space-y-3 overflow-y-auto p-3">
            {occs.map((occ) => (
              <div key={occ.key}>{renderCard(occ)}</div>
            ))}
            {bdays.map((b) => (
              <BirthdayRow key={b.key} b={b} showGroup={showGroup} />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}

function StripeDots({ occs, bdays }: { occs: Occurrence[]; bdays: BirthdayOnDay[] }) {
  if (occs.length === 0 && bdays.length === 0) return null;
  return (
    <span className="absolute top-2.5 right-1.5 flex items-center gap-[3px] sm:right-2">
      {bdays.length > 0 ? (
        <Cake
          className="size-3"
          style={{ color: `color-mix(in oklch, ${BIRTHDAY_TINT} 75%, var(--text))` }}
        />
      ) : null}
      {occs.slice(0, 3).map((o) => (
        <span key={o.key} className="size-[6px] rounded-full" style={{ background: EVENT_INK }} />
      ))}
    </span>
  );
}

// ---------- C ----------

function CornerBadge({
  occs,
  bdays,
  highlighted,
  small,
}: {
  occs: Occurrence[];
  bdays: BirthdayOnDay[];
  highlighted: boolean;
  small?: boolean;
}) {
  return (
    <>
      {highlighted ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[2px] z-10 rounded-[10px]"
          style={{ boxShadow: `inset 0 0 0 2px ${EVENT_INK}` }}
        />
      ) : null}
      {occs.length > 0 || bdays.length > 0 ? (
        <span
          className={cn(
            "pointer-events-none absolute flex items-center gap-1",
            small ? "top-2.5 right-1.5" : "top-[11px] right-2.5"
          )}
        >
          {bdays.length > 0 ? (
            <Cake
              className="size-3.5"
              style={{ color: `color-mix(in oklch, ${BIRTHDAY_TINT} 75%, var(--text))` }}
            />
          ) : null}
          {occs.length > 0 ? (
            <span
              className="tnum grid h-[17px] min-w-[17px] place-items-center rounded-full px-1 text-[10.5px] font-bold"
              style={{ background: EVENT_INK, color: "var(--surface)" }}
            >
              {occs.length}
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );
}

function AgendaRail({
  month,
  occurrences,
  birthdays,
  canCreate,
  showGroup,
  expanded,
  onExpand,
  onHover,
  onNew,
  renderCard,
}: {
  month: number;
  occurrences: Occurrence[];
  birthdays: BirthdayOnDay[];
  canCreate: boolean;
  showGroup: boolean;
  expanded: string | null;
  onExpand: (key: string | null) => void;
  onHover: (dates: Set<IsoDate>) => void;
  onNew: (point: Point) => void;
  renderCard: (occ: Occurrence) => ReactNode;
}) {
  const monthName = new Date(Date.UTC(2000, month - 1, 1)).toLocaleString("en", {
    month: "long",
    timeZone: "UTC",
  });
  type Item = { date: IsoDate; occ?: Occurrence; b?: BirthdayOnDay; key: string };
  const items: Item[] = [
    ...occurrences.map((occ) => ({ date: occ.from, occ, key: occ.key })),
    ...birthdays.map((b) => ({ date: b.date, b, key: b.key })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  const byDay = new Map<IsoDate, Item[]>();
  for (const it of items) byDay.set(it.date, [...(byDay.get(it.date) ?? []), it]);
  const spanDates = (occ: Occurrence) => {
    const s = new Set<IsoDate>();
    for (let d = occ.from; d <= occ.to; d = plusDays(d, 1)) s.add(d);
    return s;
  };

  return (
    <section
      className="rounded-[var(--radius)] border"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      onMouseLeave={() => onHover(new Set())}
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
        <h3 className="font-display text-[16px] font-semibold">Events in {monthName}</h3>
        {canCreate ? (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              onNew({ x: r.left, y: r.bottom + 4 });
            }}
          >
            <Plus className="size-3.5" /> New
          </Button>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="px-4 pb-4 text-[13.5px]" style={{ color: "var(--text-muted)" }}>
          Nothing planned. {canCreate ? "Right-click a day or use New." : ""}
        </p>
      ) : (
        <ol className="max-h-[520px] overflow-y-auto px-2 pb-2">
          {[...byDay.entries()].map(([date, list]) => (
            <li
              key={date}
              className="grid grid-cols-[44px_1fr] gap-1 border-t py-2 first:border-t-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="pt-1 text-center">
                <div className="tnum text-[18px] leading-none font-semibold">
                  {parse(date).getUTCDate()}
                </div>
                <div
                  className="mt-0.5 text-[10.5px] font-semibold uppercase"
                  style={{ color: "var(--text-faint)" }}
                >
                  {WEEKDAYS_LONG[weekdayOf(date)].slice(0, 3)}
                </div>
              </div>
              <ul className="min-w-0 space-y-0.5">
                {list.map((it) =>
                  it.b ? (
                    <li
                      key={it.key}
                      className="rounded-xl px-2 py-1.5"
                      onMouseEnter={() => onHover(new Set([it.date]))}
                    >
                      <BirthdayRow b={it.b} showGroup={showGroup} />
                    </li>
                  ) : it.occ ? (
                    <li key={it.key} onMouseEnter={() => onHover(spanDates(it.occ!))}>
                      {expanded === it.key ? (
                        <div
                          className="rounded-xl border p-3"
                          style={{ borderColor: "var(--border-strong)" }}
                        >
                          <button
                            type="button"
                            className="mb-2 text-[11.5px] font-semibold"
                            style={{ color: "var(--text-faint)" }}
                            onClick={() => onExpand(null)}
                          >
                            Collapse
                          </button>
                          {renderCard(it.occ)}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onExpand(it.key)}
                          className="flex w-full items-start gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-[var(--surface-2)]"
                        >
                          <span
                            className="mt-[3px] h-[18px] w-[3px] shrink-0 rounded-full"
                            style={{ background: EVENT_INK }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-semibold">
                              {it.occ.event.title}
                            </span>
                            <span
                              className="flex items-center gap-1 truncate text-[12px]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {it.occ.event.allDay
                                ? it.occ.from === it.occ.to
                                  ? "All day"
                                  : `Until ${shortDate(it.occ.to)}`
                                : `${it.occ.event.startTime} – ${it.occ.event.endTime}`}
                              {it.occ.event.repeat ? <Repeat className="size-3" /> : null}
                              {showGroup ? ` · ${it.occ.event.groupName}` : ""}
                            </span>
                          </span>
                        </button>
                      )}
                    </li>
                  ) : null
                )}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

const PRESETS = (start: IsoDate): [string, string, RepeatRule | null][] => {
  const wd = weekdayOf(start);
  const base = { interval: 1, weekdays: [wd], monthlyMode: "day" as const, until: null };
  return [
    ["none", "Does not repeat", null],
    ["daily", "Every day", { ...base, freq: "daily" }],
    ["weekly", `Weekly on ${WEEKDAYS_LONG[wd]}`, { ...base, freq: "weekly" }],
    ["weekdays", "Every weekday (Mon–Fri)", { ...base, freq: "weekly", weekdays: [0, 1, 2, 3, 4] }],
    [
      "monthly",
      ruleSummary(start, { ...base, freq: "monthly" }).replace("Every month", "Monthly"),
      { ...base, freq: "monthly" },
    ],
    [
      "yearly",
      ruleSummary(start, { ...base, freq: "yearly" }).replace("Every year", "Yearly"),
      { ...base, freq: "yearly" },
    ],
  ];
};

function QuickCreate({
  draft,
  point,
  onChange,
  onClose,
  onMore,
  onSave,
  problem,
}: {
  draft: FormDraft;
  point?: Point;
  onChange: (d: FormDraft) => void;
  onClose: () => void;
  onMore: () => void;
  onSave: () => void;
  problem: string | null;
}) {
  const presets = PRESETS(draft.start);
  const current =
    presets.find(([, , r]) => JSON.stringify(r) === JSON.stringify(draft.repeat))?.[0] ??
    (draft.repeat ? "custom" : "none");
  const x = point?.x ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 0);
  const y = point?.y ?? 160;
  return (
    <Popover open onOpenChange={(o) => !o && onClose()}>
      <PopoverAnchor asChild>
        <span aria-hidden style={{ position: "fixed", left: x, top: y, width: 1, height: 1 }} />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-80 gap-3 p-4"
        onFocusOutside={(e) => e.preventDefault()}
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <Input
            autoFocus
            placeholder="Add a title"
            aria-label="Title"
            value={draft.title}
            onChange={(e) => onChange({ ...draft, title: e.target.value })}
            className="h-10 border-0 border-b px-0 text-[16px] font-semibold shadow-none focus-visible:ring-0"
          />
          <div
            className="flex items-center gap-2 text-[13px]"
            style={{ color: "var(--text-muted)" }}
          >
            <CalendarClock className="size-4" />
            {shortDate(draft.start)}
            {draft.end !== draft.start ? ` – ${shortDate(draft.end)}` : ""}
            <span className="ml-auto flex items-center gap-2">
              <Label htmlFor="qc-allday" className="text-[12.5px] font-normal">
                All day
              </Label>
              <Switch
                id="qc-allday"
                checked={draft.allDay}
                onCheckedChange={(allDay) => onChange({ ...draft, allDay })}
              />
            </span>
          </div>
          {!draft.allDay ? (
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="time"
                aria-label="Starts"
                value={draft.startTime}
                onChange={(e) => onChange({ ...draft, startTime: e.target.value })}
              />
              <Input
                type="time"
                aria-label="Ends"
                value={draft.endTime}
                onChange={(e) => onChange({ ...draft, endTime: e.target.value })}
              />
            </div>
          ) : null}
          {draft.start === draft.end ? (
            <Select
              value={current}
              onValueChange={(v) => {
                if (v === "custom") return onMore();
                onChange({ ...draft, repeat: presets.find(([k]) => k === v)?.[2] ?? null });
              }}
            >
              <SelectTrigger className="w-full" aria-label="Repeat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presets.map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom…</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
              Only single-day events can repeat.
            </p>
          )}
          <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>
            {draft.groupName}
          </p>
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onMore}>
              More options
            </Button>
            <Button type="submit" size="sm" disabled={Boolean(problem)}>
              Create
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
