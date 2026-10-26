"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { profileHref } from "@/lib/directory/routes";
import { pushToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorCode, errorCopy } from "@/lib/api/client";
import type { DirectoryOrganization, DirectoryPerson, WorkerType } from "@/lib/api/directory";
import {
  useCheckDirectoryEmail,
  useCreateDirectoryPerson,
  useDirectoryList,
} from "@/lib/api/queries";
import {
  EMPTY_NEW_PERSON,
  newPersonBody,
  newPersonProblems,
  type NewPersonProblems,
  type NewPersonValues,
} from "@/lib/directory/add-person";
import { entryLabel, pickerEntries } from "@/lib/directory/entries";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

/** The Add person button, disabled with its reason on a lapsed plan, and its dialog. */
export function AddPersonAction({
  organization,
  people,
}: {
  organization: DirectoryOrganization;
  people: DirectoryPerson[];
}) {
  const { t } = useTranslation();
  const copy = t.directory.addPerson;
  const [open, setOpen] = useState(false);
  const lapsed = !organization.writable;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {lapsed ? <span className="text-muted-foreground text-xs">{copy.lapsed}</span> : null}
      <Button type="button" size="sm" disabled={lapsed} onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" aria-hidden />
        {copy.action}
      </Button>
      {open ? (
        <AddPersonDialog
          organizationId={organization.organizationId}
          people={people}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

function AddPersonDialog({
  organizationId,
  people,
  onClose,
}: {
  organizationId: string;
  people: DirectoryPerson[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const copy = t.directory.addPerson;
  const router = useRouter();
  const create = useCreateDirectoryPerson(organizationId);
  const checkEmail = useCheckDirectoryEmail(organizationId);
  const departments = useDirectoryList(organizationId, "departments").data?.entries ?? [];
  const locations = useDirectoryList(organizationId, "locations").data?.entries ?? [];
  const [values, setValues] = useState<NewPersonValues>(EMPTY_NEW_PERSON);
  const [problems, setProblems] = useState<NewPersonProblems>({});
  const [failure, setFailure] = useState<string | null>(null);

  const set = (key: keyof NewPersonValues) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === "name" || key === "email") {
      setProblems((current) => ({ ...current, [key]: undefined }));
    }
  };

  const blurName = () =>
    setProblems((current) => ({ ...current, name: newPersonProblems(values).name }));

  async function blurEmail() {
    const problem = newPersonProblems(values).email;
    setProblems((current) => ({ ...current, email: problem }));
    const email = values.email.trim().toLowerCase();
    if (problem || email === "") return;
    try {
      const { available } = await checkEmail.mutateAsync(email);
      if (!available) setProblems((current) => ({ ...current, email: "taken" }));
    } catch {
      // The submit asks again and answers for itself.
    }
  }

  async function submit() {
    setFailure(null);
    const found = newPersonProblems(values);
    setProblems(found);
    if (found.name || found.email) return;
    try {
      const profile = await create.mutateAsync(newPersonBody(values));
      pushToast(copy.done(profile.name));
      onClose();
      router.push(profileHref(organizationId, profile.employmentId));
    } catch (err) {
      if (errorCode(err) === "EMPLOYMENT_EMAIL_TAKEN") {
        setProblems((current) => ({ ...current, email: "taken" }));
        return;
      }
      setFailure(errorCopy(err, copy.errors, copy.errors.failed));
    }
  }

  const emailError =
    problems.email === "invalid"
      ? copy.errors.emailInvalid
      : problems.email === "taken"
        ? copy.errors.emailTaken
        : null;
  const departmentOptions = pickerEntries(departments, null);
  const locationOptions = pickerEntries(locations, null);

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Group legend={copy.person}>
            <Field
              id="add-person-name"
              label={copy.name}
              error={problems.name ? copy.errors.nameMissing : null}
            >
              <Input
                id="add-person-name"
                value={values.name}
                maxLength={200}
                autoComplete="off"
                aria-invalid={problems.name ? true : undefined}
                onChange={(event) => set("name")(event.target.value)}
                onBlur={blurName}
              />
            </Field>
            <div
              role="radiogroup"
              aria-label={copy.workerType}
              className="grid gap-2 sm:grid-cols-2"
            >
              <TypeCard
                type="employee"
                title={copy.employee}
                hint={copy.employeeHint}
                selected={values.type}
                onSelect={set("type")}
              />
              <TypeCard
                type="external"
                title={copy.external}
                hint={copy.externalHint}
                selected={values.type}
                onSelect={set("type")}
              />
            </div>
          </Group>

          <Group legend={copy.card}>
            <Field id="add-person-job-title" label={copy.jobTitle}>
              <Input
                id="add-person-job-title"
                value={values.jobTitle}
                maxLength={100}
                onChange={(event) => set("jobTitle")(event.target.value)}
              />
            </Field>
            {departmentOptions.length > 0 ? (
              <Field id="add-person-department" label={copy.department}>
                <NativeSelect
                  id="add-person-department"
                  value={values.departmentId}
                  onChange={set("departmentId")}
                >
                  <option value="">{copy.none}</option>
                  {departmentOptions.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entryLabel(entry, t.directory.archivedEntry)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            ) : null}
            {locationOptions.length > 0 ? (
              <Field id="add-person-location" label={copy.location}>
                <NativeSelect
                  id="add-person-location"
                  value={values.locationId}
                  onChange={set("locationId")}
                >
                  <option value="">{copy.none}</option>
                  {locationOptions.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entryLabel(entry, t.directory.archivedEntry)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            ) : null}
            <Field id="add-person-reports-to" label={copy.reportsTo}>
              <NativeSelect
                id="add-person-reports-to"
                value={values.reportsToEmploymentId}
                onChange={set("reportsToEmploymentId")}
              >
                <option value="">{copy.none}</option>
                {people.map((person) => (
                  <option key={person.employmentId} value={person.employmentId}>
                    {person.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </Group>

          <Group legend={copy.account}>
            <Field
              id="add-person-email"
              label={copy.email}
              error={emailError}
              hint={copy.emailHint}
            >
              <Input
                id="add-person-email"
                type="email"
                value={values.email}
                maxLength={254}
                autoComplete="off"
                aria-invalid={emailError ? true : undefined}
                onChange={(event) => set("email")(event.target.value)}
                onBlur={() => void blurEmail()}
              />
            </Field>
          </Group>

          {failure ? (
            <p role="alert" className="text-destructive text-sm">
              {failure}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {copy.cancel}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? copy.adding : copy.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Group({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

function NativeSelect({
  id,
  value,
  onChange,
  children,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="border-border bg-background h-9 w-full rounded-md border px-3 text-sm"
    >
      {children}
    </select>
  );
}

/** A choice card standing in for a radio button, so the global input style never touches it. */
function TypeCard({
  type,
  title,
  hint,
  selected,
  onSelect,
}: {
  type: WorkerType;
  title: string;
  hint: string;
  selected: WorkerType;
  onSelect: (type: WorkerType) => void;
}) {
  const checked = selected === type;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={() => onSelect(type)}
      className={cn(
        "rounded-[var(--radius)] border p-3 text-left transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        checked ? "border-primary bg-primary/5" : "hover:border-primary/40"
      )}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className="text-muted-foreground block text-xs">{hint}</span>
    </button>
  );
}
