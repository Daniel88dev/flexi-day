"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyPreviousSpellBanner } from "@/components/directory/copy-previous-spell";
import { DirectoryLapsedBanner } from "@/components/directory/directory-lapsed-banner";
import { DirectoryMarkers } from "@/components/directory/directory-markers";
import { PersonAvatar } from "@/components/directory/person-avatar";
import { hasProfileActions, ProfileActions } from "@/components/directory/profile-actions";
import { ProfileHistorySheet } from "@/components/directory/profile-history-sheet";
import { ProfileRetention } from "@/components/directory/profile-retention";
import {
  BackLink,
  EmailLink,
  Facts,
  PhoneLink,
  ProfileReadFailure,
} from "@/components/directory/profile-parts";
import { ContactTab, PersonalTab } from "@/components/directory/sensitive-section";
import type { DirectoryProfile } from "@/lib/api/directory";
import {
  useDirectoryOrganizations,
  useDirectoryProfile,
  useOrganizationTimeZone,
} from "@/lib/api/queries";
import { entryLabel } from "@/lib/directory/entries";
import { formatDay, formatEmploymentDay } from "@/lib/directory/format";
import { isExternalWorker } from "@/lib/directory/person";
import { directoryHref, profileEditHref, profileHref } from "@/lib/directory/routes";
import { writesAnySection } from "@/lib/directory/sections";
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

  const back = <BackLink href={directoryHref(organizationId)}>{t.directory.profile.back}</BackLink>;

  if (profile.error) return <ProfileReadFailure error={profile.error} back={back} />;
  if (!profile.data) {
    return <p className="text-muted-foreground text-sm">{t.common.loading}</p>;
  }

  return (
    <div className="space-y-6">
      {back}
      {organization ? <DirectoryLapsedBanner organization={organization} /> : null}
      <CopyPreviousSpellBanner profile={profile.data} organization={organization} />
      <ProfileHeader profile={profile.data} />
      <ProfileTabs profile={profile.data} />
    </div>
  );
}

