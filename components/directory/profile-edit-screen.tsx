"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { DirectoryLapsedBanner } from "@/components/directory/directory-lapsed-banner";
import { PersonAvatar } from "@/components/directory/person-avatar";
import { profileHref } from "@/components/directory/directory-list";
import { ApiError, errorCode, errorCopy } from "@/lib/api/client";
import {
  CONTRACT_TYPES,
  WORKING_TIMES,
  type DirectoryProfile,
  type DirectorySectionLevel,
} from "@/lib/api/directory";
import {
  useDirectoryOrganizations,
  useDirectoryPeople,
  useDirectoryProfile,
  useRemoveProfilePhoto,
  useUpdateDirectoryProfile,
  useUploadProfilePhoto,
} from "@/lib/api/queries";
import { PHOTO_PICKER_ACCEPT, photoFileProblem } from "@/lib/directory/profile-photo";
import { cn } from "@/lib/utils";
import { phoneCountryOptions } from "@/lib/directory/phone";
import {
  buildProfilePatch,
  profileFormValues,
  workPhoneInvalid,
  type ProfileFormValues,
} from "@/lib/directory/profile-form";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * One edit page for the whole profile, with an anchor per Section. A Section
 * the viewer only reads is greyed, one they can't read is left out. On a
 * lapsed plan every field is disabled and a filled one offers Clear.
 */
export function ProfileEditScreen() {
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
        href={profileHref(organizationId, employmentId)}
        className="hover:text-foreground inline-flex items-center gap-1 hover:underline"
      >
        <ChevronLeft className="h-3 w-3" aria-hidden />
        {profile.data?.name ?? t.directory.profile.back}
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
  if (!profile.data || !organization) {
    return <p className="text-muted-foreground text-sm">{t.common.loading}</p>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      {back}
      <DirectoryLapsedBanner organization={organization} />
      <ProfileEditForm
        key={profile.data.employmentId}
        profile={profile.data}
        lapsed={!organization.writable}
      />
    </div>
  );
}

