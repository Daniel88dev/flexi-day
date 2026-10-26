"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SettingsPanel } from "@/components/directory/directory-settings";
import type { DirectoryChecklistItemKey } from "@/lib/api/directory";
import { useDirectoryChecklist, useHideDirectoryChecklist } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";

const PANEL_OF: Record<DirectoryChecklistItemKey, SettingsPanel | null> = {
  departments: "lists",
  locations: "lists",
  hr: "roles",
  jobTitles: null,
};

/**
 * The setup checklist for the owner, org admins and HR. Ticks come from the
 * data; Hide hides it for the whole organization.
 */
export function DirectoryChecklist({
  organizationId,
  onOpenSettings,
}: {
  organizationId: string;
  onOpenSettings: (panel: SettingsPanel) => void;
}) {
  const { t } = useTranslation();
  const copy = t.directory.checklist;
  const checklist = useDirectoryChecklist(organizationId, true);
  const hide = useHideDirectoryChecklist(organizationId);

  const data = checklist.data;
  if (!data || data.hidden) return null;

  return (
    <section
      aria-labelledby="directory-checklist-title"
      className="border-primary/30 bg-primary/5 space-y-3 rounded-[var(--radius)] border px-4 py-3"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="directory-checklist-title" className="text-sm font-semibold">
          {copy.title}
        </h2>
        <Button size="sm" variant="ghost" disabled={hide.isPending} onClick={() => hide.mutate()}>
          {copy.hide}
        </Button>
      </div>
      <ul className="space-y-1.5">
        {data.items.map(({ key, done }) => {
          const panel = PANEL_OF[key];
          return (
            <li
              key={key}
              data-testid={`checklist-item-${key}`}
              data-done={done}
              className="flex items-center gap-2 text-sm"
            >
              {done ? (
                <CheckCircle2 className="text-primary h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <Circle className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
              )}
              {panel ? (
                <button
                  type="button"
                  className={`underline-offset-2 hover:underline ${done ? "text-muted-foreground line-through" : ""}`}
                  onClick={() => onOpenSettings(panel)}
                >
                  {copy.items[key]}
                </button>
              ) : (
                <span className={done ? "text-muted-foreground line-through" : ""}>
                  {copy.items[key]}
                </span>
              )}
              {done ? <span className="sr-only">{copy.done}</span> : null}
              {key === "jobTitles" && !done ? (
                <span className="text-muted-foreground text-xs">{copy.jobTitlesHint}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {data.reviewPermissions ? (
        <Button
          size="sm"
          variant="link"
          className="h-auto px-0"
          onClick={() => onOpenSettings("permissions")}
        >
          {copy.reviewPermissions}
        </Button>
      ) : null}
    </section>
  );
}
