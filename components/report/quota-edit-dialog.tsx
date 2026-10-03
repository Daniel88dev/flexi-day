"use client";

import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCarryOverSuggestion, useGroup, useSetUserQuota } from "@/lib/api/queries";
import type { ReportQuotaRow, ReportScopeGroup } from "@/lib/api/report-types";
import { sickDayBenefitActive, type Group } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  year: number;
  group: ReportScopeGroup;
  quota: ReportQuotaRow | undefined;
};

type QuotaValues = {
  vacationDays: string;
  homeOfficeDays: string;
  sickDays: string;
  carriedOverDays: string;
};

/** Where the form's starting values come from, or why it has none yet. */
type QuotaStatus = "stored" | "defaults" | "loading" | "failed";

const EMPTY_VALUES: QuotaValues = {
  vacationDays: "",
  homeOfficeDays: "",
  sickDays: "",
  carriedOverDays: "",
};

function quotaStatus(
  quota: ReportQuotaRow | undefined,
  group: Group | undefined,
  groupFailed: boolean
): QuotaStatus {
  if (quota) return "stored";
  if (group) return "defaults";
  return groupFailed ? "failed" : "loading";
}

// A member with no stored row is booked against the group defaults (carry-over
// 0), and the report shows them, so the form starts from those rather than 0.
function initialValues(quota: ReportQuotaRow | undefined, group: Group | undefined): QuotaValues {
  if (quota) {
    return {
      vacationDays: String(quota.vacationDays),
      homeOfficeDays: String(quota.homeOfficeDays),
      sickDays: String(quota.sickDays ?? 0),
      carriedOverDays: String(quota.carriedOverDays),
    };
  }
  if (!group) return EMPTY_VALUES;
  return {
    vacationDays: String(group.defaultVacationDays),
    homeOfficeDays: String(group.defaultHomeOfficeDays),
    sickDays: String(group.defaultSickDays ?? 0),
    carriedOverDays: "0",
  };
}

/**
 * Admin edit of one member's allowance in one group. Restricted to the
 * current year — past years are settled and a future year has no carry-over
 * to compute from yet. Every save writes an audit entry the member detail
 * lists under "changes by admins".
 */
export function QuotaEditDialog({ open, onOpenChange, userId, year, group, quota }: Props) {
  // The report scope carries no organization, so the benefit gate comes from
  // the group's own badge.
  const groupQuery = useGroup(open ? group.groupId : null);
  const status = quotaStatus(quota, groupQuery.data, groupQuery.isError);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* The parent mounts the dialog per edit, and the key remounts the form
            when the defaults arrive, so its state always seeds from the current
            starting values. */}
        <QuotaEditForm
          key={status}
          status={status}
          initial={initialValues(quota, groupQuery.data)}
          sickDayActive={sickDayBenefitActive(groupQuery.data)}
          onDone={() => onOpenChange(false)}
          userId={userId}
          year={year}
          group={group}
        />
      </DialogContent>
    </Dialog>
  );
}

type FormProps = {
  status: QuotaStatus;
  initial: QuotaValues;
  sickDayActive: boolean;
  onDone: () => void;
  userId: string;
  year: number;
  group: ReportScopeGroup;
};

function QuotaEditForm({ status, initial, sickDayActive, onDone, userId, year, group }: FormProps) {
  const { t } = useTranslation();
  const setQuota = useSetUserQuota();
  const ready = status === "stored" || status === "defaults";

  const [values, setValues] = useState<QuotaValues>(initial);
  const [error, setError] = useState<string | null>(null);

  const suggestion = useCarryOverSuggestion(group.groupId, userId, year, true);

  function setFieldValue(field: keyof QuotaValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSave() {
    setError(null);
    setQuota.mutate(
      {
        groupId: group.groupId,
        userId,
        year,
        vacationDays: Number(values.vacationDays) || 0,
        homeOfficeDays: Number(values.homeOfficeDays) || 0,
        ...(sickDayActive ? { sickDays: Number(values.sickDays) || 0 } : {}),
        carriedOverDays: Number(values.carriedOverDays) || 0,
      },
      {
        onSuccess: onDone,
        onError: (err) =>
          setError(err instanceof Error ? err.message : t.report.quotaDialog.failed),
      }
    );
  }

  const fieldProps = { values, disabled: !ready, onChange: setFieldValue };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t.report.quotaDialog.title}</DialogTitle>
        <DialogDescription>{t.report.quotaDialog.description(year)}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <span className="text-muted-foreground text-xs">{t.report.quotaDialog.group}</span>
          <p className="text-sm font-medium">{group.groupName}</p>
        </div>

        {status === "loading" ? (
          <p className="text-muted-foreground text-sm">{t.common.loading}</p>
        ) : null}
        {status === "failed" ? (
          <p className="text-destructive text-sm">{t.report.quotaDialog.defaultsFailed}</p>
        ) : null}
        {status === "defaults" ? (
          <p className="text-muted-foreground text-xs">{t.report.quotaDialog.defaultsHint}</p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <QuotaNumberField
            field="vacationDays"
            id="quota-vacation"
            label={t.report.quotaDialog.vacationDays}
            {...fieldProps}
          />
          <QuotaNumberField
            field="homeOfficeDays"
            id="quota-home-office"
            label={t.report.quotaDialog.homeOfficeDays}
            {...fieldProps}
          />
          {sickDayActive ? (
            <QuotaNumberField
              field="sickDays"
              id="quota-sick-days"
              label={t.report.quotaDialog.sickDays}
              {...fieldProps}
            />
          ) : null}
        </div>

        <QuotaNumberField
          field="carriedOverDays"
          id="quota-carried-over"
          label={t.report.quotaDialog.carriedOver}
          {...fieldProps}
          action={
            suggestion.data ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!ready}
                onClick={() => setFieldValue("carriedOverDays", String(suggestion.data.suggestion))}
              >
                {t.report.quotaDialog.useSuggestion}
              </Button>
            ) : null
          }
        >
          {suggestion.data ? (
            <p className="text-muted-foreground text-xs">
              {t.report.quotaDialog.suggestion(
                suggestion.data.suggestion,
                suggestion.data.previousYear
              )}
            </p>
          ) : null}
        </QuotaNumberField>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost">{t.common.cancel}</Button>
        </DialogClose>
        <Button onClick={handleSave} disabled={!ready || setQuota.isPending}>
          {setQuota.isPending ? t.common.saving : t.common.save}
        </Button>
      </DialogFooter>
    </>
  );
}

type QuotaNumberFieldProps = {
  field: keyof QuotaValues;
  id: string;
  label: string;
  values: QuotaValues;
  disabled: boolean;
  onChange: (field: keyof QuotaValues, value: string) => void;
  action?: ReactNode;
  children?: ReactNode;
};

function QuotaNumberField({
  field,
  id,
  label,
  values,
  disabled,
  onChange,
  action,
  children,
}: QuotaNumberFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          min={0}
          max={365}
          value={values[field]}
          disabled={disabled}
          onChange={(event) => onChange(field, event.target.value)}
        />
        {action}
      </div>
      {children}
    </div>
  );
}
