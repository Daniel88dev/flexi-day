"use client";

import { useState } from "react";
import { CalendarOff, ChevronLeft, ChevronRight, ClockAlert, Play } from "lucide-react";
import { AvatarBubble } from "@/components/brand/avatar-bubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TEAM_RANGE_MAX_DAYS,
  type AttendanceBalanceMode,
  type AttendanceTeam,
  type AttendanceTeamDay,
  type AttendanceTeamOpenSession,
  type AttendanceTeamPerson,
} from "@/lib/api/attendance";
import { ApiError } from "@/lib/api/client";
import { useGroups, useOrganization, useTeamAttendance } from "@/lib/api/queries";
import { formatMinutes } from "@/lib/attendance/duration";
import { exclusionLabel } from "@/lib/attendance/exclusion";
import {
  anyPresence,
  daysInRange,
  defaultDay,
  rangeOf,
  stepAnchor,
  teamOrganizations,
  weekRange,
  type DateRange,
  type TeamView,
} from "@/lib/attendance/team";
import { formatBusinessDay, formatBusinessWeekday, formatClockTime } from "@/lib/attendance/today";
import { useSession } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useViewerRoles } from "@/lib/viewer/use-viewer-roles";
import { cn } from "@/lib/utils";
import { BalanceChip, DayFlags, excludedSurface, isExcluded } from "./attendance-figures";
import { CorrectionDialog } from "./correction-dialog";

/** Who and which day a correction was asked for. */
type Correcting = { userId: string; name: string; businessDate: string };

const ALL_GROUPS = "__all__";

/** The reader's own short form of a business date: `Mon` over `7 Sep`. */
function dayHeading(businessDate: string, locale: string): { weekday: string; day: string } {
  const date = new Date(`${businessDate}T12:00:00Z`);
  return {
    weekday: new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(date),
    day: new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(date),
  };
}

/** The range under the stepper, in the reader's language and order. */
function rangeLabel(range: DateRange, locale: string): string {
  const at = (iso: string) => new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).formatRange(at(range.from), at(range.to));
}

const groupNames = (person: AttendanceTeamPerson, fallback: string): string =>
  person.groups.length === 0 ? fallback : person.groups.map((group) => group.groupName).join(", ");

/** How long somebody has been in, for the strip and the live cell. */
function LiveLabel({
  open,
  today,
  timezone,
  locale,
}: {
  open: AttendanceTeamOpenSession;
  today: string | null;
  timezone: string | null;
  locale: string;
}) {
  const { t } = useTranslation();
  if (open.onBreak) return <>{t.teamAttendance.onBreak}</>;
  const time = formatClockTime(open.startedAt, timezone);
  if (open.businessDate === today) return <>{t.clock.since(time)}</>;
  return <>{t.teamAttendance.sinceDay(formatBusinessWeekday(open.businessDate, locale), time)}</>;
}

/**
 * One person on one day: the worked figure toned by that day's balance, what
 * it was measured against, and the flags — the mockup's cell, without the
 * sessions the month view has room for.
 */
