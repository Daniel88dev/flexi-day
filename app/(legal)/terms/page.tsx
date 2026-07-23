// NOTE: These Terms of Service are a good-faith draft. Have them reviewed by a
// qualified lawyer before publication.
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service — flexiday",
  description: "The terms that govern your use of the flexiday time-off management service.",
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      updated={LEGAL.updated}
      intro="These terms form the agreement between you and flexiday when you use the Service. Please read them carefully."
    >
      <h2>1. Agreement</h2>
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of {LEGAL.product}{" "}
        (the &ldquo;Service&rdquo;), operated by <strong>{LEGAL.entity}</strong> (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;), {LEGAL.address}. By creating an account or using the Service you agree to
        these Terms. If you use the Service on behalf of an organisation, you confirm you are
        authorised to accept these Terms on its behalf.
      </p>

      <h2>2. Definitions</h2>
      <ul>
        <li>
          <strong>Account</strong> — the credentials and profile you create to use the Service.
        </li>
        <li>
          <strong>Team</strong> — the group of users and content organised under a shared workspace.
        </li>
        <li>
          <strong>Content</strong> — any data you submit, including time-off requests and notes.
        </li>
      </ul>

      <h2>3. The Service</h2>
      <p>
        {LEGAL.product} is a tool for requesting, approving and tracking team time off. We may add,
        change or remove features over time to improve the Service.
      </p>

      <h2>4. Eligibility and accounts</h2>
      <ul>
        <li>You must be at least 16 years old to use the Service.</li>
        <li>You agree to provide accurate information and to keep it up to date.</li>
        <li>
          You are responsible for keeping your credentials confidential and for all activity under
          your Account. Notify us promptly of any unauthorised use.
        </li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the Service for any unlawful purpose or in breach of these Terms;</li>
        <li>attempt to gain unauthorised access to the Service or other users&rsquo; data;</li>
        <li>interfere with, disrupt, overload or reverse-engineer the Service;</li>
        <li>scrape, resell or misuse the Service or its data.</li>
      </ul>

      <h2>6. Your content</h2>
      <p>
        You retain all rights to your Content. You grant us a limited licence to host, process and
        display your Content solely to provide and improve the Service. You are responsible for the
        Content you submit and for ensuring you have the right to share any personal data of others
        (such as teammates) with the Service.
      </p>

      <h2>7. Availability and early access</h2>
      <p>
        The Service is provided on an ongoing, best-effort basis and may currently be offered as an
        early-access or free plan. We do not guarantee that the Service will be uninterrupted or
        error-free, and we may perform maintenance or suspend features when needed.
      </p>

      <h2>8. Fees</h2>
      <p>
        The Service may be provided free of charge during early access. If we introduce paid plans,
        we will give you reasonable advance notice and you may choose whether to continue on a paid
        plan.
      </p>

      <h2>9. Intellectual property</h2>
      <p>
        The Service, including its software, design and trademarks, is owned by {LEGAL.entity} and
        protected by law. These Terms do not grant you any rights in the Service other than the right
        to use it in accordance with these Terms.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using the Service and delete your Account at any time. We may suspend or
        terminate your access if you breach these Terms or if we discontinue the Service. On
        termination, your right to use the Service ends; sections that by their nature should survive
        (such as intellectual property, disclaimers and limitation of liability) will remain in
        effect.
      </p>

      <h2>11. Disclaimers</h2>
      <p>
        To the extent permitted by law, the Service is provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo; without warranties of any kind, whether express or implied. We do not
        warrant that the Service will meet your requirements or be free of errors.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>
        To the extent permitted by law, we will not be liable for any indirect, incidental or
        consequential damages, or for loss of data, profits or business, arising from your use of the
        Service. Nothing in these Terms limits liability that cannot be limited under applicable law,
        including your statutory rights as a consumer.
      </p>

      <h2>13. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. We will update the &ldquo;last updated&rdquo;
        date above and, for material changes, provide additional notice. Continued use of the Service
        after changes take effect means you accept the updated Terms.
      </p>

      <h2>14. Governing law</h2>
      <p>
        These Terms are governed by the laws of the {LEGAL.country}. The courts of the{" "}
        {LEGAL.country} will have jurisdiction over any dispute, without prejudice to any mandatory
        consumer-protection rights you have in your country of residence.
      </p>

      <h2>15. Contact</h2>
      <p>
        {LEGAL.entity}
        <br />
        {LEGAL.address}
        <br />
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
      </p>
    </LegalShell>
  );
}
