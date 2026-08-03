"use client";

import { Suspense } from "react";
import { VacationDetailDialog } from "@/components/vacation-detail-dialog";
import { useOpenVacationDetail, useVacationDetailId } from "@/lib/vacations/use-vacation-detail";

function VacationDetailFromUrl() {
  const vacationId = useVacationDetailId();
  const { closeVacation } = useOpenVacationDetail();

  return (
    <VacationDetailDialog
      vacationId={vacationId}
      open={vacationId !== null}
      onOpenChange={(open) => {
        if (!open) closeVacation();
      }}
    />
  );
}

/**
 * The one request detail dialog for the whole app, opened by `?vacationId=` on
 * any page. Mounted in the app layout so a notification — or an emailed deep
 * link — shows the request without moving the reader off the page they are on.
 */
export function VacationDetailHost() {
  return (
    <Suspense fallback={null}>
      <VacationDetailFromUrl />
    </Suspense>
  );
}
