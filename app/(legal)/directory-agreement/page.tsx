// NOTE: A placeholder. The final text comes from fenro T-496 (the owner's legal
// work) and must replace this before the people directory ships.
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "People directory agreement (draft) · flexiday",
  description:
    "The agreement an organization accepts when its owner turns on the people directory.",
  robots: { index: false },
};

/** Matches `DIRECTORY_AGREEMENT_VERSION` in the backend. */
const DIRECTORY_AGREEMENT_PAGE_VERSION = 1;

export default function DirectoryAgreementPage() {
  return (
    <LegalShell
      title="People directory agreement"
      updated={LEGAL.updated}
      intro={`Version ${DIRECTORY_AGREEMENT_PAGE_VERSION}. The owner of an organization accepts it when they turn on the people directory.`}
    >
      <p role="note">
        <strong>Draft.</strong> This text is a placeholder. The final agreement replaces it before
        the people directory is offered.
      </p>

      <h2>1. What it covers</h2>
      <p>
        The people directory lets an organization keep a profile for everyone it works with. This
        agreement covers the profile data the organization enters or asks its people to enter.
      </p>

      <h2>2. Who decides</h2>
      <p>
        The organization decides what the directory holds and who sees it. {LEGAL.product} processes
        that data on the organization&rsquo;s instructions and for no purpose of its own.
      </p>

      <h2>3. What {LEGAL.product} does with it</h2>
      <ul>
        <li>stores it in the European Union, on {LEGAL.hosting};</li>
        <li>encrypts the contact and personal sections under a key held for the organization;</li>
        <li>runs no biometric processing on profile photos;</li>
        <li>removes data when the organization&rsquo;s retention settings say so;</li>
        <li>
          returns the data through the organization export, and deletes it when the organization is
          deleted.
        </li>
      </ul>

      <h2>4. Contact</h2>
      <p>
        Questions about this agreement go to <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
    </LegalShell>
  );
}
