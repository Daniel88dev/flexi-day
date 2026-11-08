import type { Locale } from "@/lib/i18n/config";

// Company / legal entity details surfaced on the Privacy, Terms, Security and
// Contact pages. These are drafts provided for transparency — have them reviewed
// by a qualified lawyer before relying on them.
export const LEGAL = {
  product: "flexiday",
  entity: "Daniel Hrynusiw OSVČ",
  address: "Bořetická 4133/6, 628 00 Brno-Židenice, Czech Republic",
  email: "daniel@hrynusiw.cz",
  country: "Czech Republic",
  ico: "23347406",
  /** Merchant of Record for paid plans — the seller of record on invoices. */
  merchantOfRecord: "Paddle.com Market Ltd",
  /** Human-readable last-updated date shown on every legal page. */
  updated: "28 October 2026",
  /** Where the product is hosted (AWS region). */
  hosting: "Amazon Web Services (AWS), eu-central-1 region (Frankfurt, Germany)",
  /** Data-protection supervisory authority for the controller. */
  authority: {
    name: "Office for Personal Data Protection (Úřad pro ochranu osobních údajů)",
    address: "Pplk. Sochora 27, 170 00 Prague 7, Czech Republic",
    url: "https://www.uoou.cz",
  },
  /** The details above as the Czech pages print them. */
  cs: {
    updated: "28. října 2026",
    address: "Bořetická 4133/6, 628 00 Brno-Židenice",
    hosting: "Amazon Web Services (AWS), region eu-central-1 (Frankfurt, Německo)",
    authority: {
      name: "Úřad pro ochranu osobních údajů",
      address: "Pplk. Sochora 27, 170 00 Praha 7",
    },
  },
} as const;

/** Matches `DIRECTORY_AGREEMENT_VERSION` in the backend. */
export const DIRECTORY_AGREEMENT_VERSION = 2;

/** Matches `AI_AGREEMENT_VERSION` in the backend. */
export const AI_AGREEMENT_VERSION = 1;

/** The legal pages that have a Czech twin under `/cs/`. */
export type TranslatedLegalPage =
  "privacy" | "terms" | "dpa" | "directory-agreement" | "ai-agreement" | "ai-dpia";

export function legalHref(page: TranslatedLegalPage, locale: Locale): string {
  return locale === "cs" ? `/cs/${page}/` : `/${page}/`;
}

// Read through the literal `process.env.NEXT_PUBLIC_…` so Next inlines it into the static export.
function aiTextsPublishedOn(): Date | null {
  const raw = process.env.NEXT_PUBLIC_AI_TEXTS_PUBLISHED;
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(raw) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== raw
  ) {
    throw new Error(`NEXT_PUBLIC_AI_TEXTS_PUBLISHED must be a date as YYYY-MM-DD, got "${raw}"`);
  }
  return date;
}

/**
 * Whether this build carries the legal wording for the Assistant and AI connections. Day 0 sets
 * `NEXT_PUBLIC_AI_TEXTS_PUBLISHED` and rebuilds; until then every page keeps today's wording.
 */
export function aiTextsPublished(): boolean {
  return aiTextsPublishedOn() !== null;
}

/** The "Last updated" date of the pages the AI texts change: their publication day once set. */
export function aiTextsUpdated(locale: Locale): string {
  const date = aiTextsPublishedOn();
  if (!date) return locale === "cs" ? LEGAL.cs.updated : LEGAL.updated;
  return new Intl.DateTimeFormat(locale === "cs" ? "cs-CZ" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
