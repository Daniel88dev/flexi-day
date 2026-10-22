"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  customMonths,
  presetRange,
  rangeLabel,
  withFirst,
  withLast,
  type MonthPreset,
  type MonthSelection,
  type YearMonth,
} from "@/lib/vacations/month-range";

const monthKey = (m: YearMonth) => `${m.year}-${m.month}`;

function parseMonthKey(key: string): YearMonth {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}

export function MonthRangeSelect({
  value,
  onChange,
  today,
}: {
  value: MonthSelection;
  onChange: (next: MonthSelection) => void;
  today: YearMonth;
}) {
  const { t } = useTranslation();
  const monthsShort = t.calendar.monthsShort;
  const presets: [MonthPreset | "custom", string][] = [
    ["this", t.requests.monthPresets.this],
    ["next3", t.requests.monthPresets.next3],
    ["year", String(today.year)],
    ["custom", t.requests.monthPresets.custom],
  ];
  const options = customMonths(today);
  const label = (m: YearMonth) => rangeLabel({ first: m, last: m }, monthsShort);

  const pickPreset = (picked: string) => {
    const preset = picked as MonthSelection["preset"];
    onChange({
      preset,
      range: preset === "custom" ? value.range : presetRange(preset, today),
    });
  };

  const monthSelect = (
    current: YearMonth,
    ariaLabel: string,
    pick: (m: YearMonth) => MonthSelection["range"]
  ) => (
    <Select
      value={monthKey(current)}
      onValueChange={(key) => onChange({ preset: "custom", range: pick(parseMonthKey(key)) })}
    >
      <SelectTrigger size="sm" className="w-[120px]" aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((m) => (
          <SelectItem key={monthKey(m)} value={monthKey(m)}>
            {label(m)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tabs value={value.preset} onValueChange={pickPreset}>
        <TabsList aria-label={t.requests.monthsLabel} className="h-8 p-0.5">
          {presets.map(([preset, text]) => (
            <TabsTrigger key={preset} value={preset} className="h-full flex-none">
              {text}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {value.preset === "custom" ? (
        <div className="flex items-center gap-2 text-sm">
          <span aria-hidden className="text-muted-foreground">
            {t.requests.rangeFrom}
          </span>
          {monthSelect(value.range.first, t.requests.rangeFromLabel, (m) =>
            withFirst(value.range, m)
          )}
          <span aria-hidden className="text-muted-foreground">
            {t.requests.rangeTo}
          </span>
          {monthSelect(value.range.last, t.requests.rangeToLabel, (m) => withLast(value.range, m))}
        </div>
      ) : null}
    </div>
  );
}
