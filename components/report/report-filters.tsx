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
import type { ReportFilters } from "@/lib/api/report-types";
import type { ReportScope } from "@/lib/api/report-types";
import { VACATION_KIND_LABELS, VacationKind } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";

type Props = {
  scope: ReportScope | undefined;
  filters: ReportFilters;
  onChange: (next: ReportFilters) => void;
};

const ALL_KINDS = Object.values(VacationKind);

export function ReportFiltersBar({ scope, filters, onChange }: Props) {
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

  const typeOptions: MultiSelectOption[] = ALL_KINDS.map((kind) => ({
    value: kind,
    label: VACATION_KIND_LABELS[kind],
  }));

  const years = scope?.years?.length ? scope.years : [filters.year];

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-muted-foreground text-xs font-medium">{t.report.filters.year}</span>
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