function ProfileEditForm({ profile, lapsed }: { profile: DirectoryProfile; lapsed: boolean }) {
  const { t, locale } = useTranslation();
  const copy = t.directory.edit;
  const labels = t.directory.profile;
  const router = useRouter();
  const update = useUpdateDirectoryProfile(profile.organizationId, profile.employmentId);
  const { card, photo, workContact, job } = profile.sections;
  const cardWrite = card?.level === "WRITE";
  const workContactWrite = workContact?.level === "WRITE";
  const jobWrite = job?.level === "WRITE";
  const nameEditable = cardWrite && !card?.nameFromAccount && !lapsed;
  const external = profile.markers.includes("EXTERNAL_WORKER");
  const people = useDirectoryPeople(cardWrite ? profile.organizationId : null).data?.people;

  const [initial] = useState(() => profileFormValues(profile));
  const [values, setValues] = useState(initial);
  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const countries = useMemo(() => phoneCountryOptions(locale), [locale]);
  const set = (field: keyof ProfileFormValues) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const patch = buildProfilePatch(initial, values, {
    name: nameEditable,
    card: cardWrite,
    workContact: workContactWrite,
    job: jobWrite,
  });
  const dirty = Object.keys(patch).length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (nameEditable && values.name.trim() === "") {
      setNameError(true);
      return;
    }
    setNameError(false);
    if (workContactWrite && workPhoneInvalid(values)) {
      setPhoneError(true);
      return;
    }
    setPhoneError(false);
    if (!dirty) return;
    update.mutate(patch, {
      onSuccess: () => router.push(profileHref(profile.organizationId, profile.employmentId)),
    });
  };

  /** Props for one field of a Section: disabled unless it can be set, Clear while lapsed. */
  const field = (name: keyof ProfileFormValues, writable: boolean) => ({
    value: values[name],
    onChange: set(name),
    disabled: !writable || lapsed,
    clearable: writable && lapsed && values[name] !== "",
  });

  const reportsToOptions = (people ?? []).filter(
    (person) => person.employmentId !== profile.employmentId
  );
  const reportsToKnown =
    values.reportsTo === "" ||
    reportsToOptions.some((person) => person.employmentId === values.reportsTo);
  const spellStart = job
    ? new Date(job.spell.startedAt).toLocaleDateString(t.common.dateLocale)
    : null;

  const anchors = [
    { id: "record", title: copy.record },
    ...(card ? [{ id: "card", title: labels.card }] : []),
    ...(photo ? [{ id: "photo", title: copy.photo.title }] : []),
    ...(workContact ? [{ id: "work-contact", title: labels.workContact }] : []),
    ...(job ? [{ id: "job", title: labels.job }] : []),
  ];

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">{copy.title}</h1>
        <nav aria-label={copy.sectionsLabel} className="flex flex-wrap gap-3 text-sm">
          {anchors.map((anchor) => (
            <a key={anchor.id} href={`#${anchor.id}`} className="text-primary hover:underline">
              {anchor.title}
            </a>
          ))}
        </nav>
        {!cardWrite && !workContactWrite && !jobWrite && photo?.level !== "WRITE" ? (
          <p className="text-muted-foreground text-sm">{copy.nothingToEdit}</p>
        ) : null}
      </div>

      <EditSection id="record" title={copy.record}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="profile-name"
            label={labels.name}
            value={values.name}
            onChange={set("name")}
            disabled={!nameEditable}
            hint={card?.nameFromAccount ? <Locked>{copy.fromAccount}</Locked> : null}
            error={nameError ? copy.nameRequired : null}
          />
          {profile.account ? (
            <TextField
              id="profile-sign-in-email"
              label={labels.signInEmail}
              value={profile.account.signInEmail ?? ""}
              onChange={() => undefined}
              disabled
              hint={
                profile.account.status === "ACTIVE" ? <Locked>{copy.fromAccount}</Locked> : null
              }
            />
          ) : null}
        </div>
      </EditSection>

      {card ? (
        <EditSection id="card" title={labels.card} level={card.level} lapsed={lapsed}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="profile-job-title"
              label={labels.jobTitle}
              maxLength={100}
              {...field("jobTitle", cardWrite)}
            />
            <SelectField
              id="profile-reports-to"
              label={labels.reportsTo}
              hint={copy.reportsToHint}
              {...field("reportsTo", cardWrite)}
            >
              <option value="">{copy.none}</option>
              {!reportsToKnown ? (
                <option value={values.reportsTo}>{card.reportsTo?.name ?? copy.someoneElse}</option>
              ) : null}
              {reportsToOptions.map((person) => (
                <option key={person.employmentId} value={person.employmentId}>
                  {person.name}
                </option>
              ))}
            </SelectField>
          </div>
        </EditSection>
      ) : null}

      {photo ? <PhotoEditSection profile={profile} lapsed={lapsed} /> : null}

      {workContact ? (
        <EditSection
          id="work-contact"
          title={labels.workContact}
          level={workContact.level}
          lapsed={lapsed}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <TextField
                id="profile-work-email"
                type="email"
                label={labels.workEmail}
                maxLength={254}
                hint={copy.workEmailHint}
                {...field("workEmail", workContactWrite)}
              />
              {workContactWrite && !lapsed && profile.account?.signInEmail ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => set("workEmail")(profile.account?.signInEmail ?? "")}
                >
                  {copy.useSignInEmail}
                </Button>
              ) : null}
            </div>
            <SelectField
              id="profile-work-phone-country"
              label={copy.phoneCountry}
              {...field("workPhoneCountry", workContactWrite)}
              clearable={false}
            >
              <option value="">{copy.noPhoneCountry}</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.label}
                </option>
              ))}
            </SelectField>
            <TextField
              id="profile-work-phone"
              type="tel"
              label={labels.workPhone}
              maxLength={40}
              hint={copy.phoneHint}
              error={phoneError ? copy.invalidPhone : null}
              {...field("workPhoneNumber", workContactWrite)}
            />
          </div>
        </EditSection>
      ) : null}

      {job ? (
        <EditSection id="job" title={labels.job} level={job.level} lapsed={lapsed}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="profile-legal-name"
              label={labels.legalName}
              maxLength={200}
              {...field("legalName", jobWrite)}
            />
            <TextField
              id="profile-employee-number"
              label={labels.employeeNumber}
              maxLength={50}
              hint={copy.employeeNumberHint}
              {...field("employeeNumber", jobWrite)}
            />
            <TextField
              id="profile-start-date"
              type="date"
              label={labels.startDate}
              hint={spellStart ? copy.startDateHint(spellStart) : null}
              {...field("startDate", jobWrite)}
            />
            {!external ? (
              <TextField
                id="profile-probation-end-date"
                type="date"
                label={labels.probationEndDate}
                {...field("probationEndDate", jobWrite)}
              />
            ) : null}
            <TextField
              id="profile-leaving-date"
              type="date"
              label={labels.leavingDate}
              hint={copy.leavingDateHint}
              {...field("leavingDate", jobWrite)}
            />
            {!external ? (
              <>
                <SelectField
                  id="profile-contract-type"
                  label={labels.contractType}
                  {...field("contractType", jobWrite)}
                >
                  <option value="">{labels.notSet}</option>
                  {CONTRACT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {labels.contractTypes[type]}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  id="profile-working-time"
                  label={labels.workingTime}
                  {...field("workingTime", jobWrite)}
                >
                  <option value="">{labels.notSet}</option>
                  {WORKING_TIMES.map((time) => (
                    <option key={time} value={time}>
                      {labels.workingTimes[time]}
                    </option>
                  ))}
                </SelectField>
              </>
            ) : null}
          </div>
        </EditSection>
      ) : null}

      {update.error ? (
        <p role="alert" className="text-destructive text-sm">
          {errorCopy(update.error, copy.errors, copy.saveFailed)}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button asChild variant="outline">
          <Link href={profileHref(profile.organizationId, profile.employmentId)}>
            {copy.cancel}
          </Link>
        </Button>
        <Button type="submit" disabled={!dirty || update.isPending}>
          {update.isPending ? copy.saving : copy.save}
        </Button>
      </div>
    </form>
  );
}

/**
 * The Profile photo: upload, replace and remove act at once, apart from the
 * page's Save. A lapsed plan leaves only Remove.
 */
function PhotoEditSection({ profile, lapsed }: { profile: DirectoryProfile; lapsed: boolean }) {
  const { t } = useTranslation();
  const copy = t.directory.edit.photo;
  const section = profile.sections.photo!;
  const writable = section.level === "WRITE";
  const upload = useUploadProfilePhoto(profile.organizationId, profile.employmentId);
  const remove = useRemoveProfilePhoto(profile.organizationId, profile.employmentId);
  const [problem, setProblem] = useState<string | null>(null);
  const busy = upload.isPending || remove.isPending;
  const current = section.photo;

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const refused = photoFileProblem(file);
    setProblem(refused ? copy.problems[refused]! : null);
    if (!refused) upload.mutate(file);
  };

  const settled = upload.data;
  const failure =
    problem ??
    (settled?.status === "REJECTED"
      ? (copy.problems[settled.rejectionReason ?? ""] ?? copy.failed)
      : null) ??
    (upload.error ? (copy.problems[refusalKey(upload.error) ?? ""] ?? copy.failed) : null) ??
    (remove.error ? (copy.problems[refusalKey(remove.error) ?? ""] ?? copy.removeFailed) : null);
  const pickLabel = current ? copy.replace : copy.upload;

  return (
    <EditSection id="photo" title={copy.title} level={section.level} lapsed={lapsed}>
      <div className="flex flex-wrap items-center gap-4">
        <PersonAvatar person={profile} photoUrl={current?.fullUrl} size={72} />
        <div className="space-y-2">
          {!current ? <p className="text-muted-foreground text-sm">{copy.noPhoto}</p> : null}
          {writable ? (
            <div className="flex flex-wrap gap-2">
              <label
                htmlFor="profile-photo-file"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  (lapsed || busy) && "pointer-events-none opacity-50"
                )}
              >
                {upload.isPending ? copy.uploading : pickLabel}
              </label>
              <input
                id="profile-photo-file"
                type="file"
                accept={PHOTO_PICKER_ACCEPT}
                aria-label={pickLabel}
                className="sr-only"
                disabled={lapsed || busy}
                onChange={pick}
              />
              {current ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setProblem(null);
                    remove.mutate();
                  }}
                >
                  {remove.isPending ? copy.removing : copy.remove}
                </Button>
              ) : null}
            </div>
          ) : null}
          {writable ? <p className="text-muted-foreground text-xs">{copy.hint}</p> : null}
          {writable && lapsed ? (
            <p className="text-muted-foreground text-xs">{copy.lapsed}</p>
          ) : null}
          {upload.isSuccess && settled === undefined ? (
            <p className="text-muted-foreground text-xs">{copy.processing}</p>
          ) : null}
          {failure ? (
            <p role="alert" className="text-destructive text-sm">
              {failure}
            </p>
          ) : null}
        </div>
      </div>
    </EditSection>
  );
}

