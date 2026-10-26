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
  useDirectoryList,
  useDirectoryOrganizations,
  useDirectoryPeople,
  useDirectoryProfile,
  useRemoveProfilePhoto,
  useUpdateDirectoryProfile,
  useUploadProfilePhoto,
} from "@/lib/api/queries";
import { PHOTO_PICKER_ACCEPT, photoFileProblem } from "@/lib/directory/profile-photo";
import { cn } from "@/lib/utils";
import { countryOptions, phoneCountryOptions } from "@/lib/directory/phone";
import {
  addressIncomplete,
  buildContactPatch,
  buildPersonalPatch,
  contactFormValues,
  contactProblems,
  hasContactProblem,
  personalFormValues,
  shownContactFrom,
  shownPersonalFrom,
  type ContactFormValues,
  type PersonalFormValues,
} from "@/lib/directory/sensitive-form";
import { useShownSection } from "@/lib/directory/shown-sections";
import { SensitiveGate } from "@/components/directory/sensitive-section";
import { entryLabel, pickerEntries } from "@/lib/directory/entries";
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
  const { card, photo, workContact, job, contact, personal } = profile.sections;
  const cardWrite = card?.level === "WRITE";
  const contactWrite = contact?.level === "WRITE";
  const personalWrite = personal?.level === "WRITE";
  const workContactWrite = workContact?.level === "WRITE";
  const jobWrite = job?.level === "WRITE";
  const nameEditable = cardWrite && !card?.nameFromAccount && !lapsed;
  const external = profile.markers.includes("EXTERNAL_WORKER");
  const people = useDirectoryPeople(cardWrite ? profile.organizationId : null).data?.people;
  const departments = useDirectoryList(profile.organizationId, "departments", cardWrite).data;
  const locations = useDirectoryList(profile.organizationId, "locations", cardWrite).data;

  const [initial] = useState(() => profileFormValues(profile));
  const [values, setValues] = useState(initial);
  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const countries = useMemo(() => phoneCountryOptions(locale), [locale]);
  const addressCountries = useMemo(() => countryOptions(locale), [locale]);

  // Sensitive sections join the form only once shown; until then nothing of theirs is sent.
  const contactShown = useShownSection(profile, "contact");
  const personalShown = useShownSection(profile, "personal");
  const contactInitial = useMemo(
    () =>
      contactShown.data ? contactFormValues(contactShown.data, contact?.phoneCountryDefault) : null,
    [contactShown.data, contact?.phoneCountryDefault]
  );
  const personalInitial = useMemo(
    () => (personalShown.data ? personalFormValues(personalShown.data) : null),
    [personalShown.data]
  );
  const [contactEdits, setContactEdits] = useState<Partial<ContactFormValues>>({});
  const [personalEdits, setPersonalEdits] = useState<Partial<PersonalFormValues>>({});
  const contactValues = contactInitial ? { ...contactInitial, ...contactEdits } : null;
  const personalValues = personalInitial ? { ...personalInitial, ...personalEdits } : null;
  const [contactChecked, setContactChecked] = useState(false);
  const [addressChecked, setAddressChecked] = useState(false);
  const problems = contactValues ? contactProblems(contactValues) : null;
  const set = (field: keyof ProfileFormValues) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const patch = buildProfilePatch(initial, values, {
    name: nameEditable,
    card: cardWrite,
    workContact: workContactWrite,
    job: jobWrite,
  });
  const contactPatch =
    contactWrite && contactInitial && contactValues
      ? buildContactPatch(contactInitial, contactValues)
      : undefined;
  const personalPatch =
    personalWrite && personalInitial && personalValues
      ? buildPersonalPatch(personalInitial, personalValues)
      : undefined;
  if (contactPatch) patch.contact = contactPatch;
  if (personalPatch) patch.personal = personalPatch;
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
    if (contactPatch && problems && hasContactProblem(problems)) {
      setContactChecked(true);
      return;
    }
    setContactChecked(false);
    if (personalPatch && personalValues && addressIncomplete(personalValues)) {
      setAddressChecked(true);
      return;
    }
    setAddressChecked(false);
    if (!dirty) return;
    update.mutate(patch, {
      onSuccess: () => {
        if (contactPatch && contactValues && contact) {
          contactShown.put(shownContactFrom(contactValues, contact.level, !profile.self, locale));
        }
        if (personalPatch && personalValues && personal) {
          personalShown.put(
            shownPersonalFrom(personalValues, personal.level, !profile.self, locale)
          );
        }
        router.push(profileHref(profile.organizationId, profile.employmentId));
      },
    });
  };

  /** Props for one field of a Section: disabled unless it can be set, Clear while lapsed. */
  const field = (name: keyof ProfileFormValues, writable: boolean) => ({
    value: values[name],
    onChange: set(name),
    disabled: !writable || lapsed,
    clearable: writable && lapsed && values[name] !== "",
  });

  /** Props for one Sensitive field: the same rules as `field`, on its own Section's state. */
  const contactField = (name: keyof ContactFormValues) => ({
    value: contactValues?.[name] ?? "",
    onChange: (value: string) => setContactEdits((current) => ({ ...current, [name]: value })),
    disabled: !contactWrite || lapsed,
    clearable: contactWrite && lapsed && (contactValues?.[name] ?? "") !== "",
  });
  const personalField = (name: keyof PersonalFormValues) => ({
    value: personalValues?.[name] ?? "",
    onChange: (value: string) => setPersonalEdits((current) => ({ ...current, [name]: value })),
    disabled: !personalWrite || lapsed,
    clearable: personalWrite && lapsed && (personalValues?.[name] ?? "") !== "",
  });
  const phoneCountrySelect = (
    id: string,
    label: string,
    props: ReturnType<typeof contactField>
  ) => (
    <SelectField id={id} label={label} {...props} clearable={false}>
      <option value="">{copy.noPhoneCountry}</option>
      {countries.map((country) => (
        <option key={country.code} value={country.code}>
          {country.label}
        </option>
      ))}
    </SelectField>
  );
  const today = new Date().toISOString().slice(0, 10);

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
    ...(contact ? [{ id: "contact", title: labels.contact }] : []),
    ...(personal ? [{ id: "personal", title: labels.personal }] : []),
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
        {!cardWrite &&
        !workContactWrite &&
        !jobWrite &&
        !contactWrite &&
        !personalWrite &&
        photo?.level !== "WRITE" ? (
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
            <SelectField
              id="profile-department"
              label={labels.department}
              {...field("department", cardWrite)}
            >
              <option value="">{copy.noEntry}</option>
              {pickerEntries(
                departments?.entries ?? (card.department ? [card.department] : []),
                card.department?.id ?? null
              ).map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entryLabel(entry, t.directory.archivedEntry)}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="profile-location"
              label={labels.location}
              {...field("location", cardWrite)}
            >
              <option value="">{copy.noEntry}</option>
              {pickerEntries(
                locations?.entries ?? (card.location ? [card.location] : []),
                card.location?.id ?? null
              ).map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entryLabel(entry, t.directory.archivedEntry)}
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

      {contact ? (
        <EditSection id="contact" title={labels.contact} level={contact.level} lapsed={lapsed}>
          <SensitiveGate profile={profile} shown={contactShown}>
            {() =>
              contactValues ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {phoneCountrySelect(
                    "profile-private-phone-country",
                    copy.privatePhoneCountry,
                    contactField("privatePhoneCountry")
                  )}
                  <TextField
                    id="profile-private-phone"
                    type="tel"
                    label={labels.privatePhone}
                    maxLength={40}
                    hint={copy.phoneHint}
                    error={contactChecked && problems?.privatePhone ? copy.invalidPhone : null}
                    {...contactField("privatePhoneNumber")}
                  />
                  <div className="sm:col-span-2">
                    <TextField
                      id="profile-private-email"
                      type="email"
                      label={labels.privateEmail}
                      maxLength={254}
                      {...contactField("privateEmail")}
                    />
                  </div>
                  {([1, 2] as const).map((slot) => {
                    const problem = contactChecked ? problems?.emergency[slot] : null;
                    return (
                      <fieldset key={slot} className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
                        <legend className="mb-2 text-sm font-medium">
                          {labels.emergencyContact(slot)}
                        </legend>
                        <TextField
                          id={`profile-emergency-${slot}-name`}
                          label={copy.emergencyName(slot)}
                          maxLength={100}
                          error={problem === "incomplete" ? copy.emergencyIncomplete : null}
                          {...contactField(`emergency${slot}Name`)}
                        />
                        {phoneCountrySelect(
                          `profile-emergency-${slot}-country`,
                          copy.emergencyPhoneCountry(slot),
                          contactField(`emergency${slot}Country`)
                        )}
                        <TextField
                          id={`profile-emergency-${slot}-phone`}
                          type="tel"
                          label={copy.emergencyPhone(slot)}
                          maxLength={40}
                          error={problem === "invalidPhone" ? copy.invalidPhone : null}
                          {...contactField(`emergency${slot}Number`)}
                        />
                      </fieldset>
                    );
                  })}
                  {contactWrite && contact.notice ? (
                    <aside
                      aria-label={copy.noticeTitle}
                      className="bg-muted/40 space-y-1 rounded-md border p-3 text-sm sm:col-span-2"
                    >
                      <p className="font-medium">{copy.noticeTitle}</p>
                      <p className="text-muted-foreground">{contact.notice}</p>
                    </aside>
                  ) : null}
                </div>
              ) : null
            }
          </SensitiveGate>
        </EditSection>
      ) : null}

      {personal ? (
        <EditSection id="personal" title={labels.personal} level={personal.level} lapsed={lapsed}>
          <SensitiveGate profile={profile} shown={personalShown}>
            {() =>
              personalValues ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <TextField
                      id="profile-address-line1"
                      label={copy.addressLine1}
                      maxLength={200}
                      error={addressChecked ? copy.addressIncomplete : null}
                      {...personalField("line1")}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <TextField
                      id="profile-address-line2"
                      label={copy.addressLine2}
                      maxLength={200}
                      {...personalField("line2")}
                    />
                  </div>
                  <TextField
                    id="profile-postal-code"
                    label={copy.postalCode}
                    maxLength={16}
                    {...personalField("postalCode")}
                  />
                  <TextField
                    id="profile-city"
                    label={copy.city}
                    maxLength={100}
                    {...personalField("city")}
                  />
                  <TextField
                    id="profile-region"
                    label={copy.region}
                    maxLength={100}
                    {...personalField("region")}
                  />
                  <SelectField
                    id="profile-country"
                    label={copy.country}
                    {...personalField("country")}
                  >
                    <option value="">{copy.noCountry}</option>
                    {addressCountries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.label}
                      </option>
                    ))}
                  </SelectField>
                  <TextField
                    id="profile-date-of-birth"
                    type="date"
                    label={labels.dateOfBirth}
                    min="1900-01-01"
                    max={today}
                    {...personalField("dateOfBirth")}
                  />
                </div>
              ) : null
            }
          </SensitiveGate>
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
  props: FieldProps & {
    type?: "text" | "date" | "email" | "tel";
    maxLength?: number;
    min?: string;
    max?: string;
  }
) {
  return (
    <FieldFrame {...props}>
      <Input
        id={props.id}
        type={props.type ?? "text"}
        value={props.value}
        maxLength={props.maxLength}
        min={props.min}
        max={props.max}
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