function DayCell({
  day,
  open,
  mode,
  today,
  timezone,
  locale,
  align = "center",
}: {
  day: AttendanceTeamDay;
  open: AttendanceTeamOpenSession | undefined;
  mode: AttendanceBalanceMode;
  today: string | null;
  timezone: string | null;
  locale: string;
  align?: "center" | "end";
}) {
  const { t } = useTranslation();
  const excluded = isExcluded(day);
  const live = open !== undefined && day.open;
  const balance = day.balanceMinutes;
  const tone =
    live || mode !== "DAILY" || balance === null || excluded
      ? undefined
      : balance > 0
        ? "var(--ok)"
        : balance < 0
          ? "var(--danger)"
          : undefined;

  const items = align === "end" ? "items-end text-right" : "items-center text-center";

  if (day.upcoming && !excluded) {
    return <div className={cn("flex flex-col", items)} aria-hidden />;
  }

  // Somebody clocked in a minute ago on a Sunday is in, not off.
  if (excluded && day.presenceMinutes === 0 && !live) {
    return (
      <div className={cn("flex flex-col text-xs", items)} style={{ color: "var(--text-muted)" }}>
        {day.exclusion ? exclusionLabel(t, day.exclusion) : t.clock.dayOff}
      </div>
    );
  }

  if (day.presenceMinutes === 0 && !live) {
    return (
      <div className={cn("flex flex-col text-sm", items)} style={{ color: "var(--text-faint)" }}>
        {day.businessDate === today ? t.teamAttendance.notInYet : formatMinutes(0)}
        {day.businessDate === today ? null : (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t.clock.ofRequired(formatMinutes(day.requiredMinutes))}
          </span>
        )}
        <DayFlags day={day} today={today} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-0.5", items)}>
      <span className="text-sm font-semibold tabular-nums" style={tone ? { color: tone } : {}}>
        {formatMinutes(day.workedMinutes)}
      </span>
      {live ? (
        <span className="text-xs font-semibold" style={{ color: "var(--ok)" }}>
          <LiveLabel open={open} today={today} timezone={timezone} locale={locale} />
        </span>
      ) : (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {day.exclusion === null
            ? t.clock.ofRequired(formatMinutes(day.requiredMinutes))
            : excluded
              ? exclusionLabel(t, day.exclusion)
              : t.clock.halfDayOf(formatMinutes(day.requiredMinutes))}
        </span>
      )}
      {live ? null : (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {t.clock.present(formatMinutes(day.presenceMinutes))}
        </span>
      )}
      <DayFlags day={day} today={today} />
    </div>
  );
}