function ProfileHeader({ profile }: { profile: DirectoryProfile }) {
  const { t } = useTranslation();
  const jobTitle = profile.sections.card?.jobTitle;
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-4 py-5">
        <PersonAvatar
          person={profile}
          photoUrl={profile.sections.photo?.photo?.fullUrl}
          size={72}
        />
        <div className="min-w-48 flex-1 space-y-1">
          <h1 className="font-heading truncate text-2xl font-bold">{profile.name}</h1>
          {jobTitle ? <p className="text-muted-foreground text-sm">{jobTitle}</p> : null}
          <DirectoryMarkers markers={profile.markers} />
        </div>
        {writesAnySection(profile) || profile.canReadHistory || hasProfileActions(profile) ? (
          <div className="flex flex-wrap gap-2">
            {writesAnySection(profile) ? (
              <Button asChild variant="outline" size="sm">
                <Link href={profileEditHref(profile.organizationId, profile.employmentId)}>
                  <Pencil className="h-4 w-4" aria-hidden />
                  {t.directory.profile.edit}
                </Link>
              </Button>
            ) : null}
            {profile.canReadHistory ? <ProfileHistorySheet profile={profile} /> : null}
            <ProfileActions profile={profile} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ProfileTabs({ profile }: { profile: DirectoryProfile }) {
  const { t } = useTranslation();
  const copy = t.directory.profile;
  const { sections, account } = profile;
  const hasRecord = !!sections.job || !!account;
  const card = sections.card;

  return (
    <Tabs defaultValue="overview">
      <TabsList className="h-auto max-w-full flex-wrap">
        <TabsTrigger value="overview">{copy.overview}</TabsTrigger>
        {sections.job ? <TabsTrigger value="job">{copy.job}</TabsTrigger> : null}
        {sections.contact ? <TabsTrigger value="contact">{copy.contact}</TabsTrigger> : null}
        {sections.personal ? <TabsTrigger value="personal">{copy.personal}</TabsTrigger> : null}
        {hasRecord ? <TabsTrigger value="record">{copy.record}</TabsTrigger> : null}
      </TabsList>
      <TabsContent value="overview" className="space-y-4 pt-4">
        {profile.retention ? (
          <ProfileSection title={t.directory.retention.title}>
            <ProfileRetention profile={profile} />
          </ProfileSection>
        ) : null}
        {card ? (
          <ProfileSection title={copy.card}>
            <Facts
              rows={[
                [copy.name, profile.name],
                [copy.jobTitle, card.jobTitle ?? copy.notSet],
                [
                  copy.department,
                  card.department
                    ? entryLabel(card.department, t.directory.archivedEntry)
                    : copy.notSet,
                ],
                [
                  copy.location,
                  card.location
                    ? [
                        entryLabel(card.location, t.directory.archivedEntry),
                        card.location.country?.name,
                      ]
                        .filter(Boolean)
                        .join(", ")
                    : copy.notSet,
                ],
                [
                  copy.reportsTo,
                  card.reportsTo?.name ? (
                    <Link
                      key="reports-to"
                      href={profileHref(profile.organizationId, card.reportsTo.employmentId)}
                      className="text-primary hover:underline"
                    >
                      {card.reportsTo.name}
                    </Link>
                  ) : (
                    copy.notSet
                  ),
                ],
              ]}
            />
          </ProfileSection>
        ) : null}
        {sections.workContact ? (
          <ProfileSection title={copy.workContact}>
            <WorkContactFacts workContact={sections.workContact} />
          </ProfileSection>
        ) : null}
      </TabsContent>
      {sections.job ? (
        <TabsContent value="job" className="space-y-4 pt-4">
          <JobTab profile={profile} />
        </TabsContent>
      ) : null}
      {sections.contact ? (
        <TabsContent value="contact" className="space-y-4 pt-4">
          <ProfileSection title={copy.contact}>
            <ContactTab profile={profile} />
          </ProfileSection>
        </TabsContent>
      ) : null}
      {sections.personal ? (
        <TabsContent value="personal" className="space-y-4 pt-4">
          <ProfileSection title={copy.personal}>
            <PersonalTab profile={profile} />
          </ProfileSection>
        </TabsContent>
      ) : null}
      {hasRecord ? (
        <TabsContent value="record" className="space-y-4 pt-4">
          <RecordTab profile={profile} />
        </TabsContent>
      ) : null}
    </Tabs>
  );
}

function WorkContactFacts({
  workContact,
}: {
  workContact: NonNullable<DirectoryProfile["sections"]["workContact"]>;
}) {
  const { t } = useTranslation();
  const copy = t.directory.profile;
  const { workEmail, workPhone } = workContact;
  if (!workEmail && !workPhone) {
    return <p className="text-muted-foreground text-sm">{copy.noWorkContact}</p>;
  }
  return (
    <Facts
      rows={[
        [
          copy.workEmail,
          workEmail ? <EmailLink key="work-email" email={workEmail} /> : copy.notSet,
        ],
        [
          copy.workPhone,
          workPhone ? <PhoneLink key="work-phone" phone={workPhone} /> : copy.notSet,
        ],
      ]}
    />
  );
}

function JobTab({ profile }: { profile: DirectoryProfile }) {
  const { t } = useTranslation();
  const copy = t.directory.profile;
  const job = profile.sections.job!;
  const day = (value: string | null) =>
    value ? formatDay(value, t.common.dateLocale) : copy.notSet;
  const rows: [string, ReactNode][] = [];
  if (job.legalName) rows.push([copy.legalName, job.legalName]);
  rows.push([copy.employeeNumber, job.employeeNumber ?? copy.notSet]);
  rows.push([copy.startDate, day(job.startDate)]);
  if (!isExternalWorker(profile)) rows.push([copy.probationEndDate, day(job.probationEndDate)]);
  rows.push([copy.leavingDate, day(job.leavingDate)]);
  if (!isExternalWorker(profile)) {
    rows.push([
      copy.contractType,
      job.contractType ? copy.contractTypes[job.contractType] : copy.notSet,
    ]);
    rows.push([
      copy.workingTime,
      job.workingTime ? copy.workingTimes[job.workingTime] : copy.notSet,
    ]);
  }
  return (
    <ProfileSection title={copy.job}>
      <Facts rows={rows} />
    </ProfileSection>
  );
}

function RecordTab({ profile }: { profile: DirectoryProfile }) {
  const { t } = useTranslation();
  const copy = t.directory.profile;
  const timeZone = useOrganizationTimeZone(profile.organizationId);
  const date = (value: string) => formatEmploymentDay(value, t.common.dateLocale, timeZone);
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
