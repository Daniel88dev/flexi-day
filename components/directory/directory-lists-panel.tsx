"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorCopy } from "@/lib/api/client";
import type { DirectoryListEntry, DirectoryListKind } from "@/lib/api/directory-lists";
import {
  useAddDirectoryListEntry,
  useDeleteDirectoryListEntry,
  useDirectoryList,
  useUpdateDirectoryListEntry,
} from "@/lib/api/queries";
import { countryOptions } from "@/lib/directory/phone";
import { LapsedNote } from "@/components/directory/directory-lapsed-banner";
import { useTranslation } from "@/lib/i18n/use-translation";
import { SelectField } from "@/components/directory/form-fields";

/** Departments and Locations: add, rename, archive, and delete while unused. */
export function DirectoryListsPanel({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const copy = t.directory.settings.listsPanel;
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{copy.intro}</p>
      <ListCard organizationId={organizationId} kind="departments" />
      <ListCard organizationId={organizationId} kind="locations" />
    </div>
  );
}

function ListCard({ organizationId, kind }: { organizationId: string; kind: DirectoryListKind }) {
  const { t, locale } = useTranslation();
  const copy = t.directory.settings.listsPanel;
  const list = useDirectoryList(organizationId, kind);
  const add = useAddDirectoryListEntry(organizationId, kind);
  const update = useUpdateDirectoryListEntry(organizationId, kind);
  const remove = useDeleteDirectoryListEntry(organizationId, kind);
  const countries = useMemo(() => countryOptions(locale), [locale]);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const locations = kind === "locations";
  const title = locations ? copy.locations : copy.departments;
  const newLabel = locations ? copy.newLocation : copy.newDepartment;
  const failure = add.error ?? update.error ?? remove.error;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim() === "") return;
    add.mutate(
      { name: name.trim(), ...(locations && country !== "" && { country }) },
      {
        onSuccess: () => {
          setName("");
          setCountry("");
        },
      }
    );
  };

  const body = () => {
    if (list.error) return <p className="text-destructive text-sm">{copy.loadFailed}</p>;
    if (!list.data) return <p className="text-muted-foreground text-sm">{t.common.loading}</p>;
    if (list.data.entries.length === 0) {
      return <p className="text-muted-foreground text-sm">{copy.empty}</p>;
    }
    return (
      <ul className="divide-border divide-y text-sm" aria-label={title}>
        {list.data.entries.map((entry) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            editable={list.data.editable}
            writable={list.data.writable}
            busy={update.isPending || remove.isPending}
            onChange={(change) => update.mutate({ entryId: entry.id, change })}
            onDelete={() => remove.mutate(entry.id)}
          />
        ))}
      </ul>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {list.data && !list.data.editable ? (
          <CardDescription>{copy.readOnlyNote}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {list.data?.editable && !list.data.writable ? (
          <LapsedNote>{copy.lapsedNote}</LapsedNote>
        ) : null}
        {failure ? (
          <p role="alert" className="text-destructive text-sm">
            {errorCopy(failure, copy.errors, copy.saveFailed)}
          </p>
        ) : null}
        {body()}
        {list.data?.editable ? (
          <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
            <div className="min-w-48 flex-1 space-y-1">
              <Label htmlFor={`new-${kind}`}>{newLabel}</Label>
              <Input
                id={`new-${kind}`}
                value={name}
                maxLength={100}
                disabled={!list.data.writable}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            {locations ? (
              <div className="space-y-1">
                <Label htmlFor="new-location-country">{copy.countryLabel}</Label>
                <SelectField
                  id="new-location-country"
                  className="w-auto"
                  value={country}
                  disabled={!list.data.writable}
                  onChange={setCountry}
                >
                  <option value="">{copy.noCountry}</option>
                  {countries.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
              </div>
            ) : null}
            <Button
              type="submit"
              disabled={!list.data.writable || name.trim() === "" || add.isPending}
            >
              {copy.add}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EntryRow({
  entry,
  editable,
  writable,
  busy,
  onChange,
  onDelete,
}: {
  entry: DirectoryListEntry;
  editable: boolean;
  writable: boolean;
  busy: boolean;
  onChange: (change: { name?: string; archived?: boolean }) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const copy = t.directory.settings.listsPanel;
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(entry.name);

  if (renaming) {
    const save = (event: FormEvent) => {
      event.preventDefault();
      if (name.trim() !== "" && name.trim() !== entry.name) onChange({ name: name.trim() });
      setRenaming(false);
    };
    return (
      <li className="py-2">
        <form onSubmit={save} className="flex flex-wrap items-center gap-2">
          <Input
            aria-label={copy.renameLabel(entry.name)}
            value={name}
            maxLength={100}
            className="max-w-xs"
            onChange={(event) => setName(event.target.value)}
          />
          <Button type="submit" size="sm">
            {t.common.save}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setRenaming(false)}>
            {t.common.cancel}
          </Button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-2 py-2" data-testid={`list-entry-${entry.id}`}>
      <span className={entry.archived ? "text-muted-foreground font-medium" : "font-medium"}>
        {entry.name}
      </span>
      {entry.country ? <span className="text-muted-foreground">{entry.country.name}</span> : null}
      {entry.archived ? <Badge variant="outline">{copy.archivedBadge}</Badge> : null}
      {entry.inUse ? <Badge variant="secondary">{copy.inUse}</Badge> : null}
      {editable ? (
        <span className="ml-auto flex flex-wrap gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setName(entry.name);
              setRenaming(true);
            }}
          >
            {copy.rename}
          </Button>
          {entry.archived ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy || !writable}
              onClick={() => onChange({ archived: false })}
            >
              {copy.restore}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => onChange({ archived: true })}
            >
              {copy.archive}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            disabled={busy || entry.inUse}
            title={entry.inUse ? copy.inUseHint : undefined}
            onClick={onDelete}
          >
            {copy.delete}
          </Button>
        </span>
      ) : null}
    </li>
  );
}
