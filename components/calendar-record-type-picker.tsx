"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarRecordType,
  OTHER_CALENDAR_RECORD_TYPES,
  PRIMARY_CALENDAR_RECORD_TYPES,
} from "@/lib/api/types";
import { leaveMetaFor } from "@/lib/demo/leave-meta";
import { useTranslation } from "@/lib/i18n/use-translation";

/** Radix Tabs/Select values must be strings, so the Others group needs a sentinel. */
const OTHERS = "__others__";

/**
 * The grouped type picker both request dialogs share: the everyday types one
 * click away, the rarer ones behind an Others option that reveals a second
 * select. `value` is null while Others is open with nothing picked yet — the
 * dialogs block submission on that.
 */
export function CalendarRecordTypePicker({
  value,
  onChange,
  idPrefix,
  extraKind,
  offerSickDay,
}: {
  value: CalendarRecordType | null;
  onChange: (value: CalendarRecordType | null) => void;
  /** Prefixes element ids so two dialogs can mount the picker independently. */
  idPrefix: string;
  /**
   * A kind outside the requestable set that must still be offered — the edited
   * record's own (e.g. SickDay booked via API). Without it the picker would
   * silently rewrite the type.
   */
  extraKind?: CalendarRecordType;
  /** Offer SickDay under Others — only for a group whose organization has the benefit active. */
  offerSickDay?: boolean;
}) {
  const { t } = useTranslation();

  const baseKinds = offerSickDay
    ? [CalendarRecordType.SickDay, ...OTHER_CALENDAR_RECORD_TYPES]
    : OTHER_CALENDAR_RECORD_TYPES;
  const otherKinds =
    extraKind !== undefined &&
    !PRIMARY_CALENDAR_RECORD_TYPES.includes(extraKind) &&
    !baseKinds.includes(extraKind)
      ? [...baseKinds, extraKind]
      : baseKinds;

  const topValue = value !== null && PRIMARY_CALENDAR_RECORD_TYPES.includes(value) ? value : OTHERS;
  const handleTopChange = (v: string) => onChange(v === OTHERS ? null : (v as CalendarRecordType));

  return (
    <div className="space-y-1.5">
      {/* Four kind labels don't fit one row on phones — a select reads
          better there than a wrapped tab grid. */}
      <div className="sm:hidden">
        <Select value={topValue} onValueChange={handleTopChange}>
          <SelectTrigger id={`${idPrefix}-top`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIMARY_CALENDAR_RECORD_TYPES.map((k) => (
              <SelectItem key={k} value={k}>
                {t.calendarRecordTypes[k].label}
              </SelectItem>
            ))}
            <SelectItem value={OTHERS}>{t.newRequest.others}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Tabs value={topValue} onValueChange={handleTopChange} className="max-sm:hidden">
        <TabsList aria-labelledby={`${idPrefix}-label`} className="w-full">
          {PRIMARY_CALENDAR_RECORD_TYPES.map((k) => (
            <TabsTrigger key={k} value={k}>
              {t.calendarRecordTypes[k].label}
            </TabsTrigger>
          ))}
          <TabsTrigger value={OTHERS}>{t.newRequest.others}</TabsTrigger>
        </TabsList>
      </Tabs>
      {topValue === OTHERS ? (
        <Select value={value ?? ""} onValueChange={(v) => onChange(v as CalendarRecordType)}>
          <SelectTrigger
            id={`${idPrefix}-other`}
            aria-label={t.newRequest.others}
            className="w-full"
          >
            <SelectValue placeholder={t.newRequest.selectOtherType} />
          </SelectTrigger>
          <SelectContent>
            {otherKinds.map((k) => (
              <SelectItem key={k} value={k}>
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: leaveMetaFor(k).cssVar }}
                />
                {t.calendarRecordTypes[k].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
