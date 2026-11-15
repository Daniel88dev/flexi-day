"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { AssistantOrganization } from "@/lib/api/assistant";
import { useTranslation } from "@/lib/i18n/use-translation";

export function OrgPicker({
  organizations,
  leftOut,
  value,
  onChange,
  locked,
  label,
}: {
  organizations: AssistantOrganization[];
  leftOut: AssistantOrganization[];
  value: string;
  onChange: (organizationId: string) => void;
  locked: boolean;
  /** Shown when locked, or when the chat's organization isn't among the eligible ones. */
  label: string;
}) {
  const { t } = useTranslation();
  const copy = t.assistant.picker;
  const [open, setOpen] = useState(false);
  if (locked) {
    return (
      <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
    );
  }
  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="-mx-1.5 inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-1.5 py-0.5 text-[13px] font-semibold hover:bg-[var(--surface-2)]"
      >
        {label}
        <ChevronDown className="size-3.5" aria-hidden />
      </button>
      {open ? (
        <div
          className="absolute top-full left-0 z-50 mt-1 w-72 rounded-[var(--radius-md)] border p-1.5"
          style={{
            borderColor: "var(--border)",
            background: "var(--popover)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div className="px-2.5 pt-1 pb-1.5 text-[12.5px]" style={{ color: "var(--text-muted)" }}>
            {copy.question}
          </div>
          <div role="listbox" aria-label={copy.question}>
            {organizations.map((organization) => (
              <button
                key={organization.organizationId}
                role="option"
                aria-selected={organization.organizationId === value}
                type="button"
                onClick={() => {
                  onChange(organization.organizationId);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-[14px] font-medium hover:bg-[var(--surface-2)]"
              >
                {organization.organizationName}
                {organization.organizationId === value ? (
                  <Check className="size-4" style={{ color: "var(--primary)" }} aria-hidden />
                ) : null}
              </button>
            ))}
          </div>
          {leftOut.map((organization) => (
            <div
              key={organization.organizationId}
              className="px-2.5 pt-1.5 pb-1 text-[12px]"
              style={{ color: "var(--text-faint)" }}
            >
              {!organization.planAllows
                ? copy.needsEnterprise(organization.organizationName)
                : copy.turnedOff(organization.organizationName)}
            </div>
          ))}
        </div>
      ) : null}
    </span>
  );
}
