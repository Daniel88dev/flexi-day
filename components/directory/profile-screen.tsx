"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DirectoryLapsedBanner } from "@/components/directory/directory-lapsed-banner";
import { DirectoryMarkers } from "@/components/directory/directory-markers";
import { PersonAvatar } from "@/components/directory/person-avatar";
import { ApiError } from "@/lib/api/client";
import type { DirectoryProfile } from "@/lib/api/directory";
import { useDirectoryOrganizations, useDirectoryProfile } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Layout B: a header with the photo, name and the viewer's actions, then tabs.
 * A Section the viewer can't read is left out, with no stub, and a tab with
 * nothing to show is left out too.
 */
export function ProfileScreen() {
  const { t } = useTranslation();
  const search = useSearchParams();
  const organizationId = search.get("organizationId") ?? "";
  const employmentId = search.get("employmentId") ?? "";
  const profile = useDirectoryProfile(organizationId, employmentId);
  const organization = useDirectoryOrganizations().data?.find(
    (entry) => entry.organizationId === organizationId
  );

  const back = (
    <p className="text-muted-foreground text-xs">
      <Link
        href={`/directory?organizationId=${encodeURIComponent(organizationId)}`}
        className="hover:text-foreground inline-flex items-center gap-1 hover:underline"
      >
        <ChevronLeft className="h-3 w-3" aria-hidden />
        {t.directory.profile.back}
      </Link>
    </p>
  );

  if (profile.error) {
    const missing =
      profile.error instanceof ApiError && [403, 404, 409].includes(profile.error.status);
    return (
      <div className="space-y-4">
        {back}
        <p className={missing ? "text-muted-foreground text-sm" : "text-destructive text-sm"}>
          {missing ? t.directory.profile.notFound : t.directory.profile.loadFailed}
        </p>
      </div>
    );
  }
  if (!profile.data) {
    return <p className="text-muted-foreground text-sm">{t.common.loading}</p>;
  }

  return (
    <div className="space-y-6">
      {back}
      {organization ? <DirectoryLapsedBanner organization={organization} /> : null}
      <ProfileHeader profile={profile.data} />
      <ProfileTabs profile={profile.data} />
    </div>
  );
}

function ProfileHeader({ profile }: { profile: DirectoryProfile }) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-4 py-5">
        <PersonAvatar person={profile} size={72} />
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="font-heading truncate text-2xl font-bold">{profile.name}</h1>
          <DirectoryMarkers markers={profile.markers} />
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileTabs({ profile }: { profile: DirectoryProfile }) {
  const { t } = useTranslation();
  const copy = t.directory.profile;
  const { sections, account } = profile;
  const hasRecord = !!sections.job || !!account;

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">{copy.overview}</TabsTrigger>
        {hasRecord ? <TabsTrigger value="record">{copy.record}</TabsTrigger> : null}
      </TabsList>
      <TabsContent value="overview" className="space-y-4 pt-4">
        {sections.card ? (
          <ProfileSection title={copy.card}>
            <Facts rows={[[copy.name, profile.name]]} />
          </ProfileSection>
        ) : null}
        {sections.workContact ? (
          <ProfileSection title={copy.workContact}>
            <p className="text-muted-foreground text-sm">{copy.noWorkContact}</p>
          </ProfileSection>
        ) : null}
      </TabsContent>
      {hasRecord ? (
        <TabsContent value="record" className="space-y-4 pt-4">
          <RecordTab profile={profile} />
        </TabsContent>
      ) : null}
    </Tabs>
  );
}

function RecordTab({ profile }: { profile: DirectoryProfile }) {
  const { t } = useTranslation();
  const copy = t.directory.profile;
  const date = (value: string) => new Date(value).toLocaleDateString(t.common.dateLocale);
  const spell = profile.sections.job?.spell;
  const account = profile.account;

  return (
    <>
      {spell ? (
        <ProfileSection title={copy.spell}>
          <Facts
            rows={[
              [copy.started, date(spell.startedAt)],
              [copy.ended, spell.endedAt ? date(spell.endedAt) : copy.current],
            ]}
          />
        </ProfileSection>
      ) : null}
      {account ? (
        <ProfileSection title={copy.account}>
          <Facts
            rows={[
              [copy.accountStatus, copy.accountStatuses[account.status]],
              [copy.signInEmail, account.signInEmail ?? "—"],
              [
                copy.directoryRoles,
                account.directoryRoles.length
                  ? account.directoryRoles.map((role) => copy.directoryRoleNames[role]).join(", ")
                  : copy.noDirectoryRoles,
              ],
            ]}
          />
        </ProfileSection>
      ) : null}
    </>
  );
}

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  const id = `profile-section-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <Card role="region" aria-labelledby={id}>
      <CardContent className="space-y-3 py-5">
        <h2 id={id} className="font-heading text-base font-semibold">
          {title}
        </h2>
        {children}
      </CardContent>
    </Card>
  );
}

function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
