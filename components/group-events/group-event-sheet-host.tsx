"use client";

import { useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { errorCode } from "@/lib/api/client";
import type { GroupEventScope } from "@/lib/api/group-events";
import type { IsoDate } from "@/lib/api/types";
import {
  invalidateGroupEventDependants,
  useCreateGroupEvent,
  useDeleteGroupEvent,
  useGroupEventGroups,
  useGroupEventImpact,
  useUpdateGroupEvent,
} from "@/lib/api/queries";
import type { GroupEventTarget } from "@/lib/group-events/day-items";
import {
  blankDraft,
  createInput,
  draftFromEvent,
  draftProblem,
  editRequest,
  createGroups,
  moveOccurrence,
  previewDates,
  ruleChanged,
  withDates,
  type GroupEventDraft,
} from "@/lib/group-events/draft";
import { ruleSummary } from "@/lib/group-events/labels";
import {
  closeGroupEventSheet,
  groupEventSheetState,
  subscribeGroupEventSheet,
  type GroupEventSheetState,
} from "@/lib/group-events/sheet-store";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { useTranslation } from "@/lib/i18n/use-translation";
import { RepeatEditor } from "./repeat-editor";
import { ScopeDialog, initialScope } from "./scope-dialog";

const PLAN_REQUIRED = "GROUP_EVENTS_PLAN_REQUIRED";

function useWriteError() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  return (error: unknown): string => {
    if (errorCode(error) === PLAN_REQUIRED) {
      // The create rights went stale; refetch them so every create entry follows.
      void invalidateGroupEventDependants(qc);
      return t.groupEvents.planRequired;
    }
    return error instanceof Error ? error.message : String(error);
  };
}

function useCreateGroups(draft: GroupEventDraft, requested: string | null | undefined) {
  const groupsQuery = useGroupEventGroups();
  return {
    pending: groupsQuery.isPending,
    ...createGroups(groupsQuery.data ?? [], draft.groupId, requested),
  };
}

