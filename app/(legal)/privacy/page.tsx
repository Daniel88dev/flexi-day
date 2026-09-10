// NOTE: This Privacy Policy is a good-faith GDPR-oriented draft. Have it reviewed
// by a qualified lawyer before publication.
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — flexiday",
  description: "How flexiday collects, uses and protects your personal data under the GDPR.",
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      updated={LEGAL.updated}
      intro="This policy explains what personal data flexiday processes, why, and the rights you have under the General Data Protection Regulation (GDPR)."
    >
      <h2>1. Who we are</h2>
      <p>
        {LEGAL.product} is operated by <strong>{LEGAL.entity}</strong> (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;, &ldquo;the controller&rdquo;), a sole trader established in the{" "}
        {LEGAL.country}, with a registered address at {LEGAL.address}. We are the{" "}
        <strong>data controller</strong> for the personal data described in this policy.
      </p>
      <p>
        For any privacy question or to exercise your rights, contact us at{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. We have not appointed a Data Protection
        Officer, as we are not required to under Article 37 GDPR.
      </p>

      <h2>2. Scope</h2>
      <p>
        This policy applies to the flexiday web application and related services (the
        &ldquo;Service&rdquo;), a tool that helps teams request, approve and track time off. It does
        not cover third-party websites we may link to.
      </p>

      <h2>3. What data we collect</h2>
      <h3>Data you provide</h3>
      <ul>
        <li>
          <strong>Account data</strong> — your name, email address and password (stored only as a
          salted hash; we never see your plain-text password).
        </li>
        <li>
          <strong>Team &amp; organisation data</strong> — groups you create or join, roles, and
          invitations.
        </li>
        <li>
          <strong>Time-off data</strong> — leave requests you submit, including dates, leave type
          (e.g. vacation, sick, home office), status, and any note you add.
        </li>
        <li>
          <strong>Support communications</strong> — the content of emails you send us.
        </li>
        <li>
          <strong>Request attachments</strong> — files (images or PDFs) you or an admin attach to a
          leave request, such as a doctor&rsquo;s note. Because a file may contain health data, we
          treat it as a special category of personal data under Article 9 GDPR. We store it so that
          the people who decide your request have the evidence for it. Attachments are stored
          encrypted at rest on AWS in Frankfurt, Germany, and only you, the group&rsquo;s approvers
          and its admins can open or download them; other members of your team cannot see that an
          attachment exists. We delete an attachment twelve months after the absence it belongs to,
          or sooner if the request is cancelled.
        </li>
      </ul>
      <h3>Data we collect automatically</h3>
      <ul>
        <li>
          <strong>Technical data</strong> — IP address, browser and device type, and timestamps,
          collected in server logs for security and reliability.
        </li>
        <li>
          <strong>Session data</strong> — an authentication cookie / local-storage token that keeps
          you signed in (see section 9).
        </li>
        <li>
          <strong>Error and performance data</strong> — when something goes wrong in your browser or
          on our servers, we record the error, the page or API route it happened on, your browser
          and operating system version, and timing measurements, so we can fix it. This is tagged
          with a random id that lives only for the current browser tab. We do not record your screen
          or your session, and we do not use this data to build a profile of you.
        </li>
      </ul>

      <h2>4. Why we use your data and our legal bases</h2>
      <table>
        <thead>
          <tr>
            <th>Purpose</th>
            <th>Legal basis (Art. 6(1) GDPR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Create and manage your account and authenticate you</td>
            <td>Performance of a contract (b)</td>
          </tr>
          <tr>
            <td>Provide the time-off calendar, requests and approvals to your team</td>
            <td>Performance of a contract (b)</td>
          </tr>
          <tr>
            <td>Send transactional emails (e.g. email verification, notifications)</td>
            <td>Performance of a contract (b) / legitimate interests (f)</td>
          </tr>
          <tr>
            <td>Keep the Service secure and prevent abuse</td>
            <td>Legitimate interests (f)</td>
          </tr>
          <tr>
            <td>Diagnose errors and monitor performance so the Service keeps working</td>
            <td>Legitimate interests (f)</td>
          </tr>
          <tr>
            <td>Comply with legal obligations and respond to lawful requests</td>
            <td>Legal obligation (c)</td>
          </tr>
        </tbody>
      </table>

      <h2>5. Who we share it with</h2>
      <p>
        We do not sell your personal data. Within the Service, your time-off and profile information
        is visible to members of your team and groups, as needed to coordinate coverage. We rely on
        the following processors, who act on our instructions under data-processing agreements:
      </p>
      <table>
        <thead>
          <tr>
            <th>Processor</th>
            <th>Purpose</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Amazon Web Services (AWS)</td>
            <td>Application hosting and database storage</td>
            <td>EU (Frankfurt, Germany)</td>
          </tr>
          <tr>
            <td>Amazon SES (AWS)</td>
            <td>Sending transactional emails</td>
            <td>EU (Frankfurt, Germany)</td>
          </tr>
          <tr>
            <td>Functional Software, Inc. (Sentry)</td>
            <td>Error monitoring and performance diagnostics</td>
            <td>EU region (Frankfurt, Germany); the company is based in the United States</td>
          </tr>
          <tr>
            <td>Paddle.com Market Ltd</td>
            <td>
              Payment processing, subscription billing, tax handling and invoicing (Merchant of
              Record for paid plans)
            </td>
            <td>United Kingdom / EU</td>
          </tr>
        </tbody>
      </table>
      <p>
        Paddle acts as the seller of record for paid plans: when you buy a subscription, Paddle
        processes your payment details under its own privacy policy — we never receive your full
        payment card details.
      </p>
      <p>
        We may also disclose data where required by law, to enforce our Terms, or to protect the
        rights, safety and security of our users.
      </p>

      <h2>6. International transfers</h2>
      <p>
        Your data is hosted within the European Union ({LEGAL.hosting}). Where any transfer outside
        the European Economic Area occurs, we rely on appropriate safeguards such as the European
        Commission&rsquo;s Standard Contractual Clauses.
      </p>

      <h2>7. How long we keep it</h2>
      <p>
        We keep your personal data for as long as your account is active. If you delete your account
        or ask us to erase your data, we remove it from our live systems and delete it from backups
        within a reasonable period, unless we are legally required to keep it longer. Request
        attachments are deleted automatically twelve months after the absence, or as soon as the
        request is cancelled. Server logs are retained for a limited period for security purposes.
      </p>

      <h2>8. Your rights</h2>
      <p>Under the GDPR you have the right to:</p>
      <ul>
        <li>access the personal data we hold about you;</li>
        <li>have inaccurate data corrected (rectification);</li>
        <li>have your data erased (&ldquo;right to be forgotten&rdquo;);</li>
        <li>restrict or object to certain processing;</li>
        <li>receive your data in a portable, machine-readable format;</li>
        <li>withdraw consent at any time, where processing is based on consent.</li>
      </ul>
      <p>
        To exercise any of these rights, email <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
        You also have the right to lodge a complaint with the {LEGAL.authority.name},{" "}
        {LEGAL.authority.address} (<a href={LEGAL.authority.url}>{LEGAL.authority.url}</a>).
      </p>

      <h2>9. Cookies and local storage</h2>
      <p>
        We store only what the Service needs to work, which is why you see no cookie banner. Nothing
        we store identifies you across visits, and there is no analytics, advertising or cross-site
        tracking of any kind.
      </p>
      <ul>
        <li>
          <strong>Authentication.</strong> A session cookie and a matching local-storage token that
          keep you signed in. Clearing them signs you out.
        </li>
        <li>
          <strong>Diagnostics.</strong> A random id (<code>fd.sid</code>) held in your
          browser&rsquo;s session storage, which groups the error and performance records described
          in section 3. It is discarded when you close the tab and never links two visits together.
        </li>
        <li>
          <strong>Preferences.</strong> Your light/dark theme choice, stored in your browser.
        </li>
        <li>
          <strong>Payment.</strong> On a paid plan, opening the checkout loads Paddle, which sets
          its own cookies to process the payment and prevent fraud. This happens only when you click
          to subscribe or manage your payment method, never on an ordinary page view.
        </li>
      </ul>

      <h2>10. Children</h2>
      <p>
        The Service is not directed at children. We do not knowingly collect personal data from
        anyone under 16. If you believe a child has provided us data, please contact us so we can
        remove it.
      </p>

      <h2>11. Security</h2>
      <p>
        We take appropriate technical and organisational measures to protect your data. For details,
        see our <a href="/security">Security</a> page.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. We will change the &ldquo;last updated&rdquo;
        date above and, for material changes, provide a more prominent notice.
      </p>

      <h2>13. Contact</h2>
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
