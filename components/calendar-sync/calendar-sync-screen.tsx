"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { getCalendarSync, type CalendarSyncConfig } from "@/lib/api/calendar-sync";
import {
  useCalendarSyncs,
  useCreateCalendarSync,
  useDeleteCalendarSync,
  useGroups,
  useRegenerateCalendarSyncToken,
  useUpdateCalendarSync,
  useVacations,
} from "@/lib/api/queries";
import { useSession } from "@/lib/auth-client";
import { configToBuilder, newBuilderConfig, type BuilderConfig } from "@/lib/calendar-sync/meta";
import { useTranslation } from "@/lib/i18n/use-translation";
import { CalBuilder, type MonthContext } from "./cal-builder";
import { CalCard } from "./cal-card";
import { ConfirmDialog, type ConfirmKind } from "./confirm-dialog";
import { DirectSyncSection } from "./direct-sync-section";
import { EmptyState } from "./empty-state";
import { pushToast, ToastHost } from "./toast";

function currentMonthContext(): MonthContext {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const days = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  return {
    year,
    month,
    days,
    firstWeekdayMondayIdx: (firstDow + 6) % 7,
    label: now.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
  };
}

export function CalendarSyncScreen() {
  const { t } = useTranslation();
  const monthCtx = useMemo(() => {
    const base = currentMonthContext();
    return { ...base, label: `${t.calendar.months[base.month - 1]} ${base.year}` };
  }, [t]);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";

  const configsQ = useCalendarSyncs();
  const groupsQ = useGroups();
  const vacationsQ = useVacations({ year: monthCtx.year, month: monthCtx.month });

  const createM = useCreateCalendarSync();
  const updateM = useUpdateCalendarSync();
  const deleteM = useDeleteCalendarSync();
  const regenM = useRegenerateCalendarSyncToken();

  const [modal, setModal] = useState<{ initial: BuilderConfig; isNew: boolean } | null>(null);
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; config: CalendarSyncConfig } | null>(
    null
  );

  const configs = configsQ.data ?? [];
  const groups = groupsQ.data ?? [];
  const vacations = vacationsQ.data ?? [];

  const teamsLabel = (config: CalendarSyncConfig): string => {
    const ids = config.teamIds;
    if (groups.length > 0 && ids.length === groups.length) return t.calSync.allTeams;
    if (ids.length > 1) return t.calSync.teamsCount(ids.length);
    if (ids.length === 1)
      return groups.find((g) => g.id === ids[0])?.groupName ?? t.calSync.oneTeam;
    return t.calSync.dash;
  };

  const openNew = () =>
    setModal({ initial: newBuilderConfig(groups.map((g) => g.id)), isNew: true });
  const openEdit = (c: CalendarSyncConfig) =>
    setModal({ initial: configToBuilder(c), isNew: false });

  const resolveFeedUrl = async (id: string) => (await getCalendarSync(id)).feedUrl;

  const handleSubmit = async (input: Parameters<typeof createM.mutateAsync>[0]) => {
    if (modal?.isNew || !modal?.initial.id) {
      return createM.mutateAsync(input);
    }
    return updateM.mutateAsync({ id: modal.initial.id, input });
  };

  const doConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === "delete") {
        await deleteM.mutateAsync(confirm.config.id);
        pushToast(t.calSync.toasts.deleted, "danger");
      } else {
        await regenM.mutateAsync(confirm.config.id);
        pushToast(t.calSync.toasts.regenerated, "warm");
      }
      setConfirm(null);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : t.calSync.toasts.wrong, "danger");
    }
  };

  return (
    <div style={{ animation: "fx-fade .35s ease" }}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div>
          <span
            className="text-xs font-semibold uppercase"
            style={{ letterSpacing: ".08em", color: "var(--primary)" }}
          >
            {t.calSync.eyebrow}
          </span>
          <h1 className="text-[34px]" style={{ margin: "10px 0 6px" }}>
            {t.calSync.title}
          </h1>
          <p className="text-base" style={{ color: "var(--text-muted)", maxWidth: 560 }}>
            {t.calSync.subtitle}
          </p>
        </div>
        {configs.length > 0 ? (
          <button type="button" className="cs-btn cs-btn-primary" onClick={openNew}>
            <Plus size={17} />
            {t.calSync.newCalendar}
          </button>
        ) : null}
      </div>

      {configsQ.isLoading ? (
        <div
          className="cs-card grid place-items-center"
          style={{ padding: "64px", color: "var(--text-muted)" }}
        >
          {t.calSync.loading}
        </div>
      ) : configsQ.isError ? (
        <div
          className="cs-card grid place-items-center"
          style={{ padding: "64px", color: "var(--danger)" }}
        >
          {t.calSync.loadError}
        </div>
      ) : configs.length === 0 ? (
        <EmptyState onCreate={openNew} />
      ) : (
        <div
          className="grid gap-[18px]"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))" }}
        >
          {configs.map((c) => (
            <CalCard
              key={c.id}
              config={c}
              teamsLabel={teamsLabel(c)}
              onEdit={openEdit}
              onDelete={(cf) => setConfirm({ kind: "delete", config: cf })}
              onRegen={(cf) => setConfirm({ kind: "regen", config: cf })}
              resolveFeedUrl={resolveFeedUrl}
            />
          ))}
        </div>
      )}

      <DirectSyncSection />

      {modal ? (
        <CalBuilder
          initial={modal.initial}
          isNew={modal.isNew}
          groups={groups}
          vacations={vacations}
          currentUserId={currentUserId}
          monthCtx={monthCtx}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
        />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          kind={confirm.kind}
          name={confirm.config.name}
          busy={deleteM.isPending || regenM.isPending}
          onClose={() => setConfirm(null)}
          onConfirm={doConfirm}
        />
      ) : null}

      <ToastHost />
    </div>
  );
}
