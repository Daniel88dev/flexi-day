"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { VACATION_ID_PARAM, withVacationId } from "./vacation-detail-url";

/**
 * Opens and closes the request detail dialog by writing `?vacationId=` onto
 * the page the reader is already on — never by navigating somewhere else.
 *
 * The current query is read from `window.location` inside the handler rather
 * than through `useSearchParams`, which would force every caller (the nav bar
 * included) behind a Suspense boundary to keep the static export building.
 *
 * `replace` rather than `push` throughout: opening and closing a dialog should
 * not stack history entries the back button then has to walk out of.
 */
export function useOpenVacationDetail() {
  const router = useRouter();
  const pathname = usePathname();

  const setVacationId = useCallback(
    (vacationId: string | null) => {
      router.replace(`${pathname}${withVacationId(window.location.search, vacationId)}`, {
        scroll: false,
      });
    },
    [router, pathname]
  );

  return {
    openVacation: useCallback((id: string) => setVacationId(id), [setVacationId]),
    closeVacation: useCallback(() => setVacationId(null), [setVacationId]),
  };
}

/** The request the URL currently asks for, or null. Needs a Suspense boundary. */
export function useVacationDetailId(): string | null {
  return useSearchParams().get(VACATION_ID_PARAM);
}
