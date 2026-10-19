"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { getCalendarSync, type CalendarSyncConfig } from "@/lib/api/calendar-sync";
import { calendarConnectionError, providerSlug } from "@/lib/api/calendar-connections";
import {
  useCalendarConnections,
  useCalendarSyncs,
  useDisconnectCalendar,
  useSetCalendarTarget,
  useStartCalendarConnection,
  useSyncCalendarNow,
  useCreateCalendarSync,
  useDeleteCalendarSync,
  useGroups,
  useRegenerateCalendarSyncToken,
  useUpdateCalendarSync,
  useVacations,
} from "@/lib/api/queries";
import { useSession } from "@/lib/auth-client";
import { rememberConnectProvider } from "@/lib/calendar-sync/connect-callback";
import {
  configToBuilder,
  liveTeamIds,
  newBuilderConfig,
  type BuilderConfig,
} from "@/lib/calendar-sync/meta";
import { useTranslation } from "@/lib/i18n/use-translation";
import { CalBuilder, type MonthContext } from "./cal-builder";
import { CalCard } from "./cal-card";
import { ConfirmDialog, type ConfirmKind } from "./confirm-dialog";
import { ConnectCallbackNotice, connectionErrorMessage } from "./connect-callback-notice";
import { providerName, type ConnectHandlers } from "./connect-section";
import { EmptyState } from "./empty-state";
import { pushToast } from "@/components/toast";

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
  const connectionsQ = useCalendarConnections();
  const startM = useStartCalendarConnection();
  const disconnectM = useDisconnectCalendar();
  const setTargetM = useSetCalendarTarget();
  const syncNowM = useSyncCalendarNow();
  // `isPending` drops before the consent page loads, so a second click could start a second round.
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    // Back from the consent page can restore this page from the bfcache with `leaving` still set.
    const restore = (e: PageTransitionEvent) => {
      if (e.persisted) setLeaving(false);
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);

  const [modal, setModal] = useState<{ initial: BuilderConfig; isNew: boolean } | null>(null);
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; config: CalendarSyncConfig } | null>(
    null
  );

  const configs = configsQ.data ?? [];
  const groups = groupsQ.data ?? [];
  const vacations = vacationsQ.data ?? [];

  const teamsLabel = (config: CalendarSyncConfig): string => {
    const ids = groupsQ.data ? liveTeamIds(config.teamIds, groups) : config.teamIds;
    if (groups.length > 1 && ids.length === groups.length) return t.calSync.allTeams;
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

  const failToast = (e: unknown) =>
    pushToast(connectionErrorMessage(calendarConnectionError(e), t), "danger");

  const connect: ConnectHandlers = {
    providers: connectionsQ.data?.providers ?? { google: false, microsoft: false },
    connectDisabled: startM.isPending || leaving,
    onConnect: (config, provider) => {
      rememberConnectProvider(provider);
      startM.mutate(
        { provider, configId: config.id },
        { onSuccess: () => setLeaving(true), onError: failToast }
      );
    },
    onSyncNow: (config) =>
      syncNowM.mutate(config.id, {
        onSuccess: () => pushToast(t.calSync.connect.toasts.syncStarted),
        onError: failToast,
      }),
    onDisconnect: (config) => setConfirm({ kind: "disconnect", config }),
    onTimeZoneChange: (config, timeZone) =>
      setTargetM.mutateAsync({ configId: config.id, timeZone }).then(
        () => pushToast(t.calSync.connect.toasts.timeZoneSaved),
        () => pushToast(t.calSync.connect.toasts.timeZoneFailed, "danger")
      ),
  };

  const confirmName = (c: { kind: ConfirmKind; config: CalendarSyncConfig }) =>
    c.kind === "disconnect" && c.config.target
      ? providerName(c.config.target.provider)
      : c.config.name;

  const doConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.kind === "disconnect") {
        const target = confirm.config.target;
        if (target) {
          await disconnectM.mutateAsync(providerSlug(target.provider));
          pushToast(t.calSync.connect.toasts.disconnected(providerName(target.provider)));
        }
      } else if (confirm.kind === "delete") {
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
              connect={connect}
            />
          ))}
        </div>
      )}

      <Suspense fallback={null}>
        <ConnectCallbackNotice />
      </Suspense>

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
          name={confirmName(confirm)}
          syncedCount={
            configs.filter((c) => c.target?.provider === confirm.config.target?.provider).length
          }
          busy={deleteM.isPending || regenM.isPending || disconnectM.isPending}
          onClose={() => setConfirm(null)}
          onConfirm={doConfirm}
        />
      ) : null}
    </div>
  );
}
