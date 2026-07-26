"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";

export type MultiSelectOption = {
  value: string;
  label: string;
  hint?: string;
};

type Props = {
  label: string;
  /** Shown on the trigger when nothing is selected — an empty set means "all". */
  allLabel: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  searchable?: boolean;
  disabled?: boolean;
};

export function MultiSelect({
  label,
  allLabel,
  options,
  selected,
  onChange,
  searchable = false,
  disabled = false,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedSet = new Set(selected);
  const visible = query
    ? options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  function toggle(value: string) {
    onChange(
      selectedSet.has(value) ? selected.filter((entry) => entry !== value) : [...selected, value]
    );
  }

  const triggerLabel =
    selected.length === 0 ? allLabel : t.report.filters.selectedCount(selected.length);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            aria-label={label}
            className="w-[190px] justify-between font-normal"
          >
            <span className={cn(selected.length === 0 && "text-muted-foreground")}>
              {triggerLabel}
            </span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[260px] gap-2 p-2">
          {searchable ? (
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.report.filters.searchMembers}
              className="h-8"
            />
          ) : null}

          <div className="max-h-64 overflow-y-auto">
            {visible.map((option) => {
              const isSelected = selectedSet.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggle(option.value)}
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 flex-none items-center justify-center rounded border",
                      isSelected ? "border-primary bg-primary text-primary-foreground" : ""
                    )}
                  >
                    {isSelected ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <span className="truncate">{option.label}</span>
                  {option.hint ? (
                    <span className="text-muted-foreground ml-auto truncate text-xs">
                      {option.hint}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {selected.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="w-full justify-center"
            >
              {t.report.filters.clear}
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
