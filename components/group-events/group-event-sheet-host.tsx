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
import { ScopeDialog } from "./scope-dialog";

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
  const groupsQuery = useGroupEventGroups();
  const creatable = (groupsQuery.data ?? []).filter((g) => g.canCreate);
  if (groupsQuery.isPending) return null;
  const selected =
    creatable.find((g) => g.groupId === (draft.groupId ?? requestedGroupId)) ?? creatable[0];

  return (
    <div className="space-y-1.5">
      <Label htmlFor="ge-group">{t.groupEvents.group}</Label>
      {creatable.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t.groupEvents.noGroup}
        </p>
      ) : creatable.length === 1 ? (
        <p id="ge-group" className="text-sm font-semibold">
          {creatable[0].groupName}
        </p>
      ) : (
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
      )}
    </div>
  );
}

/** The group the draft goes to: the one picked, else the requested one if it can create, else the first that can. */
function useCreateGroupId(draft: GroupEventDraft, requested: string | null | undefined) {
  const groupsQuery = useGroupEventGroups();
  const creatable = (groupsQuery.data ?? []).filter((g) => g.canCreate);
  return (
    creatable.find((g) => g.groupId === (draft.groupId ?? requested))?.groupId ??
    creatable[0]?.groupId ??
    null
  );
}

function EventFields({
  draft,
  onChange,
  groupField,
}: {
  draft: GroupEventDraft;
  onChange: (draft: GroupEventDraft) => void;
  groupField?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const labels = t.groupEvents;
  const multiDay = draft.startDate !== draft.endDate;
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
              e.target.value && onChange(withDates(draft, { startDate: e.target.value }))
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
            onChange={(e) =>
              e.target.value && onChange(withDates(draft, { endDate: e.target.value }))
            }
          />
        </div>
      </div>

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
  const groupId = useCreateGroupId(draft, state.groupId);
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
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  target: GroupEventTarget;
  draft: GroupEventDraft;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (scope: GroupEventScope | undefined) => void;
}) {
  const changed = ruleChanged(target.event, draft);
  const [scope, setScope] = useState<GroupEventScope>(changed ? "following" : "this");
  // "This event" never drops a one-off change; the other two may.
  const impact = useGroupEventImpact(
    target.event.id,
    editRequest(target, draft, scope),
    scope !== "this"
  );

  return (
    <ScopeDialog
      action="edit"
      title={target.event.title}
      occurrenceDate={target.occurrenceDate}
      recurring
      ruleChanged={changed}
      busy={busy}
      error={error}
      checking={scope !== "this" && impact.isPending}
      dropped={scope !== "this" ? impact.data?.droppedOneOffs : undefined}
      onScopeChange={setScope}
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
  const [asking, setAsking] = useState(false);
  const update = useUpdateGroupEvent();
  const writeError = useWriteError();

  async function apply(scope: GroupEventScope | undefined) {
    setError(null);
    try {
      await update.mutateAsync({ id: event.id, request: editRequest(target, draft, scope) });
      closeGroupEventSheet();
    } catch (e) {
      setAsking(false);
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
      onSave={() => (event.repeat ? setAsking(true) : void apply(undefined))}
    >
      <EventFields draft={draft} onChange={setDraft} />
      {asking ? (
        <EditScopeDialog
          target={target}
          draft={draft}
          busy={update.isPending}
          error={null}
          onCancel={() => setAsking(false)}
          onConfirm={(scope) => void apply(scope)}
        />
      ) : null}
    </SheetFrame>
  );
}

function DeleteDialog({ target }: { target: GroupEventTarget }) {
  const { event, occurrenceDate } = target;
  const [error, setError] = useState<string | null>(null);
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
