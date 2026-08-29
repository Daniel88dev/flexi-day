"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect, type MultiSelectOption } from "@/components/report/multi-select";
import type { ReportFilters, ReportPeriod, ReportScope } from "@/lib/api/report-types";
import { VacationKind } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";

type Props = {
  scope: ReportScope | undefined;
  filters: ReportFilters;
  onChange: (next: ReportFilters) => void;
  /**
   * Supplied by the report page, where the charts can span a rolling window.
   * Omitted by the export dialog: a workbook is always one calendar year.
   */
  period?: ReportPeriod;
  onPeriodChange?: (next: ReportPeriod) => void;
};

const ALL_KINDS = Object.values(VacationKind);

const ROLLING = "rolling";

export function ReportFiltersBar({ scope, filters, onChange, period, onPeriodChange }: Props) {
  const { t } = useTranslation();

  const groupOptions: MultiSelectOption[] = useMemo(
    () => (scope?.groups ?? []).map((g) => ({ value: g.groupId, label: g.groupName })),
    [scope]
  );

  // A member in two selected groups must not appear twice in the picker.
  const memberOptions: MultiSelectOption[] = useMemo(() => {
    const inScope = (scope?.members ?? []).filter(
      (member) => !filters.groupIds?.length || filters.groupIds.includes(member.groupId)
    );
    const byId = new Map<string, MultiSelectOption>();
    for (const member of inScope) {
      if (!byId.has(member.id)) byId.set(member.id, { value: member.id, label: member.name });
    }
    return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [scope, filters.groupIds]);

  const typeOptions: MultiSelectOption[] = useMemo(
    () => ALL_KINDS.map((kind) => ({ value: kind, label: t.leaveTypes[kind].label })),
    [t]
  );

  const years = scope?.years?.length ? scope.years : [filters.year];

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-muted-foreground text-xs font-medium">
          {onPeriodChange ? t.report.filters.period : t.report.filters.year}
        </span>
        {onPeriodChange ? (
          <Select
            value={period === "rolling" ? ROLLING : String(period)}
            onValueChange={(value) => onPeriodChange(value === ROLLING ? "rolling" : Number(value))}
          >
            <SelectTrigger className="w-[170px]" aria-label={t.report.filters.period}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ROLLING}>{t.report.filters.lastTwelveMonths}</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select
            value={String(filters.year)}
            onValueChange={(value) => onChange({ ...filters, year: Number(value) })}
          >
            <SelectTrigger className="w-[120px]" aria-label={t.report.filters.year}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <MultiSelect
        label={t.report.filters.groups}
        allLabel={t.report.filters.allGroups}
        options={groupOptions}
        selected={filters.groupIds ?? []}
        onChange={(groupIds) => {
          // Members are scoped to the chosen groups, so a narrowed group
          // selection must not leave a now-invisible member selected.
          const stillVisible = new Set(
            (scope?.members ?? [])
              .filter((m) => groupIds.length === 0 || groupIds.includes(m.groupId))
              .map((m) => m.id)
          );
          onChange({
            ...filters,
            groupIds,
            userIds: (filters.userIds ?? []).filter((id) => stillVisible.has(id)),
          });
        }}
      />

      <MultiSelect
        label={t.report.filters.members}
        allLabel={t.report.filters.allMembers}
        options={memberOptions}
        selected={filters.userIds ?? []}
        onChange={(userIds) => onChange({ ...filters, userIds })}
        searchable
      />

      <MultiSelect
        label={t.report.filters.types}
        allLabel={t.report.filters.allTypes}
        options={typeOptions}
        selected={filters.types ?? []}
        onChange={(types) => onChange({ ...filters, types: types as VacationKind[] })}
      />
    </div>
  );
}