/** A refusal's `context.code`, or the `reason` the upload routes answer with. */
const refusalKey = (error: unknown) =>
  errorCode(error) ??
  (error instanceof ApiError ? error.context<{ reason?: string }>()?.reason : undefined);

function EditSection({
  id,
  title,
  level,
  lapsed = false,
  children,
}: {
  id: string;
  title: string;
  level?: DirectorySectionLevel;
  lapsed?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const copy = t.directory.edit;
  const headingId = `${id}-heading`;
  const badge =
    level === undefined
      ? null
      : level === "READ"
        ? copy.readOnly
        : lapsed
          ? copy.clearOnly
          : copy.editable;
  const hint = level === "READ" ? copy.readOnlyHint : level && lapsed ? copy.lapsedHint : null;

  return (
    <Card id={id} role="region" aria-labelledby={headingId} className="scroll-mt-20">
      <CardContent className="space-y-4 py-5">
        <div className="space-y-1">
          <h2
            id={headingId}
            className="font-heading flex items-center gap-2 text-base font-semibold"
          >
            {title}
            {badge ? (
              <Badge variant={level === "READ" ? "secondary" : "outline"}>{badge}</Badge>
            ) : null}
          </h2>
          {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  clearable?: boolean;
  hint?: ReactNode;
  error?: string | null;
};

function FieldFrame({
  id,
  label,
  hint,
  error,
  clearable,
  onChange,
  children,
}: FieldProps & { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {clearable ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`${t.directory.edit.clear}: ${label}`}
          onClick={() => onChange("")}
        >
          {t.directory.edit.clear}
        </Button>
      ) : null}
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

function TextField(
  props: FieldProps & { type?: "text" | "date" | "email" | "tel"; maxLength?: number }
) {
  return (
    <FieldFrame {...props}>
      <Input
        id={props.id}
        type={props.type ?? "text"}
        value={props.value}
        maxLength={props.maxLength}
        disabled={props.disabled}
        aria-invalid={props.error ? true : undefined}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </FieldFrame>
  );
}

function SelectField(props: FieldProps & { children: ReactNode }) {
  return (
    <FieldFrame {...props}>
      <select
        id={props.id}
        value={props.value}
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.target.value)}
        className="border-border bg-background h-9 w-full rounded-md border px-3 text-sm disabled:opacity-50"
      >
        {props.children}
      </select>
    </FieldFrame>
  );
}

function Locked({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Lock className="h-3 w-3" aria-hidden />
      {children}
    </span>
  );
}
