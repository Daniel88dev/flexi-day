"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BreakDraft, BreakErrors } from "@/lib/attendance/correction";
import type { Dictionary } from "@/lib/i18n";
import { useTranslation } from "@/lib/i18n/use-translation";

export function breakMessage(
  id: string,
  errors: BreakErrors,
  draft: { startedAt: string; endedAt: string; breaks: BreakDraft[] },
  t: Dictionary
): string | undefined {
  const error = errors.breaks?.[id];
  if (!error) return undefined;
  if (error === "BREAK_OUTSIDE_SESSION" && draft.startedAt && draft.endedAt) {
    return t.corrections.breakOutside(draft.startedAt, draft.endedAt);
  }
  if (error === "BREAK_OVERLAPS") {
    const other = draft.breaks.find((entry) => entry.id === errors.overlaps?.[id]);
    if (other) return t.corrections.breakOverlaps(other.startedAt, other.endedAt);
  }
  return t.corrections.errors[error];
}

export function useBreakDrafts(initial: () => BreakDraft[] = () => []) {
  const [breaks, setBreaks] = useState<BreakDraft[]>(initial);
  const countRef = useRef(0);

  return {
    breaks,
    change: (id: string, patch: Partial<BreakDraft>) =>
      setBreaks((current) =>
        current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
      ),
    add: () => {
      countRef.current += 1;
      const id = `new-${countRef.current}`;
      setBreaks((current) => [...current, { id, startedAt: "", endedAt: "", isNew: true }]);
    },
    remove: (id: string) => setBreaks((current) => current.filter((entry) => entry.id !== id)),
    markSaved: (id: string, savedId: string) =>
      setBreaks((current) =>
        current.map((entry) =>
          entry.id === id
            ? { id: savedId, startedAt: entry.startedAt, endedAt: entry.endedAt }
            : entry
        )
      ),
  };
}

export function BreakRows({
  breaks,
  messageFor,
  onChange,
  onRemove,
  onAdd,
  optional = false,
  tagNew = true,
  disabled = false,
}: {
  breaks: BreakDraft[];
  messageFor: (id: string) => string | undefined;
  onChange: (id: string, patch: Partial<BreakDraft>) => void;
  onRemove: (entry: BreakDraft) => void;
  onAdd?: () => void;
  optional?: boolean;
  tagNew?: boolean;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">
        {t.corrections.breaks}
        {optional ? (
          <span className="font-normal" style={{ color: "var(--text-faint)" }}>
            {" "}
            {t.entry.optional}
          </span>
        ) : null}
      </span>
      {breaks.length === 0 ? (
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t.corrections.noBreaks}
        </span>
      ) : (
        breaks.map((entry) => {
          const message = messageFor(entry.id);
          return (
            <div key={entry.id} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor={`break-start-${entry.id}`} className="sr-only">
                  {t.corrections.breaks}
                </Label>
                <Input
                  id={`break-start-${entry.id}`}
                  type="time"
                  className="w-32"
                  value={entry.startedAt}
                  aria-invalid={message !== undefined}
                  onChange={(event) => onChange(entry.id, { startedAt: event.target.value })}
                />
                <span style={{ color: "var(--text-muted)" }}>{t.corrections.to}</span>
                <Label htmlFor={`break-end-${entry.id}`} className="sr-only">
                  {t.corrections.to}
                </Label>
                <Input
                  id={`break-end-${entry.id}`}
                  type="time"
                  className="w-32"
                  value={entry.endedAt}
                  aria-invalid={message !== undefined}
                  onChange={(event) => onChange(entry.id, { endedAt: event.target.value })}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={t.corrections.removeBreak}
                  disabled={disabled}
                  onClick={() => onRemove(entry)}
                >
                  <X />
                </Button>
                {tagNew && entry.isNew ? (
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{ background: "var(--primary-soft)", color: "var(--primary-strong)" }}
                  >
                    {t.corrections.newBreak}
                  </span>
                ) : null}
              </div>
              {message ? (
                <span className="text-xs" style={{ color: "var(--destructive)" }}>
                  {message}
                </span>
              ) : null}
            </div>
          );
        })
      )}
      {onAdd ? (
        <div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ps-1.5"
            disabled={disabled}
            onClick={onAdd}
          >
            <Plus />
            {t.corrections.addBreak}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
