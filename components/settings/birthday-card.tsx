"use client";

import { useState, type ReactNode } from "react";
import { Cake, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { pushToast } from "@/components/toast";
import { BIRTHDAY_SHARE_PLAN_REQUIRED, type MyBirthday } from "@/lib/api/birthday";
import { errorCode } from "@/lib/api/client";
import { useMyBirthday, useRemoveMyBirthday, useSaveMyBirthday } from "@/lib/api/queries";
import { useSession } from "@/lib/auth-client";
import {
  BIRTHDAY_TINT,
  EARLIEST_BIRTH_YEAR,
  ageAtNextBirthday,
  daysInMonth,
  firstName,
  parseBirthYear,
  shareSwitchState,
} from "@/lib/birthdays/birthday";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

type Draft = { day: number | null; month: number | null; yearText: string; shared: boolean };

function draftOf(birthday: MyBirthday | null): Draft {
  return {
    day: birthday?.day ?? null,
    month: birthday?.month ?? null,
    yearText: birthday?.year != null ? String(birthday.year) : "",
    shared: birthday?.shared ?? false,
  };
}

function sameDraft(a: Draft, b: Draft) {
  return (
    a.day === b.day && a.month === b.month && a.yearText === b.yearText && a.shared === b.shared
  );
}

function Chip({ children, muted }: { children: ReactNode; muted?: boolean }) {
  const Tag = muted ? "del" : "span";
  return (
    <Tag
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-semibold",
        muted && "text-muted-foreground decoration-1"
      )}
      style={
        muted
          ? undefined
          : {
              background: `color-mix(in oklch, ${BIRTHDAY_TINT} 14%, transparent)`,
              color: `color-mix(in oklch, ${BIRTHDAY_TINT} 70%, var(--foreground))`,
            }
      }
    >
      <Cake className="size-3.5" aria-hidden />
      {children}
    </Tag>
  );
}

/**
 * The user's birthday and whether their groups see it, with a live panel of what each audience
 * gets. Edits stay in a draft until Save, which writes the whole birthday once.
 */
