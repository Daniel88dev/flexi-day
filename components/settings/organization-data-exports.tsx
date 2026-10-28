"use client";

import { PersonExportAction } from "@/components/person-export-action";
import { useOwnExportOrganizations, useRequestOwnPersonExport } from "@/lib/api/queries";
import { formatEmploymentDay } from "@/lib/directory/format";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * The signed-in person's own Person export, one row per organization where
 * their account is bound to an Employment, open or ended. Sits in the Your
 * data card below the Account export.
 */
export function OrganizationDataExports() {
  const { t } = useTranslation();
  const d = t.settings.yourData;
  const query = useOwnExportOrganizations();
  const request = useRequestOwnPersonExport();

  return (
    <section aria-labelledby="your-organization-data" className="space-y-3">
      <div className="space-y-1">
        <p id="your-organization-data" className="text-sm font-medium">
          {d.organizationData}
        </p>
        <p className="text-muted-foreground text-sm">{d.organizationDataHint}</p>
      </div>
      {query.isPending ? (
        <p className="text-muted-foreground text-sm">{t.common.loading}</p>
      ) : query.error ? (
        <p className="text-destructive text-sm">{d.loadFailed}</p>
      ) : query.data.length === 0 ? (
        <p className="text-muted-foreground text-sm">{d.noOrganizations}</p>
      ) : (
        <ul className="divide-border divide-y">
          {query.data.map((organization) => (
            <li
              key={organization.organizationId}
              className="flex flex-wrap items-center justify-between gap-3 py-2"
            >
              <div>
                <p className="text-sm">{organization.organizationName}</p>
                {organization.endedAt ? (
                  <p className="text-muted-foreground text-xs">
                    {d.ended(
                      formatEmploymentDay(
                        organization.endedAt,
                        t.common.dateLocale,
                        organization.timezone
                      )
                    )}
                  </p>
                ) : null}
              </div>
              <PersonExportAction
                entry={organization.export}
                labels={{
                  export: d.exportFrom(organization.organizationName),
                  download: d.downloadFrom(organization.organizationName),
                }}
                requesting={request.isPending && request.variables === organization.organizationId}
                onRequest={() => request.mutateAsync(organization.organizationId)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
