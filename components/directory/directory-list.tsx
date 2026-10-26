"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, Search, Settings, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DirectoryAgreementBanner } from "@/components/directory/directory-agreement-banner";
import { DirectoryLapsedBanner } from "@/components/directory/directory-lapsed-banner";
import { DirectoryMarkers } from "@/components/directory/directory-markers";
import { DirectorySettings } from "@/components/directory/directory-settings";
import { PersonAvatar } from "@/components/directory/person-avatar";
import type {
  DirectoryOrganization,
  DirectoryPerson,
  FormerDirectoryPerson,
} from "@/lib/api/directory";
import { useDirectoryPeople, useFormerDirectoryPeople } from "@/lib/api/queries";
import { matchesPerson, useDirectoryView } from "@/lib/directory/directory-view";
import { entryFilterOptions, entryLabel, matchesEntries } from "@/lib/directory/entries";
import type { DirectoryEntryRef } from "@/lib/api/directory-lists";
import { useTranslation } from "@/lib/i18n/use-translation";

export const profileHref = (organizationId: string, employmentId: string) =>
  `/directory/person?organizationId=${encodeURIComponent(organizationId)}&employmentId=${encodeURIComponent(employmentId)}`;

/** The directory of one Directory organization: People and, for the owner, org admins and HR, Former. */
export function DirectoryList({
  organization,
  organizations,
  onSelect,
}: {
  organization: DirectoryOrganization;
  organizations: DirectoryOrganization[];
  onSelect: (organizationId: string) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [noGroupOnly, setNoGroupOnly] = useState(false);
  const [filters, setFilters] = useState({ departmentId: "", locationId: "" });
  const [view, setView] = useDirectoryView();
  const people = useDirectoryPeople(organization.organizationId);
  const formerList = people.data?.formerList ?? false;
  const settings = people.data?.settings ?? false;
  const noGroupFilter = people.data?.noGroupFilter ?? false;
  const former = useFormerDirectoryPeople(organization.organizationId, formerList);
  const [chosenTab, setChosenTab] = useState("people");
  const tab =
    (chosenTab === "former" && !formerList) || (chosenTab === "settings" && !settings)
      ? "people"
      : chosenTab;

  const rows = [...(people.data?.people ?? []), ...(former.data ?? [])];
  const departmentOptions = entryFilterOptions(rows, "department");
  const locationOptions = entryFilterOptions(rows, "location");
  const filtered = <T extends DirectoryPerson>(list: T[] | undefined) =>
    list?.filter((person) => matchesEntries(person, filters));

  const peopleTab = (
    <PeopleView
      organizationId={organization.organizationId}
      people={filtered(
        noGroupFilter && noGroupOnly
          ? people.data?.people.filter((person) => person.noGroup)
          : people.data?.people
      )}
      loading={people.isLoading}
      failed={!!people.error}
      query={query}
      view={view}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">{t.directory.title}</h1>
        {organizations.length > 1 ? (
          <div
            role="group"
            aria-label={t.directory.organizationLabel}
            className="flex flex-wrap gap-1"
          >
            {organizations.map((entry) => (
              <Button
                key={entry.organizationId}
                size="sm"
                variant={
                  entry.organizationId === organization.organizationId ? "default" : "outline"
                }
                aria-pressed={entry.organizationId === organization.organizationId}
                onClick={() => onSelect(entry.organizationId)}
              >
                {entry.name}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      {organization.role === "OWNER" ? (
        <DirectoryAgreementBanner organizationId={organization.organizationId} />
      ) : null}
      <DirectoryLapsedBanner organization={organization} />

      {tab === "settings" ? null : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1 sm:max-w-sm">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              type="search"
              aria-label={t.directory.searchLabel}
              placeholder={t.directory.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
            />
          </div>
          <EntryFilter
            label={t.directory.departmentFilter}
            all={t.directory.allDepartments}
            options={departmentOptions}
            value={filters.departmentId}
            onChange={(departmentId) => setFilters((current) => ({ ...current, departmentId }))}
          />
          <EntryFilter
            label={t.directory.locationFilter}
            all={t.directory.allLocations}
            options={locationOptions}
            value={filters.locationId}
            onChange={(locationId) => setFilters((current) => ({ ...current, locationId }))}
          />
          {noGroupFilter && tab === "people" ? (
            <Button
              size="sm"
              variant={noGroupOnly ? "default" : "outline"}
              aria-pressed={noGroupOnly}
              onClick={() => setNoGroupOnly((on) => !on)}
            >
              {t.directory.noGroupFilter}
            </Button>
          ) : null}
          <div role="group" aria-label={t.directory.viewLabel} className="flex gap-1">
            <Button
              size="sm"
              variant={view === "cards" ? "default" : "outline"}
              aria-pressed={view === "cards"}
              onClick={() => setView("cards")}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              {t.directory.cards}
            </Button>
            <Button
              size="sm"
              variant={view === "table" ? "default" : "outline"}
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
            >
              <Table2 className="h-4 w-4" aria-hidden />
              {t.directory.table}
            </Button>
          </div>
        </div>
      )}

      {formerList || settings ? (
        <Tabs value={tab} onValueChange={setChosenTab}>
          <TabsList>
            <TabsTrigger value="people">{t.directory.people}</TabsTrigger>
            {formerList ? <TabsTrigger value="former">{t.directory.former}</TabsTrigger> : null}
            {settings ? (
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4" aria-hidden />
                {t.directory.settings.tab}
              </TabsTrigger>
            ) : null}
          </TabsList>
          <TabsContent value="people" className="pt-4">
            {peopleTab}
          </TabsContent>
          <TabsContent value="former" className="pt-4">
            <FormerView
              organizationId={organization.organizationId}
              former={filtered(former.data)}
              loading={former.isLoading}
              failed={!!former.error}
              query={query}
            />
          </TabsContent>
          {settings ? (
            <TabsContent value="settings" className="pt-4">
              <DirectorySettings organization={organization} />
            </TabsContent>
          ) : null}
        </Tabs>
      ) : (
        peopleTab
      )}
    </div>
  );
}

function EntryFilter({
  label,
  all,
  options,
  value,
  onChange,
}: {
  label: string;
  all: string;
  options: DirectoryEntryRef[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { t } = useTranslation();
  if (options.length === 0 && value === "") return null;
  return (
    <select
      aria-label={label}
      className="border-border bg-background h-8 rounded-md border px-2 text-sm"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{all}</option>
      {options.map((entry) => (
        <option key={entry.id} value={entry.id}>
          {entryLabel(entry, t.directory.archivedEntry)}
        </option>
      ))}
    </select>
  );
}

/** "Department · Location", either left out when unset. */
function CardEntries({ person }: { person: DirectoryPerson }) {
  const { t } = useTranslation();
  const parts = [person.department, person.location].flatMap((entry) =>
    entry ? [entryLabel(entry, t.directory.archivedEntry)] : []
  );
  if (parts.length === 0) return null;
  return <span className="text-muted-foreground block truncate text-xs">{parts.join(" · ")}</span>;
}

const entryText = (
  entry: DirectoryEntryRef | null | undefined,
  archived: (name: string) => string
) => (entry ? entryLabel(entry, archived) : "");

function ListState({ loading, failed }: { loading: boolean; failed: boolean }) {
  const { t } = useTranslation();
  if (failed) return <p className="text-destructive text-sm">{t.directory.loadFailed}</p>;
  if (loading) return <p className="text-muted-foreground text-sm">{t.common.loading}</p>;
  return null;
}

function EmptyState({ query, empty }: { query: string; empty: string }) {
  const { t } = useTranslation();
  return (
    <p className="text-muted-foreground py-6 text-center text-sm">
      {query.trim() ? t.directory.noMatches(query.trim()) : empty}
    </p>
  );
}

function PeopleView({
  organizationId,
  people,
  loading,
  failed,
  query,
  view,
}: {
  organizationId: string;
  people: DirectoryPerson[] | undefined;
  loading: boolean;
  failed: boolean;
  query: string;
  view: "cards" | "table";
}) {
  const { t } = useTranslation();
  if (!people) return <ListState loading={loading} failed={failed} />;
  const shown = people.filter((person) => matchesPerson(person, query));
  if (shown.length === 0) return <EmptyState query={query} empty={t.directory.noPeople} />;

  if (view === "table") {
    return (
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.directory.nameColumn}</TableHead>
              <TableHead>{t.directory.jobTitleColumn}</TableHead>
              <TableHead>{t.directory.departmentColumn}</TableHead>
              <TableHead>{t.directory.locationColumn}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((person) => (
              <TableRow key={person.employmentId}>
                <TableCell>
                  <PersonLink organizationId={organizationId} person={person} size={28} />
                </TableCell>
                <TableCell className="text-muted-foreground">{person.jobTitle ?? ""}</TableCell>
                <TableCell className="text-muted-foreground">
                  {entryText(person.department, t.directory.archivedEntry)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {entryText(person.location, t.directory.archivedEntry)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  }

  return (
    <ul data-testid="directory-cards" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {shown.map((person) => (
        <li key={person.employmentId}>
          <Link
            href={profileHref(organizationId, person.employmentId)}
            className="hover:border-primary/40 focus-visible:ring-ring flex items-center gap-3 rounded-[var(--radius)] border bg-[var(--card)] p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <PersonAvatar person={person} size={44} />
            <span className="min-w-0 space-y-1">
              <span className="block truncate font-semibold">{person.name}</span>
              {person.jobTitle ? (
                <span className="text-muted-foreground block truncate text-sm">
                  {person.jobTitle}
                </span>
              ) : null}
              <CardEntries person={person} />
              <DirectoryMarkers markers={person.markers} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PersonLink({
  organizationId,
  person,
  size,
}: {
  organizationId: string;
  person: DirectoryPerson;
  size: number;
}) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Link
        href={profileHref(organizationId, person.employmentId)}
        className="flex items-center gap-2 font-medium hover:underline"
      >
        <PersonAvatar person={person} size={size} />
        {person.name}
      </Link>
      <DirectoryMarkers markers={person.markers} />
    </span>
  );
}

function FormerView({
  organizationId,
  former,
  loading,
  failed,
  query,
}: {
  organizationId: string;
  former: FormerDirectoryPerson[] | undefined;
  loading: boolean;
  failed: boolean;
  query: string;
}) {
  const { t } = useTranslation();
  if (!former) return <ListState loading={loading} failed={failed} />;
  const shown = former
    .filter((person) => matchesPerson(person, query))
    .sort((a, b) => b.endedAt.localeCompare(a.endedAt));
  if (shown.length === 0) return <EmptyState query={query} empty={t.directory.noFormer} />;

  const date = (value: string) => new Date(value).toLocaleDateString(t.common.dateLocale);
  return (
    <Card>
      <Table data-testid="directory-former">
        <TableHeader>
          <TableRow>
            <TableHead>{t.directory.nameColumn}</TableHead>
            <TableHead>{t.directory.jobTitleColumn}</TableHead>
            <TableHead>{t.directory.departmentColumn}</TableHead>
            <TableHead>{t.directory.startedColumn}</TableHead>
            <TableHead>{t.directory.endedColumn}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((person) => (
            <TableRow key={person.employmentId}>
              <TableCell>
                <Link
                  href={profileHref(organizationId, person.employmentId)}
                  className="font-medium hover:underline"
                >
                  {person.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{person.jobTitle ?? ""}</TableCell>
              <TableCell className="text-muted-foreground">
                {entryText(person.department, t.directory.archivedEntry)}
              </TableCell>
              <TableCell>{date(person.startedAt)}</TableCell>
              <TableCell>
                <span className="flex flex-wrap items-center gap-2">
                  {date(person.endedAt)}
                  <DirectoryMarkers markers={person.markers} />
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
