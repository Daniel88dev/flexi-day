import type { useTranslation } from "@/lib/i18n/use-translation";

export type Translations = ReturnType<typeof useTranslation>["t"];
export type Copy = Translations["assistant"];
