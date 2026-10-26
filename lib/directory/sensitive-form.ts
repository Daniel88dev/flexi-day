import { parsePhoneNumberFromString } from "libphonenumber-js";
import type {
  ContactValues,
  DirectoryCountry,
  DirectoryPhone,
  DirectoryProfilePatch,
  DirectorySectionLevel,
  PersonalValues,
  ShownContact,
  ShownPersonal,
} from "@/lib/api/directory";
import { phoneFormFields, phoneFromForm } from "@/lib/directory/phone";

/** The Contact fields of the edit page as text, `""` meaning empty. */
export type ContactFormValues = {
  privatePhoneCountry: string;
  privatePhoneNumber: string;
  privateEmail: string;
  emergency1Name: string;
  emergency1Country: string;
  emergency1Number: string;
  emergency2Name: string;
  emergency2Country: string;
  emergency2Number: string;
};

/** The Personal fields of the edit page as text, `""` meaning empty. */
export type PersonalFormValues = {
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
  region: string;
  country: string;
  dateOfBirth: string;
};

const SLOTS = [1, 2] as const;
type Slot = (typeof SLOTS)[number];

const text = (value: string) => value.trim();
const valueOf = (value: string): string | null => (text(value) === "" ? null : text(value));

export function contactFormValues(
  values: ContactValues,
  defaultCountry: DirectoryCountry | null | undefined
): ContactFormValues {
  const phone = (stored: DirectoryPhone | null) => phoneFormFields(stored, defaultCountry);
  const privatePhone = phone(values.privatePhone);
  const first = phone(values.emergencyContact1?.phone ?? null);
  const second = phone(values.emergencyContact2?.phone ?? null);
  return {
    privatePhoneCountry: privatePhone.country,
    privatePhoneNumber: privatePhone.number,
    privateEmail: values.privateEmail ?? "",
    emergency1Name: values.emergencyContact1?.name ?? "",
    emergency1Country: first.country,
    emergency1Number: first.number,
    emergency2Name: values.emergencyContact2?.name ?? "",
    emergency2Country: second.country,
    emergency2Number: second.number,
  };
}

export function personalFormValues(values: PersonalValues): PersonalFormValues {
  const address = values.homeAddress;
  return {
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    postalCode: address?.postalCode ?? "",
    city: address?.city ?? "",
    region: address?.region ?? "",
    country: address?.country.code ?? "",
    dateOfBirth: values.dateOfBirth ?? "",
  };
}

/** E.164 for a valid number; an invalid one goes as typed, so the server's refusal explains it. */
const phoneOf = (country: string, number: string): string | null => {
  const phone = phoneFromForm(country, number);
  return phone.valid ? phone.e164 : valueOf(number);
};

const slotFields = (values: ContactFormValues, slot: Slot) =>
  slot === 1
    ? {
        name: values.emergency1Name,
        country: values.emergency1Country,
        number: values.emergency1Number,
      }
    : {
        name: values.emergency2Name,
        country: values.emergency2Country,
        number: values.emergency2Number,
      };

const slotOf = (values: ContactFormValues, slot: Slot) => {
  const fields = slotFields(values, slot);
  const name = valueOf(fields.name);
  const phone = phoneOf(fields.country, fields.number);
  return name === null && phone === null ? null : { name: name ?? "", phone: phone ?? "" };
};

export type ContactProblems = {
  privatePhone: boolean;
  /** Per slot: the name or the phone is missing, or the phone isn't a number. */
  emergency: Record<Slot, "incomplete" | "invalidPhone" | null>;
};

export function contactProblems(values: ContactFormValues): ContactProblems {
  const emergency = {} as ContactProblems["emergency"];
  for (const slot of SLOTS) {
    const fields = slotFields(values, slot);
    const hasName = valueOf(fields.name) !== null;
    const hasNumber = valueOf(fields.number) !== null;
    emergency[slot] =
      hasName !== hasNumber
        ? "incomplete"
        : hasNumber && !phoneFromForm(fields.country, fields.number).valid
          ? "invalidPhone"
          : null;
  }
  return {
    privatePhone: !phoneFromForm(values.privatePhoneCountry, values.privatePhoneNumber).valid,
    emergency,
  };
}

