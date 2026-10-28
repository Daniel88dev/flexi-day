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

/** The legal pages that have a Czech twin under `/cs/`. */
export type TranslatedLegalPage = "privacy" | "terms" | "dpa" | "directory-agreement";

export function legalHref(page: TranslatedLegalPage, locale: Locale): string {
  return locale === "cs" ? `/cs/${page}/` : `/${page}/`;
}
