"use client";

import { useState } from "react";
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
import { useCarryOverSuggestion, useSetUserQuota } from "@/lib/api/queries";
import type { ReportQuotaRow, ReportScopeGroup } from "@/lib/api/report-types";
import { useTranslation } from "@/lib/i18n/use-translation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  year: number;
  group: ReportScopeGroup;
  quota: ReportQuotaRow | undefined;
};

/**
 * Admin edit of one member's allowance in one group. Restricted to the
 * current year — past years are settled and a future year has no carry-over
 * to compute from yet. Every save writes an audit entry the member detail
 * lists under "changes by admins".
 */
export function QuotaEditDialog({ open, onOpenChange, userId, year, group, quota }: Props) {
  const { t } = useTranslation();
  const setQuota = useSetUserQuota();

  // The parent mounts this component only while a group is being edited, so
  // the initial values below are re-seeded on every open by the remount.
  const [vacationDays, setVacationDays] = useState(String(quota?.vacationDays ?? 0));
  const [homeOfficeDays, setHomeOfficeDays] = useState(String(quota?.homeOfficeDays ?? 0));
  const [carriedOverDays, setCarriedOverDays] = useState(String(quota?.carriedOverDays ?? 0));
  const [error, setError] = useState<string | null>(null);

  const suggestion = useCarryOverSuggestion(group.groupId, userId, year, open);

  function handleSave() {
    setError(null);
    setQuota.mutate(
      {
        groupId: group.groupId,
        userId,
        year,
        vacationDays: Number(vacationDays) || 0,
        homeOfficeDays: Number(homeOfficeDays) || 0,
        carriedOverDays: Number(carriedOverDays) || 0,
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) =>
          setError(err instanceof Error ? err.message : t.report.quotaDialog.failed),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.report.quotaDialog.title}</DialogTitle>
          <DialogDescription>{t.report.quotaDialog.description(year)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <span className="text-muted-foreground text-xs">{t.report.quotaDialog.group}</span>
            <p className="text-sm font-medium">{group.groupName}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="quota-vacation">{t.report.quotaDialog.vacationDays}</Label>
              <Input
                id="quota-vacation"
                type="number"
                min={0}
                max={365}
                value={vacationDays}
                onChange={(event) => setVacationDays(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quota-home-office">{t.report.quotaDialog.homeOfficeDays}</Label>
              <Input
                id="quota-home-office"
                type="number"
                min={0}
                max={365}
                value={homeOfficeDays}
                onChange={(event) => setHomeOfficeDays(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quota-carried-over">{t.report.quotaDialog.carriedOver}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="quota-carried-over"
                type="number"
                min={0}
                max={365}
                value={carriedOverDays}
                onChange={(event) => setCarriedOverDays(event.target.value)}
              />
              {suggestion.data ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCarriedOverDays(String(suggestion.data.suggestion))}
                >
                  {t.report.quotaDialog.useSuggestion}
                </Button>
              ) : null}
            </div>
            {suggestion.data ? (
              <p className="text-muted-foreground text-xs">
                {t.report.quotaDialog.suggestion(
                  suggestion.data.suggestion,
                  suggestion.data.previousYear
                )}
              </p>
            ) : null}
          </div>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">{t.common.cancel}</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={setQuota.isPending}>
            {setQuota.isPending ? t.common.saving : t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
