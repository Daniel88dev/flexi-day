"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { CalendarClock, CalendarPlus, ChevronDown } from "lucide-react";
import { NewRequestDialog } from "@/components/new-request-dialog";
import { pushToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGroupEventGroups, useGroups } from "@/lib/api/queries";
import { groupEventCalendarHref } from "@/lib/group-events/calendar-link";
import { openGroupEventSheet, shownGroupEventGroup } from "@/lib/group-events/sheet-store";
import { useTranslation } from "@/lib/i18n/use-translation";
import { isLinkActive } from "@/lib/navigation/shell-links";

/** True once the groups have loaded and there is none to request time off in. */
export function useNoGroups(): boolean {
  const groupsQuery = useGroups();
  return (groupsQuery.data ?? []).length === 0 && !groupsQuery.isLoading;
}

/**
 * The shell's way into a new group event: whether any group can take one, and the opener that
 * starts the sheet on today and toasts after the create.
 */
export function useNewGroupEvent() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const groupsQuery = useGroupEventGroups();
  const canCreate = (groupsQuery.data ?? []).some((g) => g.canCreate);

  function open() {
    const onDashboard = isLinkActive(pathname, "/dashboard");
    openGroupEventSheet({
      groupId: onDashboard ? shownGroupEventGroup() : null,
      onCreated: (event) =>
        pushToast(t.groupEvents.created, "ok", {
          // The dashboard refetches on its own, so a link there would lead nowhere new.
          action: onDashboard
            ? undefined
            : { label: t.groupEvents.viewOnCalendar, href: groupEventCalendarHref(event) },
        }),
    });
  }

  return { canCreate, open };
}

/** The header's create entry: "+ New ▾" while a group can take a group event, else "+ New Request". */
export function NewMenu() {
  const { t } = useTranslation();
  const noGroups = useNoGroups();
  const groupEvent = useNewGroupEvent();
  const [requestOpen, setRequestOpen] = useState(false);

  if (!groupEvent.canCreate) return <NewRequestDialog />;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm">
            {t.newRequest.menu.trigger}
            <ChevronDown aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem disabled={noGroups} onSelect={() => setRequestOpen(true)}>
            <CalendarPlus aria-hidden />
            {t.newRequest.menu.timeOff}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={groupEvent.open}>
            <CalendarClock aria-hidden />
            {t.newRequest.menu.groupEvent}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <NewRequestDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </>
  );
}
