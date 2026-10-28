// NOTE: This Data Processing Agreement is a good-faith Article 28 GDPR draft.
// Have it reviewed by a qualified lawyer before publication. Keep it in step with
// app/(legal)/cs/dpa/page.tsx.
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Data Processing Agreement — flexiday",
  description:
    "How flexiday processes organization data as a processor under Article 28 GDPR. Part of the Terms of Service.",
};

export default function DpaPage() {
  return (
    <LegalShell
      title="Data Processing Agreement"
      updated={LEGAL.updated}
      intro="This agreement sets out how flexiday processes personal data on behalf of an organization. It forms part of the Terms of Service."
      translatedPage="dpa"
    >
      <h2>1. Parties and scope</h2>
      <p>
        This Data Processing Agreement (&ldquo;DPA&rdquo;) is between the organization that uses{" "}
        {LEGAL.product} (the &ldquo;Controller&rdquo;), acting through its owner, and{" "}
        <strong>{LEGAL.entity}</strong>, {LEGAL.address}, IČO {LEGAL.ico} (the
        &ldquo;Processor&rdquo;, &ldquo;we&rdquo;). It forms part of the{" "}
        <a href="/terms/">Terms of Service</a> and applies to every organization on every plan, from
        the moment the organization is created. The owner accepts it on the organization&rsquo;s
        behalf by accepting the Terms.
      </p>
      <p>
        It covers <strong>organization data</strong>: the personal data the Controller keeps in the
        Service about the people who work in it. It does not cover account data, such as a
        person&rsquo;s sign-in, settings, notifications, calendar connections, push registrations
        and birthday. We are the controller of account data, and our{" "}
        <a href="/privacy/">Privacy Policy</a> governs it. Where the Controller turns on the people
        directory, the <a href="/directory-agreement/">People directory agreement</a> adds to this
        DPA for the directory&rsquo;s profile data.
      </p>

      <h2>2. Subject matter, duration, nature and purpose</h2>
      <ul>
        <li>
          <strong>Subject matter and purpose.</strong> Providing the Service to the Controller:
          recording and approving leave, keeping quotas, recording attendance, keeping the change
          log, showing all of it to the people the Controller&rsquo;s settings and roles allow,
          sending the notifications that go with it, and producing exports.
        </li>
        <li>
          <strong>Nature.</strong> Collection, storage, organisation, retrieval, display,
          transmission, export and erasure, by automated means.
        </li>
        <li>
          <strong>Duration.</strong> For as long as the organization exists in the Service, and
          until its data is deleted as section 12 describes.
        </li>
      </ul>

      <h2>3. People and data concerned</h2>
      <p>
        <strong>People:</strong> the Controller&rsquo;s employees, contractors and anyone else it
        adds to the organization, including its owner, admins, group managers and approvers, and,
        where the people directory is on, the emergency contacts its people give.
      </p>
      <p>
        <strong>Data:</strong> the organization&rsquo;s copy of each person&rsquo;s name and email;
        employments, groups, roles and invitations; leave requests with their dates, type, status
        and notes; quotas; the change log; request attachments; attendance times and, where the
        Controller turns it on, the location recorded at clock-in and clock-out; and, where the
        people directory is on, its profile fields.
      </p>
      <p>
        Sick leave bookings and request attachments such as a doctor&rsquo;s note can reveal health
        data, a special category under Article 9 GDPR. The Controller decides whether to use these
        features and is responsible for having a legal basis for them.
      </p>

      <h2>4. Instructions</h2>
      <p>
        We process organization data only on the Controller&rsquo;s documented instructions,
        including for transfers outside the EEA, unless EU or Czech law requires otherwise; in that
        case we tell the Controller first, unless that law forbids it. The Terms, this DPA, and the
        Controller&rsquo;s use and settings of the Service are its instructions. Ending an
        employment, erasing a person&rsquo;s records, changing a retention setting and deleting the
        organization are instructions given through the Service. If we think an instruction breaks
        the GDPR or other data-protection law, we tell the Controller at once.
      </p>
      <p>
        We do not use organization data for any purpose of our own, do not sell it, and do not use
        it for advertising or to train AI or machine-learning models.
      </p>

      <h2>5. Confidentiality</h2>
      <p>
        Everyone we authorise to process organization data is bound to confidentiality by contract
        or by law, and has access only as far as the task needs.
      </p>

      <h2>6. Security</h2>
      <p>
        We take the technical and organisational measures Article 32 GDPR requires, appropriate to
        the risk: hosting in the EU on {LEGAL.hosting}, encryption in transit and at rest,
        role-based access inside the Service, and backups that age out. Our{" "}
        <a href="/security/">Security</a> page describes them. We may improve these measures over
        time, but never lower the protection they give.
      </p>

      <h2>7. Sub-processors</h2>
      <p>The Controller gives us general authorisation to use sub-processors. We use these:</p>
      <table>
        <thead>
          <tr>
            <th>Sub-processor</th>
            <th>Purpose</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Amazon Web Services (AWS)</td>
            <td>Application hosting, database and file storage</td>
            <td>EU (Frankfurt, Germany)</td>
          </tr>
          <tr>
            <td>Amazon SES (AWS)</td>
            <td>Sending notification emails</td>
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
              Delivering push notifications to the iPhone app; sees names and leave and attendance
              dates in the notification text
            </td>
            <td>United States</td>
          </tr>
        </tbody>
      </table>
      <p>
        We tell the Controller about any intended addition or replacement by updating this list and
        its last-updated date at least 30 days before the change, and by email to the owner. The
        Controller may object on reasonable data-protection grounds within that time. If we cannot
        resolve the objection, the Controller may delete the organization before the change takes
        effect. Each sub-processor is bound by a contract with the same data-protection obligations
        as this DPA, and we remain responsible to the Controller for its work.
      </p>

      <h2>8. Transfers outside the EEA</h2>
      <p>
        Organization data is stored in the European Union. Where a sub-processor processes it
        outside the European Economic Area, we rely on an adequacy decision or the European
        Commission&rsquo;s Standard Contractual Clauses under Chapter V GDPR.
      </p>

      <h2>9. Help with requests from people</h2>
      <p>
        The Service gives the Controller the tools to answer the requests people make under Chapter
        III GDPR: a person can download their own records from each organization, and the owner and
        admins can export a person&rsquo;s records, end an employment, and erase the records of a
        person who has deleted their account or never had one. If a person sends us a request about
        organization data, we forward it to the owner without undue delay and do not answer it
        ourselves, other than to tell the person we have forwarded it. Where the tools are not
        enough, we help the Controller as far as we reasonably can.
      </p>

      <h2>10. Personal data breaches</h2>
      <p>
        We tell the owner without undue delay after becoming aware of a personal data breach
        affecting organization data. We give what we know of its nature, the people and records
        concerned, its likely consequences and the measures taken, and follow up as more becomes
        known, so the Controller can meet its own duties under Articles 33 and 34 GDPR.
      </p>

      <h2>11. Help with impact assessments</h2>
      <p>
        We give the Controller the information it reasonably needs about the Service for a data
        protection impact assessment, or a prior consultation with a supervisory authority, under
        Articles 35 and 36 GDPR.
      </p>

      <h2>12. End of the service and deletion</h2>
      <p>
        A person deleting their own account is not an instruction from the organization. Their
        employments stay open and their organization data stays with the organization until the
        Controller ends the employment or erases the records.
      </p>
      <p>
        The Controller ends the service by deleting the organization, which happens when its owner
        deletes their own account once nobody else with an account still works there. Before that,
        the owner can download an organization export of its data. When the organization is deleted,
        we delete its data from our live systems at once, and our backups age out within seven days,
        unless EU or Czech law requires us to keep it.
      </p>

      <h2>13. Audits</h2>
      <p>
        We make available to the Controller the information needed to show that we meet Article 28
        GDPR. We allow for and contribute to audits, including inspections, by the Controller or an
        auditor it mandates who is bound to confidentiality, on reasonable written notice and
        without undue disruption to the Service. Each party bears its own costs.
      </p>

      <h2>14. Liability, precedence and law</h2>
      <p>
        Liability under this DPA follows the Terms of Service, without limiting any liability that
        Article 82 GDPR does not allow to be limited. Where this DPA and the Terms differ on the
        processing of organization data, this DPA prevails. It is governed by the laws of the{" "}
        {LEGAL.country}.
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
