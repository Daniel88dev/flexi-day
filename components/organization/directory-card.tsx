"use client";

import { useState } from "react";
import Link from "next/link";
import { Contact } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteDirectoryDataDialog } from "@/components/organization/delete-directory-data-dialog";
import { EnableDirectoryDialog } from "@/components/organization/enable-directory-dialog";
import { TurnOffDirectoryDialog } from "@/components/organization/turn-off-directory-dialog";
import type { DirectoryState } from "@/lib/api/directory";
import { useDirectoryState } from "@/lib/api/queries";
import { formatDate } from "@/lib/directory/format";
import { useTranslation } from "@/lib/i18n/use-translation";

/** Turned off at some point and not emptied since: what Delete all is for. */
const holdsOffData = (state: DirectoryState) =>
  !state.enabled &&
  state.enabledAt !== null &&
  (!state.dataDeletedAt || (state.disabledAt !== null && state.disabledAt > state.dataDeletedAt));

/** The directory switch on the Organization page. Only the owner turns it on or off. */
export function DirectoryCard({
  organizationId,
  organizationName,
}: {
  organizationId: string | null;
  organizationName: string;
}) {
  const { t } = useTranslation();
  const copy = t.organization.directory;
  const state = useDirectoryState(organizationId);
  const [enabling, setEnabling] = useState(false);
  const [turningOff, setTurningOff] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const data = state.data;
  const date = (iso: string) => formatDate(iso, t.common.dateLocale);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Contact className="h-4 w-4" aria-hidden />
          {copy.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {state.isLoading ? (
          <p className="text-muted-foreground text-sm">{t.common.loading}</p>
        ) : !data ? (
          <p className="text-destructive text-sm">{t.directory.loadFailed}</p>
        ) : data.enabled ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{copy.on}</Badge>
              {data.enabledAt ? <span>{copy.since(date(data.enabledAt))}</span> : null}
            </div>
            {data.agreement.acceptedVersion !== null && data.agreement.acceptedAt ? (
              <p className="text-muted-foreground text-xs">
                {copy.accepted(
                  data.agreement.acceptedVersion,
                  data.agreement.acceptedByName,
                  date(data.agreement.acceptedAt)
                )}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/directory">{copy.openDirectory}</Link>
              </Button>
              {data.isOwner && organizationId ? (
                <Button size="sm" variant="outline" onClick={() => setTurningOff(true)}>
                  {copy.turnOff}
                </Button>
              ) : null}
            </div>
            {data.isOwner && organizationId ? (
              <TurnOffDirectoryDialog
                open={turningOff}
                onOpenChange={setTurningOff}
                organizationId={organizationId}
              />
            ) : null}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{copy.off}</Badge>
              {data.enabledAt && data.disabledAt ? (
                <span>{copy.offSince(date(data.disabledAt))}</span>
              ) : null}
            </div>
            <p className="text-muted-foreground text-sm">{copy.lead}</p>
            {!data.writable ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-muted-foreground text-xs font-semibold">{copy.planRequired}</p>
                {data.isOwner ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href="/billing">{copy.seePlans}</Link>
                  </Button>
                ) : null}
              </div>
            ) : null}
            {data.isOwner ? (
              <Button size="sm" disabled={!data.writable} onClick={() => setEnabling(true)}>
                {copy.turnOn}
              </Button>
            ) : (
              <p className="text-muted-foreground text-xs">{copy.ownerOnly}</p>
            )}
            {data.isOwner && data.writable ? (
              <EnableDirectoryDialog
                open={enabling}
                onOpenChange={setEnabling}
                state={data}
                organizationName={organizationName}
              />
            ) : null}
            {data.dataDeletedAt && !holdsOffData(data) ? (
              <p className="text-muted-foreground text-xs">
                {copy.deletedOn(date(data.dataDeletedAt))}
              </p>
            ) : null}
            {data.isOwner && organizationId && holdsOffData(data) ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setDeleting(true)}
                >
                  {copy.deleteAll}
                </Button>
                <DeleteDirectoryDataDialog
                  open={deleting}
                  onOpenChange={setDeleting}
                  organizationId={organizationId}
                  organizationName={organizationName}
                />
              </>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
