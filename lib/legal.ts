// Company / legal entity details surfaced on the Privacy, Terms, Security and
// Contact pages. These are drafts provided for transparency — have them reviewed
// by a qualified lawyer before relying on them.
export const LEGAL = {
  product: "flexiday",
  entity: "Daniel Hrynusiw OSVČ",
  address: "Bořetická 4133/6, 615 00 Brno-Židenice, Czech Republic",
  email: "support@flexi-day.com",
  country: "Czech Republic",
  /** Human-readable last-updated date shown on every legal page. */
  updated: "23 July 2026",
  /** Where the product is hosted (AWS region). */
  hosting: "Amazon Web Services (AWS), eu-central-1 region (Frankfurt, Germany)",
  /** Data-protection supervisory authority for the controller. */
  authority: {
    name: "Office for Personal Data Protection (Úřad pro ochranu osobních údajů)",
    address: "Pplk. Sochora 27, 170 00 Prague 7, Czech Republic",
    url: "https://www.uoou.cz",
  },
} as const;
