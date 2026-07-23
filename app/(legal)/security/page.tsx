import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Security — flexiday",
  description: "How flexiday protects your data: encryption, authentication, hosting and disclosure.",
};

export default function SecurityPage() {
  return (
    <LegalShell
      title="Security"
      updated={LEGAL.updated}
      intro="We take the security of your team's data seriously. This page summarises the measures we use to protect it."
    >
      <h2>Encryption</h2>
      <ul>
        <li>
          <strong>In transit</strong> — all traffic between your browser and the Service is encrypted
          using TLS (HTTPS).
        </li>
        <li>
          <strong>At rest</strong> — data stored in our database and backups is encrypted at rest by
          our infrastructure provider.
        </li>
      </ul>

      <h2>Authentication</h2>
      <ul>
        <li>Passwords are never stored in plain text — only as salted, hashed values.</li>
        <li>Sign-in and session management are handled by a dedicated authentication library.</li>
        <li>Email verification is required to confirm account ownership.</li>
        <li>Sessions can be revoked by signing out.</li>
      </ul>

      <h2>Infrastructure and hosting</h2>
      <p>
        The Service is hosted on {LEGAL.hosting}. We rely on managed, industry-standard cloud
        infrastructure with physical and network security maintained by our provider. Your data stays
        within the European Union.
      </p>

      <h2>Access control and data isolation</h2>
      <ul>
        <li>Access to production systems is restricted on a least-privilege basis.</li>
        <li>
          Within the product, time-off and profile data is scoped to your team and visible only to
          the relevant members.
        </li>
      </ul>

      <h2>Backups and reliability</h2>
      <p>
        We maintain regular backups so data can be restored in the event of an incident. Server
        activity is logged to help us detect and investigate suspicious behaviour.
      </p>

      <h2>Sub-processors</h2>
      <p>
        We use a small set of trusted sub-processors to run the Service. They are listed, along with
        their purpose and location, in our <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>Responsible disclosure</h2>
      <p>
        We welcome reports from security researchers. If you believe you have found a vulnerability,
        please email <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> with the details and steps to
        reproduce. Please:
      </p>
      <ul>
        <li>give us a reasonable opportunity to investigate and fix the issue before disclosing it;</li>
        <li>avoid accessing or modifying other users&rsquo; data, and avoid service disruption;</li>
        <li>act in good faith and within the law.</li>
      </ul>
      <p>We will acknowledge your report and keep you informed of our progress.</p>

      <h2>Contact</h2>
      <p>
        Security questions? Reach us at <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>
    </LegalShell>
  );
}
