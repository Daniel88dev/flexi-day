// The AI passages show only in a build with NEXT_PUBLIC_AI_TEXTS_PUBLISHED set (lib/legal.ts).
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { aiTextsPublished, aiTextsUpdated, LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Security — flexiday",
  description:
    "How flexiday protects your data: encryption, authentication, hosting and disclosure.",
};

export default function SecurityPage() {
  const ai = aiTextsPublished();
  return (
    <LegalShell
      title="Security"
      updated={aiTextsUpdated("en")}
      intro="We take the security of your team's data seriously. This page summarises the measures we use to protect it."
    >
      <h2>Encryption</h2>
      <ul>
        <li>
          <strong>In transit</strong> — all traffic between your browser and the Service is
          encrypted using TLS (HTTPS).
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
      {ai ? (
        <p>
          The Service is hosted on {LEGAL.hosting}. We rely on managed, industry-standard cloud
          infrastructure with physical and network security maintained by our provider. Flexi Day
          stores your data in the EU (AWS Frankfurt). If your organization turns on the Assistant,
          chats are kept by Anthropic in the US and may be processed in other countries; see the{" "}
          <a href="/ai-agreement/">AI features agreement</a>.
        </p>
      ) : (
        <p>
          The Service is hosted on {LEGAL.hosting}. We rely on managed, industry-standard cloud
          infrastructure with physical and network security maintained by our provider. Your data
          stays within the European Union.
        </p>
      )}

      <h2>Access control and data isolation</h2>
      <ul>
        <li>Access to production systems is restricted on a least-privilege basis.</li>
        <li>
          Within the product, time-off and profile data is scoped to your team and visible only to
          the relevant members.
        </li>
        {ai ? (
          <li>
            The Assistant reads only what the person asking can already see, through the same
            permission checks as the app, and every change it offers waits until that person
            confirms it. An AI app connected through AI connections gets access to one organization,
            with that person&rsquo;s permissions and the access the owner allows, and never sees a
            password. It can be disconnected in Settings at any time.
          </li>
        ) : null}
      </ul>

      <h2>Attachments</h2>
      <p>
        Files attached to a leave request are stored in a private bucket on {LEGAL.hosting},
        encrypted at rest, and are never reachable by a public link. A file is served only to the
        record owner, the group&rsquo;s approvers and its admins, through a short-lived URL issued
        on request, and is deleted automatically twelve months after the absence.
      </p>

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
      {ai ? (
        <p>
          The Assistant runs on Anthropic, PBC, only for organizations that turn it on. Anthropic
          never trains models on that data. Our logs and error reports carry ids and timings for the
          Assistant and AI connections, never chat text, tool arguments or results.
        </p>
      ) : null}

      {ai ? (
        <>
          <h2>Deletion</h2>
          <p>
            Deleted data leaves our live systems at once and our backups within seven days. We keep
            a chat with the Assistant for 180 days after its last message. Anthropic deletes it 30
            days after its last message, or at once when the chat is deleted, when its author leaves
            the organization or deletes their account, or when the organization is deleted.
            Anthropic keeps a message its safety systems flag for up to 2 years.
          </p>
        </>
      ) : null}

      <h2>Responsible disclosure</h2>
      <p>
        We welcome reports from security researchers. If you believe you have found a vulnerability,
        please email <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> with the details and steps
        to reproduce. Please:
      </p>
      <ul>
        <li>
          give us a reasonable opportunity to investigate and fix the issue before disclosing it;
        </li>
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
