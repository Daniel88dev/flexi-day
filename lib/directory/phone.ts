import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import type { DirectoryCountry, DirectoryPhone } from "@/lib/api/directory";

const COUNTRIES = new Set<string>(getCountries());
const isCountry = (code: string): code is CountryCode => COUNTRIES.has(code);

/**
 * The phone the edit form holds, as E.164. A number typed with `+` is read as
 * international; otherwise it is read in the picked country. The server parses
 * it again and has the last word.
 */
export function phoneFromForm(
  country: string,
  number: string
): { e164: string | null; valid: boolean } {
  const value = number.trim();
  if (value === "") return { e164: null, valid: true };
  if (!/^\+?[\d\s().-]+$/.test(value)) return { e164: null, valid: false };
  const phone = value.startsWith("+")
    ? parsePhoneNumberFromString(value)
    : isCountry(country)
      ? parsePhoneNumberFromString(value, country)
      : undefined;
  return phone?.isValid() ? { e164: phone.number, valid: true } : { e164: null, valid: false };
}

/** A stored phone as the form's country and national number. */
export function phoneFormFields(
  phone: DirectoryPhone | null,
  defaultCountry: DirectoryCountry | null | undefined
): { country: string; number: string } {
  const parsed = phone ? parsePhoneNumberFromString(phone.e164) : undefined;
  if (phone && parsed?.country) {
    return { country: parsed.country, number: parsed.formatNational() };
  }
  if (phone) return { country: "", number: phone.display };
  return { country: defaultCountry?.code ?? "", number: "" };
}

/** Every country the phone picker offers, named in the interface language. */
export function phoneCountryOptions(locale: string): { code: string; label: string }[] {
  const names = new Intl.DisplayNames([locale], { type: "region", fallback: "code" });
  return getCountries()
    .map((code) => ({
      code,
      label: `${names.of(code) ?? code} (+${getCountryCallingCode(code)})`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
}
