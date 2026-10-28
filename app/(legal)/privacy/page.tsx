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
      intro="This policy explains what personal data flexiday processes, in which role, why, and the rights you have under the General Data Protection Regulation (GDPR)."
      translatedPage="privacy"
    >
      <h2>1. Who we are</h2>
      <p>
        {LEGAL.product} is operated by <strong>{LEGAL.entity}</strong> (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;), company ID (IČO) {LEGAL.ico}, a sole trader established in the{" "}
        {LEGAL.country}, with a registered address at {LEGAL.address}.
      </p>
      <p>Our role depends on the data, and it is the same on every plan:</p>
      <ul>
        <li>
          We are the <strong>data controller</strong> of your <strong>account data</strong>: your
          sign-in, settings, notifications, calendar connections, push registrations and birthday.
          We decide what happens to it, and this policy covers it in full.
        </li>
        <li>
          We are a <strong>processor</strong> of <strong>organization data</strong>: what an
          organization keeps about the people who work in it, such as employments, groups, leave,
          attendance and quotas. The organization (usually your employer) is its controller. We
          process it only to provide the Service to that organization, on its instructions, under
          our <a href="/dpa/">Data Processing Agreement</a>. The organization decides how long it
          keeps your records and answers your requests about them.
        </li>
      </ul>
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
      <h3>Account data (we are the controller)</h3>
      <ul>
        <li>
          <strong>Sign-in details</strong> — your name, email address and password (stored only as a
          salted hash; we never see your plain-text password).
        </li>
        <li>
          <strong>Settings and notifications</strong> — your preferences and the notifications we
          show you in the app.
        </li>
        <li>
          <strong>Birthday</strong> — the month and day, and optionally the year, you add if you
          want to, shared with the groups you are in when you choose to share it.
        </li>
        <li>
          <strong>Support communications</strong> — the content of emails you send us.
        </li>
        <li>
          <strong>Sign-in with Google, Microsoft or Apple</strong>: if you sign in with one of these
          accounts, the provider sends us your name, email address and, where you have one, your
          profile picture. We use them only to create your account and sign you in.
        </li>
        <li>
          <strong>Calendar connection</strong>: if you connect your Google or Microsoft calendar to
          a personal calendar, we store the access tokens the provider issues (encrypted), the
          permission you granted, the time zone you chose, and the ids of the events we created.
          Section 6 has the details.
        </li>
      </ul>
      <h3>Organization data (we process it for your organization)</h3>
      <ul>
        <li>
          <strong>Employment and team data</strong> — the organizations and groups you belong to,
          your roles and invitations, and the organization&rsquo;s own copy of your name and email.
        </li>
        <li>
          <strong>Time-off data</strong> — leave requests you submit, including dates, leave type
          (e.g. vacation, sick, home office), status, and any note you add, with the quotas they
          count against and the change log that records who changed what.
        </li>
        <li>
          <strong>Attendance location</strong> — where your employer has switched attendance
          location on, we store the latitude, longitude and accuracy your browser reports at the
          moment you clock in and at the moment you clock out. Nothing is recorded between those two
          instants and nothing is collected in the background: your browser asks your permission
          each time, and declining is neither recorded nor flagged. The coordinates are visible to
          you and to the administrators of your organisation or group; nobody else can see them. We
          erase them twelve months after the business date they belong to — the attendance record
          itself stays, without the location.
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
        <li>
          <strong>People directory profiles</strong> — where the organization&rsquo;s owner has
          turned the people directory on, the profile the organization keeps about you. The{" "}
          <a href="/directory-agreement/">People directory agreement</a> describes it.
        </li>
      </ul>
      <h3>Data we collect automatically (we are the controller)</h3>
      <ul>
        <li>
          <strong>Technical data</strong> — IP address, browser and device type, and timestamps,
          collected in server logs for security and reliability.
        </li>
        <li>
          <strong>Session data</strong> — an authentication cookie / local-storage token that keeps
          you signed in (see section 10).
        </li>
        <li>
          <strong>Push token</strong> — the address Apple gives your iPhone for notifications,
          stored only if you allow notifications in the iPhone app.
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
      <p>
        The table covers the data we control. For organization data, the organization decides why it
        is processed and on which legal basis, and it answers for that choice. We process
        organization data only to provide the Service to the organization.
      </p>
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
            <td>
              Write your own approved absences into your Google or Microsoft calendar, when you
              connect one
            </td>
            <td>Performance of a contract (b)</td>
          </tr>
          <tr>
            <td>Send transactional emails (e.g. email verification, notifications)</td>
            <td>Performance of a contract (b) / legitimate interests (f)</td>
          </tr>
          <tr>
            <td>Send push notifications to the iPhone app</td>
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
        We do not sell your personal data. Within the Service, organization data is visible to the
        people in your organization as its settings and roles allow, for example to your team and
        groups to coordinate coverage. We rely on the following processors, who act on our
        instructions under data-processing agreements. Those that handle organization data are our
        sub-processors, which the <a href="/dpa/">Data Processing Agreement</a> lists:
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
            <td>Apple Inc. (Apple Push Notification service)</td>
            <td>
              Delivers push notifications to your iPhone; sees the notification text: names, leave
              and attendance dates
            </td>
            <td>United States</td>
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

      <h2>6. Calendar connections and Google user data</h2>
      <p>
        On a personal calendar you can connect your own Google or Microsoft calendar. flexiday then
        writes your approved absences into that account&rsquo;s primary calendar and keeps them up
        to date as your requests change. Only your own records are written there, never a
        teammate&rsquo;s.
      </p>
      <h3>What we access</h3>
      <p>
        From Google we ask for one permission, <code>calendar.events.owned</code>, which lets us
        create, change and delete events on calendars you own. We use it only on events we created
        ourselves. We do not read your other events, your list of calendars, or anyone else&rsquo;s
        calendar. From Microsoft we ask for <code>Calendars.ReadWrite</code> and{" "}
        <code>offline_access</code>, which keeps the sync running while you are signed out, and use
        them the same way.
      </p>
      <h3>What we write and store</h3>
      <p>
        Each event carries the absence type (for example &ldquo;Vacation&rdquo;), its dates or
        times, your time zone, and the note you added to the request, if any. People who can see
        your calendar, such as colleagues your organisation shares it with, can see these events. On
        our side we store the access tokens the provider issued to us, encrypted, plus the
        permission you granted and the id of each event we created, so we can update or remove it
        later.
      </p>
      <h3>How we use it, and what we never do</h3>
      <p>
        We use the access you grant only to keep your calendar in step with your approved absences.
        We do not sell this data, Google user data included, use it for advertising, use it to train
        AI or machine learning models, or transfer it to anyone else. Nobody at flexiday reads it,
        except where you ask us to for support, where security requires it, or where the law
        requires it.
      </p>
      <p>
        {LEGAL.product}&rsquo;s use and transfer to any other app of information received from
        Google APIs will adhere to the{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy">
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>
      <h3>Disconnecting and deletion</h3>
      <p>
        When you disconnect a calendar, we delete the events we created from it, revoke our access
        at Google, and delete the tokens we held. Microsoft offers no revocation from our side; you
        can remove flexiday under your Microsoft account&rsquo;s app permissions. You can also
        withdraw Google access at any time at{" "}
        <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>; we
        then stop syncing. When you delete your flexiday account, we do the same for every connected
        calendar first: we delete the events we created, revoke our access at Google, and delete the
        tokens. Anything we cannot remove or revoke at that point stays; you can delete a leftover
        event yourself and remove flexiday&rsquo;s access in your Google account permissions.
      </p>

      <h2>7. International transfers</h2>
      <p>
        Your data is hosted within the European Union ({LEGAL.hosting}). Where any transfer outside
        the European Economic Area occurs, we rely on appropriate safeguards such as the European
        Commission&rsquo;s Standard Contractual Clauses.
      </p>

      <h2>8. How long we keep it</h2>
      <p>
        We keep your account data for as long as your account exists. You can delete your account
        yourself in Settings, or ask us to erase your account data. Organization data stays for as
        long as the organization keeps it: the organization decides when to end an employment, when
        to erase a person&rsquo;s records and when to delete the organization itself.
      </p>
      <h3>Deleting your account</h3>
      <p>
        Deleting your account removes your account data from our live systems at once: your sign-in
        methods, sessions, settings, notifications, calendar connections (handled as section 6
        describes), push registrations and birthday.
      </p>
      <p>
        It does not delete the records the organizations you work in hold about you, because those
        are theirs. Your employments stay open, and your approved leave, request attachments,
        attendance, quotas and the change log stay with each organization, under the name and email
        it held for you at the moment of deletion. The organization&rsquo;s admins are told, and the
        organization decides whether to end your employment or erase your records. Leave requests
        still pending are cancelled, whatever their dates. If you are clocked in, the clock stops at
        the moment of deletion and the day is flagged for an admin to review. Groups you manage in
        someone else&rsquo;s organization pass to that organization&rsquo;s owner. Before you
        delete, you can download your account data, and your own records from each organization you
        work in, from Settings.
      </p>
      <p>
        If you own an organization where nobody else with an account still works, deleting your
        account deletes the organization: its groups, its subscription record, and everything it
        holds about other people, including former members, deleted accounts and people who never
        had an account. That is the organization&rsquo;s instruction to end the service, and the
        owner can download an organization export first. An owner has to remove the other members
        who have an account and cancel a renewing subscription before they can delete their account.
        Paddle, as seller of record, keeps its own records of past payments under its own privacy
        policy.
      </p>
      <h3>Erasing organization data</h3>
      <p>
        Only an organization&rsquo;s owner and admins can erase a person&rsquo;s organization data,
        as a step separate from ending their employment. The Service lets them do it once the person
        has deleted their account, or for a person who never had one. To have your records in an
        organization erased or corrected, ask that organization.
      </p>
      <h3>Backups and other periods</h3>
      <p>
        Our database backups age out, so deleted data is gone from them within seven days. We delete
        it unless we are legally required to keep it longer.
      </p>
      <p>
        Request attachments are deleted automatically twelve months after the absence, or as soon as
        the request is cancelled. Attendance location coordinates are erased twelve months after the
        business date they belong to, leaving the attendance record itself in place. Server logs are
        retained for a limited period for security purposes.
      </p>

      <h2>9. Your rights</h2>
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
        For account data, email <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> and we handle
        the request ourselves. You can also download your account data and delete your account in
        Settings.
      </p>
      <p>
        For organization data, your organization is the controller and answers your request, within
        the deadlines the GDPR sets. You can download your own records from each organization you
        work in, in Settings. If you send us a request about organization data, we forward it to the
        organization&rsquo;s owner and help them answer it; we do not change or erase organization
        data on our own.
      </p>
      <p>
        You also have the right to lodge a complaint with the {LEGAL.authority.name},{" "}
        {LEGAL.authority.address} (<a href={LEGAL.authority.url}>{LEGAL.authority.url}</a>).
      </p>

      <h2>10. Cookies and local storage</h2>
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

      <h2>11. Children</h2>
      <p>
        The Service is not directed at children. We do not knowingly collect personal data from
        anyone under 16. If you believe a child has provided us data, please contact us so we can
        remove it.
      </p>

      <h2>12. Security</h2>
      <p>
        We take appropriate technical and organisational measures to protect your data. For details,
        see our <a href="/security">Security</a> page.
      </p>

      <h2>13. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. We will change the &ldquo;last updated&rdquo;
        date above and, for material changes, provide a more prominent notice.
      </p>

      <h2>14. Contact</h2>
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