export function BirthdayCard() {
  const { t } = useTranslation();
  const b = t.settings.birthday;
  const labels = t.calendar.birthday;
  const { data: session } = useSession();
  const query = useMyBirthday();
  const save = useSaveMyBirthday();
  const remove = useRemoveMyBirthday();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planRefused, setPlanRefused] = useState(false);

  const today = new Date();
  const stored = query.data?.birthday ?? null;
  const storedDraft = draftOf(stored);
  const value = draft ?? storedDraft;
  const dirty = draft !== null && !sameDraft(draft, storedDraft);
  const busy = !query.data || save.isPending || remove.isPending;

  const year = parseBirthYear(value.yearText, today);
  const hasDate = value.day !== null && value.month !== null;
  const age =
    value.day !== null && value.month !== null && year.valid
      ? ageAtNextBirthday({ month: value.month, day: value.day, year: year.year }, today)
      : null;

  const shareGroups = query.data?.shareGroups ?? [];
  const switchState = shareSwitchState({
    canShare: query.data?.canShare ?? false,
    storedShared: stored?.shared ?? false,
  });
  const shown = value.shared && hasDate && shareGroups.length > 0;
  const name = firstName(session?.user?.name, session?.user?.email?.split("@")[0]);
  const groupChip = age !== null ? labels.nameTurns(name, age) : labels.namesBirthday(name);

  function edit(patch: Partial<Draft>) {
    setError(null);
    setPlanRefused(false);
    setDraft({ ...value, ...patch });
  }

  async function onSave() {
    if (value.day === null || value.month === null || !year.valid) return;
    setError(null);
    setPlanRefused(false);
    try {
      await save.mutateAsync({
        month: value.month,
        day: value.day,
        year: year.year,
        shared: value.shared,
      });
      setDraft(null);
      pushToast(t.common.saved);
    } catch (err) {
      if (errorCode(err) === BIRTHDAY_SHARE_PLAN_REQUIRED) {
        setPlanRefused(true);
        return;
      }
      const message = err instanceof Error ? err.message : t.settings.saveFailed;
      setError(message);
      pushToast(message, "danger");
    }
  }

  async function onRemove() {
    setError(null);
    setPlanRefused(false);
    try {
      await remove.mutateAsync();
      setDraft(null);
      pushToast(b.removed);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.settings.saveFailed;
      setError(message);
      pushToast(message, "danger");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{b.title}</CardTitle>
        <CardDescription>{b.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="grid grid-cols-[4.5rem_1fr_5.5rem] gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="birthday-day">{b.day}</Label>
                  <Select
                    value={value.day ? String(value.day) : ""}
                    disabled={busy}
                    onValueChange={(v) => edit({ day: Number(v) })}
                  >
                    <SelectTrigger id="birthday-day" aria-label={b.day} className="w-full">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: daysInMonth(value.month) }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="birthday-month">{b.month}</Label>
                  <Select
                    value={value.month ? String(value.month) : ""}
                    disabled={busy}
                    onValueChange={(v) => {
                      const month = Number(v);
                      edit({
                        month,
                        day:
                          value.day !== null && value.day > daysInMonth(month) ? null : value.day,
                      });
                    }}
                  >
                    <SelectTrigger id="birthday-month" aria-label={b.month} className="w-full">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent>
                      {t.calendar.months.map((label, i) => (
                        <SelectItem key={label} value={String(i + 1)}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="birthday-year">
                    {b.year} <span className="text-muted-foreground font-normal">{b.optional}</span>
                  </Label>
                  <Input
                    id="birthday-year"
                    inputMode="numeric"
                    maxLength={4}
                    disabled={busy}
                    aria-invalid={!year.valid}
                    value={value.yearText}
                    onChange={(e) => edit({ yearText: e.target.value.replace(/\D/g, "") })}
                  />
                </div>
              </div>
              {!year.valid ? (
                <p className="text-destructive text-sm">
                  {b.yearInvalid(EARLIEST_BIRTH_YEAR, today.getFullYear())}
                </p>
              ) : null}
              <p className="text-muted-foreground text-sm">{b.yearHint}</p>
              {value.day === 29 && value.month === 2 ? (
                <p className="text-muted-foreground text-sm">{b.leapNote}</p>
              ) : null}
            </div>

            {switchState === "notice" ? (
              <div className="bg-muted text-muted-foreground flex items-start gap-2.5 rounded-lg p-3 text-sm">
                <Lock className="mt-0.5 size-4 flex-none" aria-hidden />
                <span>{b.noPaidGroup}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <Label htmlFor="birthday-share" className="leading-snug">
                    {b.share}
                  </Label>
                  <Switch
                    id="birthday-share"
                    checked={value.shared}
                    disabled={busy || !hasDate || (switchState === "lapsed" && !value.shared)}
                    onCheckedChange={(shared) => edit({ shared })}
                  />
                </div>
                {switchState === "lapsed" || planRefused ? (
                  <p className="text-muted-foreground text-sm">{b.lapsed}</p>
                ) : null}
              </div>
            )}

            {query.error ? <p className="text-destructive text-sm">{query.error.message}</p> : null}
            {error ? <p className="text-destructive text-sm">{error}</p> : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => void onSave()}
                disabled={busy || !dirty || !hasDate || !year.valid}
              >
                {save.isPending ? t.common.saving : t.common.save}
              </Button>
              {dirty ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDraft(null);
                    setError(null);
                    setPlanRefused(false);
                  }}
                >
                  {t.common.cancel}
                </Button>
              ) : null}
              {stored && !dirty ? (
                <Button
                  variant="ghost"
                  className="text-destructive ml-auto"
                  disabled={busy}
                  onClick={() => void onRemove()}
                >
                  {b.remove}
                </Button>
              ) : null}
            </div>
          </div>

          <aside
            aria-labelledby="birthday-panel-title"
            className="bg-muted/60 space-y-4 rounded-xl p-4"
          >
            <p
              id="birthday-panel-title"
              className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
            >
              {b.panelTitle}
            </p>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{b.yourCalendar}</p>
              {hasDate ? (
                <Chip>{age !== null ? b.youTurn(age) : labels.yours}</Chip>
              ) : (
                <p className="text-muted-foreground text-sm">{b.nothingYet}</p>
              )}
            </div>
            {shareGroups.length > 0 ? (
              shareGroups.map((group) => (
                <div key={group.groupId} className="space-y-1.5">
                  <p className="text-sm font-medium">{b.groupCalendarIn(group.groupName)}</p>
                  <Chip muted={!shown}>{groupChip}</Chip>
                </div>
              ))
            ) : (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">{b.groupCalendar}</p>
                <Chip muted>{groupChip}</Chip>
              </div>
            )}
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{b.teamFeeds}</p>
              <Chip muted={!shown}>{labels.namesBirthday(name)}</Chip>
              <p className="text-muted-foreground text-xs">{b.neverWithAge}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{b.colleaguesCalendars}</p>
              <p className="text-muted-foreground text-sm">{b.never}</p>
            </div>
          </aside>
        </div>
      </CardContent>
    </Card>
  );
}