export const hasContactProblem = (problems: ContactProblems) =>
  problems.privatePhone || SLOTS.some((slot) => problems.emergency[slot] !== null);

const ADDRESS_FIELDS = ["line1", "line2", "postalCode", "city", "region", "country"] as const;

const addressOf = (values: PersonalFormValues) =>
  ADDRESS_FIELDS.every((field) => valueOf(values[field]) === null)
    ? null
    : {
        line1: text(values.line1),
        line2: valueOf(values.line2),
        postalCode: valueOf(values.postalCode),
        city: text(values.city),
        region: valueOf(values.region),
        country: text(values.country),
      };

/** Line 1, city and country are needed once any part of the address is filled. */
export function addressIncomplete(values: PersonalFormValues): boolean {
  const address = addressOf(values);
  return address !== null && (!address.line1 || !address.city || !address.country);
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** The `contact` part of the PATCH body for what changed, or undefined. */
export function buildContactPatch(
  before: ContactFormValues,
  after: ContactFormValues
): DirectoryProfilePatch["contact"] {
  const patch: NonNullable<DirectoryProfilePatch["contact"]> = {};
  const phoneBefore = phoneOf(before.privatePhoneCountry, before.privatePhoneNumber);
  const phoneAfter = phoneOf(after.privatePhoneCountry, after.privatePhoneNumber);
  if (phoneBefore !== phoneAfter) patch.privatePhone = phoneAfter;
  const email = valueOf(after.privateEmail)?.toLowerCase() ?? null;
  if ((valueOf(before.privateEmail)?.toLowerCase() ?? null) !== email) patch.privateEmail = email;
  for (const slot of SLOTS) {
    const value = slotOf(after, slot);
    if (!same(slotOf(before, slot), value)) {
      if (slot === 1) patch.emergencyContact1 = value;
      else patch.emergencyContact2 = value;
    }
  }
  return Object.keys(patch).length > 0 ? patch : undefined;
}

/** The `personal` part of the PATCH body for what changed, or undefined. */
export function buildPersonalPatch(
  before: PersonalFormValues,
  after: PersonalFormValues
): DirectoryProfilePatch["personal"] {
  const patch: NonNullable<DirectoryProfilePatch["personal"]> = {};
  const address = addressOf(after);
  if (!same(addressOf(before), address)) patch.homeAddress = address;
  const day = valueOf(after.dateOfBirth);
  if (valueOf(before.dateOfBirth) !== day) patch.dateOfBirth = day;
  return Object.keys(patch).length > 0 ? patch : undefined;
}

const countryName = (code: string, locale: string): DirectoryCountry => ({
  code,
  name: new Intl.DisplayNames([locale], { type: "region", fallback: "code" }).of(code) ?? code,
});

const phoneView = (e164: string, locale: string): DirectoryPhone => {
  const parsed = parsePhoneNumberFromString(e164);
  return {
    e164,
    display: parsed?.isValid() ? parsed.formatInternational() : e164,
    country: parsed?.country ? countryName(parsed.country, locale) : null,
  };
};

/**
 * The Section as Show would return it after a save, built from the saved form.
 * The save's answer carries no values, and a second Show would log a second
 * read, so the page keeps what it sent.
 */
export function shownContactFrom(
  values: ContactFormValues,
  level: DirectorySectionLevel,
  recorded: boolean,
  locale: string
): ShownContact {
  const phone = phoneOf(values.privatePhoneCountry, values.privatePhoneNumber);
  const slot = (number: Slot) => {
    const value = slotOf(values, number);
    return value === null ? null : { name: value.name, phone: phoneView(value.phone, locale) };
  };
  return {
    section: "CONTACT",
    level,
    recorded,
    privatePhone: phone === null ? null : phoneView(phone, locale),
    privateEmail: valueOf(values.privateEmail)?.toLowerCase() ?? null,
    emergencyContact1: slot(1),
    emergencyContact2: slot(2),
  };
}

export function shownPersonalFrom(
  values: PersonalFormValues,
  level: DirectorySectionLevel,
  recorded: boolean,
  locale: string
): ShownPersonal {
  const address = addressOf(values);
  return {
    section: "PERSONAL",
    level,
    recorded,
    homeAddress:
      address === null ? null : { ...address, country: countryName(address.country, locale) },
    dateOfBirth: valueOf(values.dateOfBirth),
  };
}