function Person({
  person,
  subtitle,
  live,
}: {
  person: AttendanceTeamPerson;
  subtitle: string;
  live: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative">
        <AvatarBubble
          initials={person.user.initials}
          background={person.user.avatarColor}
          name={person.user.name}
          size={30}
        />
        {live ? (
          <span
            className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2"
            style={
              { background: "var(--ok)", "--tw-ring-color": "var(--card)" } as React.CSSProperties
            }
            aria-hidden
          />
        ) : null}
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{person.user.name}</div>
        <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function InNowStrip({ team, locale }: { team: AttendanceTeam; locale: string }) {
  const { t } = useTranslation();
  const byEmployment = new Map(team.people.map((person) => [person.employmentId, person]));
  const live = team.inNow.flatMap((open) => {
    const person = byEmployment.get(open.employmentId);
    return person ? [{ open, person }] : [];
  });

  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="in-now">
      <span className="text-sm font-semibold">{t.teamAttendance.inNow}</span>
      {live.length === 0 ? (
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t.teamAttendance.nobodyIn}
        </span>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {live.map(({ open, person }) => (
            <li
              key={open.sessionId}
              className="flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              <AvatarBubble
                initials={person.user.initials}
                background={person.user.avatarColor}
                name={person.user.name}
                size={22}
              />
              <span className="font-medium">{person.user.name.split(" ")[0]}</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                <LiveLabel
                  open={open}
                  today={team.businessDate}
                  timezone={team.timezone}
                  locale={locale}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Legend() {
  const { t } = useTranslation();
  const item = "flex items-center gap-1.5 [&_svg]:size-[14px]";
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs" style={{ color: "var(--text-faint)" }}>
      <li className={item}>
        <ClockAlert style={{ color: "var(--warm)" }} />
        {t.teamAttendance.legendAutoClosed}
      </li>
      <li className={item}>
        <Play style={{ color: "var(--warm)" }} />
        {t.teamAttendance.legendOpen}
      </li>
      <li className={item}>
        <CalendarOff style={{ color: "var(--warm)" }} />
        {t.teamAttendance.legendExcluded}
      </li>
      <li className={item}>{t.teamAttendance.legendHatched}</li>
    </ul>
  );
}

/**
 * A day with something in it opens the correction dialog. An empty past day
 * has no session to correct, and an upcoming one has nothing to say yet, so
 * neither is a button — the mockup's affordance, on the cell that names the
 * day rather than on the row, which would not.
 */
const correctable = (
  day: AttendanceTeamDay,
  open: AttendanceTeamOpenSession | undefined
): boolean => !day.upcoming && (day.presenceMinutes > 0 || open !== undefined);

/** The affordance itself: the cell becomes the button, where there is something to correct. */
function Correctable({
  person,
  day,
  open,
  className,
  onCorrect,
  children,
}: {
  person: AttendanceTeamPerson;
  day: AttendanceTeamDay;
  open: AttendanceTeamOpenSession | undefined;
  className?: string;
  onCorrect: (correcting: Correcting) => void;
  children: React.ReactNode;
}) {
  const { t, locale } = useTranslation();
  if (!correctable(day, open)) return <>{children}</>;

  return (
    <button
      type="button"
      className={cn(
        "hover:bg-muted/60 cursor-pointer rounded-lg py-1 transition-colors",
        className
      )}
      aria-label={t.corrections.correctDay(
        person.user.name,
        formatBusinessDay(day.businessDate, locale)
      )}
      onClick={() =>
        onCorrect({
          userId: person.userId,
          name: person.user.name,
          businessDate: day.businessDate,
        })
      }
    >
      {children}
    </button>
  );
}

function Matrix({
  team,
  locale,
  onCorrect,
}: {
  team: AttendanceTeam;
  locale: string;
  onCorrect: (correcting: Correcting) => void;
}) {
  const { t } = useTranslation();
  const today = team.businessDate;
  const dates = team.people[0]?.days.map((day) => day.businessDate) ?? [];
  const openOf = new Map(team.inNow.map((open) => [open.employmentId, open]));

  return (
    <div
      className="hidden overflow-x-auto rounded-2xl border sm:block"
      style={{ borderColor: "var(--border)" }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-44">{t.teamAttendance.person}</TableHead>
            {dates.map((date) => {
              const heading = dayHeading(date, locale);
              return (
                <TableHead
                  key={date}
                  className="min-w-24 text-center"
                  style={
                    date === today
                      ? { background: "color-mix(in oklch, var(--primary) 6%, transparent)" }
                      : {}
                  }
                >
                  <span className="block capitalize">{heading.weekday}</span>
                  <span
                    className="block text-[11px] font-semibold"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {heading.day}
                  </span>
                </TableHead>
              );
            })}
            <TableHead className="text-right">{t.teamAttendance.period}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {team.people.map((person) => {
            const open = openOf.get(person.employmentId);
            return (
              <TableRow key={person.employmentId} data-testid={`team-row-${person.userId}`}>
                <TableCell>
                  <Person
                    person={person}
                    subtitle={groupNames(person, t.teamAttendance.noGroup)}
                    live={open !== undefined}
                  />
                </TableCell>
                {person.days.map((day) => (
                  <TableCell
                    key={day.businessDate}
                    data-testid={`team-day-${person.userId}-${day.businessDate}`}
                    className="align-top"
                    style={{
                      ...(isExcluded(day) ? excludedSurface : {}),
                      ...(day.businessDate === today
                        ? { background: "color-mix(in oklch, var(--primary) 5%, transparent)" }
                        : {}),
                    }}
                  >
                    <Correctable
                      person={person}
                      day={day}
                      open={open?.businessDate === day.businessDate ? open : undefined}
                      className="w-full"
                      onCorrect={onCorrect}
                    >
                      <DayCell
                        day={day}
                        open={open?.businessDate === day.businessDate ? open : undefined}
                        mode={team.balanceMode}
                        today={today}
                        timezone={team.timezone}
                        locale={locale}
                      />
                    </Correctable>
                  </TableCell>
                ))}
                <TableCell className="text-right align-top">
                  <BalanceChip minutes={person.totals.balanceMinutes} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/** A phone shows one day at a time: the same rows, one cell each. */
function DayList({
  team,
  day,
  onDay,
  locale,
  onCorrect,
}: {
  team: AttendanceTeam;
  day: string;
  onDay: (day: string) => void;
  locale: string;
  onCorrect: (correcting: Correcting) => void;
}) {
  const { t } = useTranslation();
  const dates = team.people[0]?.days.map((entry) => entry.businessDate) ?? [];
  const index = dates.indexOf(day);
  const openOf = new Map(team.inNow.map((open) => [open.employmentId, open]));
  const label = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));

  return (
    <div className="flex flex-col gap-3 sm:hidden">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={t.teamAttendance.previousDay}
          disabled={index <= 0}
          onClick={() => onDay(dates[index - 1]!)}
        >
          <ChevronLeft />
        </Button>
        <span className="font-semibold capitalize">{label}</span>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={t.teamAttendance.nextDay}
          disabled={index < 0 || index >= dates.length - 1}
          onClick={() => onDay(dates[index + 1]!)}
        >
          <ChevronRight />
        </Button>
      </div>
      <ul className="flex flex-col">
        {team.people.map((person) => {
          const entry = person.days.find((candidate) => candidate.businessDate === day);
          const open = openOf.get(person.employmentId);
          return (
            <li
              key={person.employmentId}
              className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-2.5 last:border-b-0"
              style={{ borderColor: "var(--border)" }}
            >
              <Person
                person={person}
                subtitle={groupNames(person, t.teamAttendance.noGroup)}
                live={open !== undefined}
              />
              {entry ? (
                <Correctable
                  person={person}
                  day={entry}
                  open={open?.businessDate === day ? open : undefined}
                  className="px-1"
                  onCorrect={onCorrect}
                >
                  <DayCell
                    day={entry}
                    open={open?.businessDate === day ? open : undefined}
                    mode={team.balanceMode}
                    today={team.businessDate}
                    timezone={team.timezone}
                    locale={locale}
                    align="end"
                  />
                </Correctable>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Team attendance: every Employment the viewer may see, one row each, one
 * column per day of the range and the period's balance at the end. The
 * backend decides who is in the list from the visibility matrix; the screen
 * only decides which organization and range to ask about.
 */
export function TeamAttendanceScreen() {
  const { t, locale } = useTranslation();
  const session = useSession();
  const roles = useViewerRoles();
  const groupsQuery = useGroups();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [view, setView] = useState<TeamView>("week");
  const [anchored, setAnchored] = useState<string | null>(null);
  const [custom, setCustom] = useState<DateRange | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [correcting, setCorrecting] = useState<Correcting | null>(null);

  const organizations = teamOrganizations(
    roles.organization,
    groupsQuery.data ?? [],
    session.data?.user.id
  );
  const activeOrganization =
    organizations.find((candidate) => candidate.id === organizationId) ?? organizations[0] ?? null;

  // The browser's day only until the answer names the organization's.
  const fallbackToday = new Date().toISOString().slice(0, 10);
  const anchor = anchored ?? fallbackToday;
  const range = rangeOf(view, anchor, custom ?? weekRange(fallbackToday));
  const days = daysInRange(range);
  const rangeError =
    days < 1
      ? t.teamAttendance.rangeInsideOut
      : days > TEAM_RANGE_MAX_DAYS
        ? t.teamAttendance.rangeTooLong(TEAM_RANGE_MAX_DAYS)
        : null;

  const deciding = roles.isLoading || groupsQuery.isPending || session.isPending;
  const query = useTeamAttendance(
    activeOrganization && rangeError === null
      ? { organizationId: activeOrganization.id, from: range.from, to: range.to, groupId }
      : null,
    !deciding
  );
  const team = query.data;
  const today = team?.businessDate ?? null;

  // The filter is the org admin's; a group admin's list is their groups already.
  const filterable = team?.scope === "ORGANIZATION";
  const organizationQuery = useOrganization(filterable ? activeOrganization?.id : null);
  const filterGroups = organizationQuery.data?.groups ?? [];

  const step = (direction: -1 | 1) => {
    if (view === "range") return;
    setAnchored(stepAnchor(view, anchor, direction));
  };

  const day =
    pickedDay && pickedDay >= range.from && pickedDay <= range.to
      ? pickedDay
      : defaultDay(range, today);

  const subtitle = (() => {
    if (!team) return null;
    const count = team.people.length;
    if (team.group) return t.teamAttendance.group(team.group.groupName, count);
    if (team.scope === "ORGANIZATION") {
      return t.teamAttendance.everyone(activeOrganization?.name ?? "", count);
    }
    return t.teamAttendance.yourGroups(count);
  })();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.teamAttendance.title}</h1>
          {subtitle ? <p style={{ color: "var(--text-muted)" }}>{subtitle}</p> : null}
        </div>

        {!deciding && organizations.length === 0 ? null : (
          <div className="flex flex-wrap items-center gap-2">
            {organizations.length > 1 ? (
              <Select
                value={activeOrganization?.id ?? ""}
                onValueChange={(value) => {
                  setOrganizationId(value);
                  setGroupId(null);
                }}
              >
                <SelectTrigger className="w-44" aria-label={t.teamAttendance.organizationFilter}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((organization) => (
                    <SelectItem key={organization.id} value={organization.id}>
                      {organization.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {filterable ? (
              <Select
                value={groupId ?? ALL_GROUPS}
                onValueChange={(value) => setGroupId(value === ALL_GROUPS ? null : value)}
              >
                <SelectTrigger className="w-44" aria-label={t.teamAttendance.groupFilter}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_GROUPS}>{t.teamAttendance.allGroups}</SelectItem>
                  {filterGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.groupName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            <div
              role="tablist"
              aria-label={t.teamAttendance.title}
              className="flex rounded-full border p-0.5"
              style={{ borderColor: "var(--border)" }}
            >
              {(["week", "month", "range"] as const).map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  role="tab"
                  aria-selected={view === candidate}
                  onClick={() => {
                    setView(candidate);
                    setAnchored(null);
                    if (candidate === "range" && custom === null) setCustom(range);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                    view === candidate
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.teamAttendance.views[candidate]}
                </button>
              ))}
            </div>

            {view === "range" ? (
              <div className="flex items-center gap-2">
                <Label htmlFor="team-range-from" className="sr-only">
                  {t.teamAttendance.from}
                </Label>
                <Input
                  id="team-range-from"
                  type="date"
                  className="w-40"
                  value={range.from}
                  onChange={(event) => setCustom({ from: event.target.value, to: range.to })}
                />
                <span style={{ color: "var(--text-muted)" }}>–</span>
                <Label htmlFor="team-range-to" className="sr-only">
                  {t.teamAttendance.to}
                </Label>
                <Input
                  id="team-range-to"
                  type="date"
                  className="w-40"
                  value={range.to}
                  onChange={(event) => setCustom({ from: range.from, to: event.target.value })}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label={t.clock.previousRange}
                  onClick={() => step(-1)}
                >
                  <ChevronLeft />
                </Button>
                <span className="min-w-40 text-center font-semibold">
                  {rangeLabel(range, locale)}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label={t.clock.nextRange}
                  onClick={() => step(1)}
                >
                  <ChevronRight />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {rangeError ? (
        <p className="text-sm" style={{ color: "var(--destructive)" }}>
          {rangeError}
        </p>
      ) : !deciding && organizations.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t.teamAttendance.notAllowed}
        </p>
      ) : deciding || query.isPending ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t.common.loading}
        </p>
      ) : query.error ? (
        <p className="text-sm" style={{ color: "var(--destructive)" }}>
          {query.error instanceof ApiError && query.error.status === 403
            ? t.teamAttendance.notAllowed
            : t.teamAttendance.loadFailed}
        </p>
      ) : team ? (
        <>
          <InNowStrip team={team} locale={locale} />

          {team.people.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t.teamAttendance.nobody}
            </p>
          ) : (
            <>
              {anyPresence(team.people) ? null : (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t.teamAttendance.nothingRecorded}
                </p>
              )}
              <Matrix team={team} locale={locale} onCorrect={setCorrecting} />
              <DayList
                team={team}
                day={day}
                onDay={setPickedDay}
                locale={locale}
                onCorrect={setCorrecting}
              />
            </>
          )}

          <Legend />

          {correcting && activeOrganization ? (
            <CorrectionDialog
              organizationId={activeOrganization.id}
              userId={correcting.userId}
              personName={correcting.name}
              businessDate={correcting.businessDate}
              open
              onOpenChange={(next) => {
                if (!next) setCorrecting(null);
              }}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
