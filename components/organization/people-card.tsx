"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UsersRound } from "lucide-react";
import { AccountDeletedLabel } from "@/components/account-deleted-label";
import { Badge } from "@/components/ui/badge";
import { EndEmploymentDialog } from "@/components/organization/end-employment-dialog";
import { EraseDialog } from "@/components/organization/erase-dialog";
import { PersonExportAction } from "@/components/person-export-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { pushToast } from "@/components/toast";
import {
  useAttendanceSettings,
  useDirectoryState,
  useEmployments,
  useRequestPersonExport,
  useRequestedExports,
  useUpdateEmploymentRequiredMinutes,
} from "@/lib/api/queries";
import type { EmploymentListItem } from "@/lib/api/employment";
import type { PersonExport } from "@/lib/api/person-export";
import { profileHref } from "@/components/directory/directory-list";
import { formatMinutes, parseMinutes } from "@/lib/attendance/duration";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

/**
 * The organization's roster for its owner and org admins, on every plan, split
 * into open and former Employments. With attendance on, each row also takes
 * the person's own required time per day; empty means the organization's.
 */
export function PeopleCard({
  organizationId,
  focusEmploymentId = null,
}: {
  organizationId: string | null;
  /** Marked and scrolled into view, for the account deleted notice's link. */
  focusEmploymentId?: string | null;
}) {
  const { t } = useTranslation();
  const settings = useAttendanceSettings(organizationId).data;
  const query = useEmployments(organizationId);
  const exports = useRequestedExports(organizationId).data;
  const requestExport = useRequestPersonExport();
  // While the directory is on, a person's End, Export and Erase sit on their profile.
  const directoryOn = useDirectoryState(organizationId).data?.enabled ?? false;

  if (query.isPending) return null;

  const exportOf = new Map(exports?.map((entry) => [entry.subjectUserId, entry]));

  const attendanceOn = settings?.attendanceEnabled ?? false;
  // The backend reads "today" in this zone, UTC while attendance was never set up.
  const timeZone = settings?.timezone ?? "UTC";
  const open = query.data?.filter((employment) => !employment.ended) ?? [];
  const former = (query.data?.filter((employment) => employment.ended) ?? []).sort((a, b) =>
    (b.endedAt ?? "").localeCompare(a.endedAt ?? "")
  );

  const rows = (list: EmploymentListItem[]) =>
    list.map((employment) => (
      <PersonRow
        key={employment.id}
        employment={employment}
        organizationId={organizationId}
        requiredMinutesPerDay={attendanceOn ? (settings?.requiredMinutesPerDay ?? null) : null}
        timeZone={timeZone}
        exportEntry={exportOf.get(employment.userId)}
        requestingExport={requestExport.isPending && requestExport.variables === employment.id}
        onRequestExport={() => requestExport.mutateAsync(employment.id)}
        focused={employment.id === focusEmploymentId}
        directoryOn={directoryOn}
      />
    ));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersRound className="h-4 w-4" aria-hidden />
          {t.organization.people.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          {t.organization.people.lead}
          {attendanceOn ? ` ${t.organization.people.requiredLead}` : null}
        </p>
        {directoryOn ? (
          <p className="text-muted-foreground text-sm">{t.organization.people.inDirectory}</p>
        ) : null}

        {/* A roster that failed to load says so: an admin who came here to act
            on somebody should not be met by a card that is simply absent. */}
        {query.error || !query.data ? (
          <p className="text-destructive text-sm">{t.organization.people.loadFailed}</p>
        ) : (
          <>
            <section className="space-y-1">
              <h3
                id="people-open"
                className="text-muted-foreground text-xs font-semibold uppercase"
              >
                {t.organization.people.open}
              </h3>
              {open.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t.organization.people.empty}</p>
              ) : (
                <ul aria-labelledby="people-open" className="divide-border divide-y">
                  {rows(open)}
                </ul>
              )}
            </section>
            {former.length > 0 ? (
              <section className="space-y-1">
                <h3
                  id="people-former"
                  className="text-muted-foreground text-xs font-semibold uppercase"
                >
                  {t.organization.people.former}
                </h3>
                <ul aria-labelledby="people-former" className="divide-border divide-y">
                  {rows(former)}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PersonRow({
  employment,
  organizationId,
  requiredMinutesPerDay,
  timeZone,
  exportEntry,
  requestingExport,
  onRequestExport,
  focused,
  directoryOn,
}: {
  employment: EmploymentListItem;
  organizationId: string | null;
  /** Null while attendance is off: the field means nothing without it. */
  requiredMinutesPerDay: number | null;
  timeZone: string;
  exportEntry: PersonExport | undefined;
  requestingExport: boolean;
  onRequestExport: () => Promise<unknown>;
  focused: boolean;
  directoryOn: boolean;
}) {
  const { t } = useTranslation();
  const rowRef = useRef<HTMLLIElement>(null);
  const external = employment.type === "external";

  useEffect(() => {
    if (focused) rowRef.current?.scrollIntoView({ block: "center" });
  }, [focused]);

  return (
    <li
      ref={rowRef}
      aria-current={focused ? "true" : undefined}
      className={cn(
        "flex flex-wrap items-center gap-3 py-3",
        focused && "bg-accent/60 -mx-2 rounded-md px-2"
      )}
    >
      <div className="min-w-40 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-medium">
          {employment.user.name}
          {employment.accountDeleted ? <AccountDeletedLabel /> : null}
          {external ? (
            <Badge variant="outline" data-testid="external-worker">
              {t.directory.markers.EXTERNAL_WORKER}
            </Badge>
          ) : null}
          {employment.endedAt ? (
            <span className="text-muted-foreground text-xs font-normal">
              {t.organization.people.endedOn(
                new Date(employment.endedAt).toLocaleDateString(t.common.dateLocale)
              )}
            </span>
          ) : null}
        </p>
        {/* A Deleted account's address is a placeholder, not a way to reach anyone. */}
        {employment.accountDeleted ? null : (
          <p className="text-muted-foreground text-xs">{employment.email}</p>
        )}
      </div>

      {requiredMinutesPerDay !== null && !external ? (
        <RequiredMinutes
          employment={employment}
          organizationId={organizationId}
          requiredMinutesPerDay={requiredMinutesPerDay}
        />
      ) : null}

      {directoryOn && organizationId ? (
        <Button asChild size="sm" variant="outline">
          <Link
            href={profileHref(organizationId, employment.id)}
            aria-label={t.organization.people.openProfile(employment.user.name)}
          >
            {t.organization.people.profile}
          </Link>
        </Button>
      ) : (
        <RowActions
          employment={employment}
          organizationId={organizationId}
          timeZone={timeZone}
          exportEntry={exportEntry}
          requestingExport={requestingExport}
          onRequestExport={onRequestExport}
        />
      )}
    </li>
  );
}

function RowActions({
  employment,
  organizationId,
  timeZone,
  exportEntry,
  requestingExport,
  onRequestExport,
}: {
  employment: EmploymentListItem;
  organizationId: string | null;
  timeZone: string;
  exportEntry: PersonExport | undefined;
  requestingExport: boolean;
  onRequestExport: () => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [ending, setEnding] = useState(false);
  const [erasing, setErasing] = useState(false);

  return (
    <>
      <PersonExportAction
        entry={exportEntry}
        labels={{
          export: t.common.personExport.exportFor(employment.user.name),
          download: t.common.personExport.downloadFor(employment.user.name),
        }}
        requesting={requestingExport}
        onRequest={onRequestExport}
      />

      {/* Outside the directory only a Deleted account has an End here (T-482). */}
      {employment.accountDeleted && !employment.ended ? (
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-destructive"
            onClick={() => setEnding(true)}
          >
            {t.organization.people.end}
          </Button>
          <EndEmploymentDialog
            open={ending}
            onOpenChange={setEnding}
            employment={employment}
            organizationId={organizationId}
            timeZone={timeZone}
          />
        </>
      ) : null}

      {employment.accountDeleted ? (
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-destructive"
            aria-label={t.organization.people.eraseFor(employment.user.name)}
            onClick={() => setErasing(true)}
          >
            {t.organization.people.erase}
          </Button>
          <EraseDialog
            open={erasing}
            onOpenChange={setErasing}
            employment={employment}
            organizationId={organizationId}
          />
        </>
      ) : null}
    </>
  );
}

function RequiredMinutes({
  employment,
  organizationId,
  requiredMinutesPerDay,
}: {
  employment: EmploymentListItem;
  organizationId: string | null;
  requiredMinutesPerDay: number;
}) {
  const { t } = useTranslation();
  const update = useUpdateEmploymentRequiredMinutes(organizationId);
  const stored =
    employment.requiredMinutesPerDay === null
      ? ""
      : formatMinutes(employment.requiredMinutesPerDay);
  const [value, setValue] = useState(stored);
  const [error, setError] = useState<string | null>(null);
  const dirty = value.trim() !== stored;

  async function save() {
    setError(null);
    const trimmed = value.trim();
    const minutes = trimmed === "" ? null : parseMinutes(trimmed);

    if (trimmed !== "" && minutes === null) {
      setError(t.organization.people.invalid);
      return;
    }

    try {
      await update.mutateAsync({ employmentId: employment.id, requiredMinutesPerDay: minutes });
      setValue(minutes === null ? "" : formatMinutes(minutes));
      pushToast(t.organization.people.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.organization.people.saveFailed);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          className="w-24 tabular-nums"
          aria-label={`${t.organization.people.requiredLabel} — ${employment.user.name}`}
          placeholder={formatMinutes(requiredMinutesPerDay)}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!dirty || update.isPending}
          onClick={() => void save()}
        >
          {t.organization.people.save}
        </Button>
      </div>

      <p className="text-muted-foreground w-full text-xs sm:w-auto">
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : (
          t.organization.people.usingOrganization(formatMinutes(requiredMinutesPerDay))
        )}
      </p>
    </>
  );
}
