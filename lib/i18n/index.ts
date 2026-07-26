import { en, type Dictionary } from "./dictionaries/en";
import { cs } from "./dictionaries/cs";
import type { Locale } from "./config";

export const dictionaries: Record<Locale, Dictionary> = { en, cs };

export type { Dictionary };
export type { Locale };
export { DEFAULT_LOCALE, LOCALES, STORAGE_KEY, isLocale } from "./config";
