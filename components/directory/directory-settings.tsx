"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DirectoryListsPanel } from "@/components/directory/directory-lists-panel";
import { DirectoryRolesPanel } from "@/components/directory/directory-roles-panel";
import { EmergencyNoticePanel } from "@/components/directory/emergency-notice-panel";
import { PermissionHistory } from "@/components/directory/permission-history";
import { ReadLogPanel } from "@/components/directory/read-log-panel";
import { RetentionPanel } from "@/components/directory/retention-panel";
import { PermissionTableEditor } from "@/components/directory/permission-table-editor";
import type { DirectoryOrganization } from "@/lib/api/directory";
import { administers } from "@/lib/directory/directory-access";
import type { SettingsPanel } from "@/lib/directory/settings-panel";
import { useTranslation } from "@/lib/i18n/use-translation";

/** The Directory settings tab, for the owner, org admins and HR. Later settings add a panel here. */
export function DirectorySettings({
  organization,
  initialPanel = "permissions",
}: {
  organization: DirectoryOrganization;
  initialPanel?: SettingsPanel;
}) {
  const { t } = useTranslation();
  const copy = t.directory.settings;
  const [panel, setPanel] = useState<SettingsPanel>(initialPanel);
  // The Read log is for the owner and org admins; HR reads it only by also being one.
  const readsLog = administers(organization);
  const panels: [SettingsPanel, string][] = [
    ["permissions", copy.permissions],
    ["roles", copy.roles],
    ["general", copy.general],
    ["retention", copy.retention],
    ["lists", copy.lists],
    ...(readsLog ? [["readLog", copy.readLog] as [SettingsPanel, string]] : []),
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[13rem_1fr]">
      <nav aria-label={copy.sectionsLabel} className="flex flex-wrap gap-1 lg:flex-col">
        {panels.map(([id, label]) => (
          <Button
            key={id}
            variant={panel === id ? "secondary" : "ghost"}
            className="justify-start"
            aria-pressed={panel === id}
            onClick={() => setPanel(id)}
          >
            {label}
          </Button>
        ))}
      </nav>
      <div className="min-w-0 space-y-4">
        {panel === "permissions" ? (
          <PermissionTableEditor organizationId={organization.organizationId} />
        ) : panel === "roles" ? (
          <DirectoryRolesPanel organizationId={organization.organizationId} />
        ) : panel === "general" ? (
          <EmergencyNoticePanel organizationId={organization.organizationId} />
        ) : panel === "retention" ? (
          <RetentionPanel organizationId={organization.organizationId} />
        ) : panel === "lists" ? (
          <DirectoryListsPanel organizationId={organization.organizationId} />
        ) : (
          <ReadLogPanel organizationId={organization.organizationId} />
        )}
        {panel === "permissions" || panel === "roles" ? (
          <PermissionHistory organizationId={organization.organizationId} />
        ) : null}
      </div>
    </div>
  );
}