function GroupField({
  draft,
  requestedGroupId,
  onChange,
}: {
  draft: GroupEventDraft;
  requestedGroupId: string | null | undefined;
  onChange: (groupId: string) => void;
}) {
  const { t } = useTranslation();
  const { pending, creatable, selected } = useCreateGroups(draft, requestedGroupId);
  if (pending) return null;

  if (creatable.length > 1) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor="ge-group">{t.groupEvents.group}</Label>
        <Select value={selected?.groupId ?? ""} onValueChange={onChange}>
          <SelectTrigger id="ge-group" className="w-full" aria-label={t.groupEvents.group}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {creatable.map((g) => (
              <SelectItem key={g.groupId} value={g.groupId}>
                {g.groupName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <dl className="space-y-1.5">
      <dt className="text-sm leading-none font-medium">{t.groupEvents.group}</dt>
      {selected ? (
        <dd className="text-sm font-semibold">{selected.groupName}</dd>
      ) : (
        <dd className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t.groupEvents.noGroup}
        </dd>
      )}
    </dl>
  );
}

function EventFields({
  draft,
  onChange,
  groupField,
  recurringEdit = false,
  preview,
}: {
  draft: GroupEventDraft;
  onChange: (draft: GroupEventDraft) => void;
  groupField?: React.ReactNode;
  /** Editing a recurring group event: a moved date carries its rule, and the end stays on the start. */
  recurringEdit?: boolean;
  preview?: readonly IsoDate[];
}) {
  const { t } = useTranslation();
  const labels = t.groupEvents;
  const multiDay = draft.startDate !== draft.endDate;
  const endLocked = recurringEdit && draft.repeat !== null;
  const set = (patch: Partial<GroupEventDraft>) => onChange({ ...draft, ...patch });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="ge-title">{labels.title}</Label>
        <Input
          id="ge-title"
          autoFocus
          value={draft.title}
          maxLength={100}
          onChange={(e) => set({ title: e.target.value })}
        />
      </div>

      {groupField}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ge-start">{multiDay ? labels.from : labels.date}</Label>
          <Input
            id="ge-start"
            type="date"
            value={draft.startDate}
            onChange={(e) =>
              e.target.value &&
              onChange(
                endLocked
                  ? moveOccurrence(draft, e.target.value)
                  : withDates(draft, { startDate: e.target.value })
              )
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ge-end">{labels.until}</Label>
          <Input
            id="ge-end"
            type="date"
            min={draft.startDate}
            value={draft.endDate}
            disabled={endLocked}
            aria-describedby={endLocked ? "ge-end-locked" : undefined}
            onChange={(e) =>
              e.target.value && onChange(withDates(draft, { endDate: e.target.value }))
            }
          />
        </div>
      </div>
      {endLocked ? (
        <p
          id="ge-end-locked"
          className="-mt-2 text-[12.5px]"
          style={{ color: "var(--text-muted)" }}
        >
          {labels.repeat.oneDayOnly}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="ge-allday" className="font-normal">
          {t.calendar.groupEvent.allDay}
        </Label>
        <Switch
          id="ge-allday"
          checked={draft.allDay}
          onCheckedChange={(allDay) => set({ allDay })}
        />
      </div>

      {!draft.allDay ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ge-from">{labels.starts}</Label>
            <Input
              id="ge-from"
              type="time"
              value={draft.startTime}
              onChange={(e) => e.target.value && set({ startTime: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ge-to">{labels.ends}</Label>
            <Input
              id="ge-to"
              type="time"
              value={draft.endTime}
              onChange={(e) => e.target.value && set({ endTime: e.target.value })}
            />
          </div>
        </div>
      ) : null}

      <RepeatEditor
        start={draft.startDate}
        value={draft.repeat}
        onChange={(repeat) => set({ repeat })}
        disabledReason={multiDay ? labels.repeat.oneDayOnly : null}
        preview={preview}
      />

      <div className="space-y-1.5">
        <Label htmlFor="ge-note">{labels.note}</Label>
        <Textarea
          id="ge-note"
          rows={2}
          maxLength={1000}
          value={draft.note}
          placeholder={labels.optional}
          onChange={(e) => set({ note: e.target.value })}
        />
      </div>
    </div>
  );
}

function problemText(draft: GroupEventDraft, t: Dictionary): string | null {
  const problem = draftProblem(draft);
  return problem ? t.groupEvents.problems[problem] : null;
}

function SheetFrame({
  title,
  description,
  problem,
  error,
  busy,
  saveLabel,
  onSave,
  children,
}: {
  title: string;
  description?: string;
  problem: string | null;
  error: string | null;
  busy: boolean;
  saveLabel: string;
  onSave: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Sheet open onOpenChange={(open) => !open && !busy && closeGroupEventSheet()}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className={description ? undefined : "sr-only"}>
            {description ?? title}
          </SheetDescription>
        </SheetHeader>
        <form
          id="group-event-form"
          className="flex-1 overflow-y-auto p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!problem && !busy) onSave();
          }}
        >
          {children}
        </form>
        <SheetFooter className="border-t">
          {error ? <p className="text-destructive text-[12.5px]">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => closeGroupEventSheet()} disabled={busy}>
              {t.groupEvents.cancel}
            </Button>
            <Button
              type="submit"
              form="group-event-form"
              disabled={Boolean(problem) || busy}
              title={problem ?? undefined}
            >
              {saveLabel}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function CreateSheet({ state }: { state: Extract<GroupEventSheetState, { kind: "create" }> }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(() => blankDraft(state.date, null));
  const [error, setError] = useState<string | null>(null);
  const groupId = useCreateGroups(draft, state.groupId).selected?.groupId ?? null;
  const create = useCreateGroupEvent();
  const writeError = useWriteError();
  const full = { ...draft, groupId };

  async function save() {
    setError(null);
    try {
      const row = await create.mutateAsync(createInput(full));
      closeGroupEventSheet();
      state.onCreated?.(row);
    } catch (e) {
      setError(writeError(e));
    }
  }

  return (
    <SheetFrame
      title={t.groupEvents.newTitle}
      problem={problemText(full, t)}
      error={error}
      busy={create.isPending}
      saveLabel={t.groupEvents.create}
      onSave={save}
    >
      <EventFields
        draft={draft}
        onChange={setDraft}
        groupField={
          <GroupField
            draft={draft}
            requestedGroupId={state.groupId}
            onChange={(id) => setDraft({ ...draft, groupId: id })}
          />
        }
      />
    </SheetFrame>
  );
}

function EditScopeDialog({
  target,
  draft,
  scope,
  onScopeChange,
  followingAllowed,
  busy,
  onCancel,
  onConfirm,
}: {
  target: GroupEventTarget;
  draft: GroupEventDraft;
  scope: GroupEventScope;
  onScopeChange: (scope: GroupEventScope) => void;
  followingAllowed: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (scope: GroupEventScope | undefined) => void;
}) {
  const { t } = useTranslation();
  // "This event" never drops a one-off change; the other two may.
  const asks = scope !== "this";
  const impact = useGroupEventImpact(target.event.id, editRequest(target, draft, scope), asks);

  return (
    <ScopeDialog
      action="edit"
      title={target.event.title}
      occurrenceDate={target.occurrenceDate}
      recurring
      scope={scope}
      onScopeChange={onScopeChange}
      ruleChanged={ruleChanged(target, draft)}
      followingDisabledReason={followingAllowed ? null : t.groupEvents.scope.followingNeedsPlan}
      busy={busy}
      checking={asks && impact.isPending}
      impactFailed={asks && impact.isError}
      onRetryImpact={() => void impact.refetch()}
      dropped={asks ? impact.data?.droppedOneOffs : undefined}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

function EditSheet({ target }: { target: GroupEventTarget }) {
  const { t } = useTranslation();
  const { event } = target;
  const [draft, setDraft] = useState(() => draftFromEvent(event, target.occurrenceDate));
  const [error, setError] = useState<string | null>(null);
  // Set while the scope question is open; the preview follows it.
  const [scope, setScope] = useState<GroupEventScope | null>(null);
  const update = useUpdateGroupEvent();
  const writeError = useWriteError();
  const groupsQuery = useGroupEventGroups();
  // "This and following" starts a new group event, which needs the group's create right.
  const followingAllowed =
    groupsQuery.data?.find((g) => g.groupId === event.groupId)?.canCreate !== false;

  async function apply(chosen: GroupEventScope | undefined) {
    setError(null);
    try {
      await update.mutateAsync({ id: event.id, request: editRequest(target, draft, chosen) });
      closeGroupEventSheet();
    } catch (e) {
      setScope(null);
      setError(writeError(e));
    }
  }

  return (
    <SheetFrame
      title={t.groupEvents.editTitle}
      description={
        event.repeat
          ? `${event.groupName} · ${ruleSummary(event.startDate, event.repeat, t)}`
          : event.groupName
      }
      problem={problemText(draft, t)}
      error={error}
      busy={update.isPending}
      saveLabel={t.groupEvents.save}
      onSave={() =>
        event.repeat
          ? setScope(initialScope(ruleChanged(target, draft), followingAllowed))
          : void apply(undefined)
      }
    >
      <EventFields
        draft={draft}
        onChange={setDraft}
        recurringEdit={Boolean(event.repeat)}
        preview={event.repeat ? previewDates(target, draft, scope) : undefined}
      />
      {scope ? (
        <EditScopeDialog
          target={target}
          draft={draft}
          scope={scope}
          onScopeChange={setScope}
          followingAllowed={followingAllowed}
          busy={update.isPending}
          onCancel={() => setScope(null)}
          onConfirm={(chosen) => void apply(chosen)}
        />
      ) : null}
    </SheetFrame>
  );
}

function DeleteDialog({ target }: { target: GroupEventTarget }) {
  const { event, occurrenceDate } = target;
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<GroupEventScope>("this");
  const remove = useDeleteGroupEvent();
  const writeError = useWriteError();

  async function confirm(scope: GroupEventScope | undefined) {
    setError(null);
    try {
      await remove.mutateAsync({
        id: event.id,
        request: scope ? { scope, occurrenceDate } : {},
      });
      closeGroupEventSheet();
    } catch (e) {
      setError(writeError(e));
    }
  }

  return (
    <ScopeDialog
      action="delete"
      title={event.title}
      occurrenceDate={occurrenceDate}
      recurring={Boolean(event.repeat)}
      scope={scope}
      onScopeChange={setScope}
      busy={remove.isPending}
      error={error}
      onCancel={() => closeGroupEventSheet()}
      onConfirm={(scope) => void confirm(scope)}
    />
  );
}

/**
 * The group event sheet and its dialogs for the whole app. Mounted once in the app layout; any
 * page opens it through `openGroupEventSheet`, `openGroupEventEditor` or `confirmGroupEventDelete`.
 */
export function GroupEventSheetHost() {
  const state = useSyncExternalStore(subscribeGroupEventSheet, groupEventSheetState, () => null);
  if (!state) return null;
  if (state.kind === "create") return <CreateSheet key={state.id} state={state} />;
  if (state.kind === "edit") return <EditSheet key={state.id} target={state.target} />;
  return <DeleteDialog key={state.id} target={state.target} />;
}
