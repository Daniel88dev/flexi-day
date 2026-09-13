"use client";

import { useState } from "react";
import { UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { pushToast } from "@/components/toast";
import {
  useAttendanceSettings,
  useEmployments,
  useUpdateEmploymentRequiredMinutes,
} from "@/lib/api/queries";
import type { EmploymentListItem } from "@/lib/api/employment";
import { formatMinutes, parseMinutes } from "@/lib/attendance/duration";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * The organization's roster, and the one field on it an admin sets: this
 * person's required time per day. Empty means the organization's own figure,
 * so clearing the box is how an override goes away.
 */
export function PeopleCard({ organizationId }: { organizationId: string | null }) {
  const { t } = useTranslation();
  const settingsQuery = useAttendanceSettings(organizationId);
  const settings = settingsQuery.data;
  const query = useEmployments(organizationId, settings?.attendanceEnabled ?? false);

  // The override measures attendance and means nothing without it, so the card
  // arrives with the feature rather than standing as a roster of its own.
  if (!settings?.attendanceEnabled || query.isPending) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersRound className="h-4 w-4" aria-hidden />
          {t.organization.people.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{t.organization.people.lead}</p>

        {/* A roster that failed to load says so: an admin who came here to set
            somebody's hours should not be met by a card that is simply absent. */}
        {query.error || !query.data ? (
          <p className="text-destructive text-sm">{t.organization.people.loadFailed}</p>
        ) : query.data.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t.organization.people.empty}</p>
        ) : (
          <ul className="divide-border divide-y">
            {query.data.map((employment) => (
              <PersonRow
                key={employment.id}
                employment={employment}
                organizationId={organizationId}
                requiredMinutesPerDay={settings.requiredMinutesPerDay}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function PersonRow({
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
  const [value, setValue] = useState(
    employment.requiredMinutesPerDay === null ? "" : formatMinutes(employment.requiredMinutesPerDay)
  );
  const [error, setError] = useState<string | null>(null);

  const stored =
    employment.requiredMinutesPerDay === null
      ? ""
      : formatMinutes(employment.requiredMinutesPerDay);
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
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-40 flex-1">
        <p className="font-medium">
          {employment.user.name}
          {employment.ended ? (
            <span className="text-muted-foreground ml-2 text-xs">
              {t.organization.people.ended}
            </span>
          ) : null}
        </p>
        <p className="text-muted-foreground text-xs">{employment.email}</p>
      </div>

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
    </li>
  );
}
