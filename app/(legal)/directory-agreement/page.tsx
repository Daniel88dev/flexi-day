// NOTE: A good-faith Article 28 GDPR draft that adds to the DPA. Have it reviewed by a
// qualified lawyer before relying on it. Keep it in step with
// app/(legal)/cs/directory-agreement/page.tsx, and raise DIRECTORY_AGREEMENT_VERSION in
// the backend with every change of substance.
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { DIRECTORY_AGREEMENT_VERSION, LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "People directory agreement · flexiday",
  description:
    "The agreement an organization accepts when its owner turns on the people directory. It adds to the Data Processing Agreement.",
};

export default function DirectoryAgreementPage() {
  return (
    <LegalShell
      title="People directory agreement"
      updated={LEGAL.updated}
      intro={`Version ${DIRECTORY_AGREEMENT_VERSION}. The owner of an organization accepts it on the organization’s behalf when they turn on the people directory.`}
      translatedPage="directory-agreement"
    >
      <h2>1. Parties and scope</h2>
      <p>
        This agreement is between the organization that turns on the people directory (the
        &ldquo;Controller&rdquo;), acting through its owner, and <strong>{LEGAL.entity}</strong>,{" "}
        {LEGAL.address}, IČO {LEGAL.ico} (the &ldquo;Processor&rdquo;, &ldquo;we&rdquo;). It adds to
        the <a href="/dpa/">Data Processing Agreement</a> (&ldquo;DPA&rdquo;) for{" "}
        <strong>directory data</strong>: the profiles the Controller keeps in the people directory,
        the photos, emergency contacts and exports that belong to them, and the read log, profile
        history and permission history that record their use.
      </p>
      <p>
        Everything the DPA says about organization data applies to directory data, including its
        sub-processors, breach notices, audits and help with requests. Where this agreement and the
        DPA differ on directory data, this agreement prevails.
      </p>

      <h2>2. What the directory holds</h2>
      <p>Each profile belongs to one employment and is split into sections:</p>
      <ul>
        <li>
          <strong>Card</strong>: name, job title, department, location and who the person reports
          to.
        </li>
        <li>
          <strong>Photo</strong>: a profile photo.
        </li>
        <li>
          <strong>Work contact</strong>: work email and work phone.
        </li>
        <li>
          <strong>Job</strong>: legal name, employee number, start, leaving and probation end dates,
          contract type and working time.
        </li>
        <li>
          <strong>Contact</strong>: private phone, private email and up to two emergency contacts,
          each a name and a phone number.
        </li>
        <li>
          <strong>Personal</strong>: home address and date of birth, for employees only.
        </li>
      </ul>
      <p>
        Contact and Personal are the <strong>sensitive sections</strong>. The directory has no field
        for health, union membership or any other special category of data under Article 9 GDPR, and
        the Controller should not enter such data in a free-text field. A profile&rsquo;s date of
        birth is separate from the birthday a person sets on their own account, and the two are
        never copied into each other.
      </p>

      <h2>3. The Controller&rsquo;s instructions</h2>
      <p>
        The Controller decides what the directory holds and who sees it. Its settings in the Service
        are its documented instructions under the DPA: the permission table that sets who reads and
        changes each section, the HR and Leadership roles it assigns, the retention period of each
        section, retention holds, erasures, exports, and turning the directory on or off. A change
        to any of them takes effect as an instruction when it is saved.
      </p>
      <p>
        The Controller makes sure it has a legal basis for the data it keeps in the directory, and
        tells its people about the directory as Article 13 GDPR requires. The &ldquo;Tell
        members&rdquo; option sends everyone with an account a notice asking them to check their
        profile; it does not replace the Controller&rsquo;s own information to its people.
      </p>

      <h2>4. No biometric processing</h2>
      <p>
        We never run face recognition, face matching or any other identification of a person on
        profile photos or on any other image in the Service, attendance included. We create no
        biometric templates and send no image to a third-party vision or recognition service. We
        process a profile photo only to decode it, resize it into a small and a full size, and
        remove its metadata, including EXIF and location data. A profile photo is therefore not
        biometric data under Article 4(14) GDPR.
      </p>
      <p>
        We will not change this under the current version of this agreement. Any change would come
        only with a new version, after a data protection impact assessment, and would apply to an
        organization only once its owner accepts that version.
      </p>

      <h2>5. Protecting the sensitive sections</h2>
      <p>On top of the security measures the DPA describes, we:</p>
      <ul>
        <li>
          encrypt the Contact and Personal values in the application, under a data key of the
          Controller&rsquo;s own, wrapped by a customer managed key in AWS Key Management Service. A
          copy of the database or its backups yields only ciphertext;
        </li>
        <li>
          keep profile photos and exports in a private storage bucket in the EU, encrypted under the
          same customer managed key, and serve them only through signed links: an export link lasts
          an hour, a photo link at most two hours;
        </li>
        <li>
          return the sensitive sections of someone else&rsquo;s profile only when the reader asks to
          show them, and write a read-log entry each time: who read which sections of whose profile,
          when, and through which audience in the permission table. Every export of a person&rsquo;s
          data writes an entry too. The read log holds no values, is kept for 12 months, and the
          owner and org admins read it;
        </li>
        <li>
          keep a profile history of who changed which fields and when, and a permission history of
          every change to the permission table and its roles, neither holding profile values;
        </li>
        <li>
          keep profile values out of logs, error reports, notifications, push notifications and
          emails, which carry only identifiers;
        </li>
        <li>keep sensitive values on the iPhone app in memory only, never in its local storage.</li>
      </ul>
      <p>
        Our platform support can see whether an organization&rsquo;s directory is on, which version
        of this agreement it accepted, and counts. It sees no profile values, and we look at more
        only on the owner&rsquo;s written instruction about their own organization.
      </p>

      <h2>6. Emergency contacts</h2>
      <p>
        Emergency contacts are people who do not use the Service. The Controller collects their
        details from its own people and must inform them under Article 14 GDPR. To help, the Service
        shows a notice under the emergency-contact fields to whoever fills them in, and asks them to
        pass it on. The notice names the Controller and carries the Contact section&rsquo;s current
        retention period. The Controller may replace our default wording with its own, and is
        responsible for what its notice says.
      </p>

      <h2>7. Retention and erasure</h2>
      <p>
        Each section is kept for as long as the person works for the Controller, and then for the
        retention period the Controller sets for it. The period counts from the later of the
        person&rsquo;s last day and the day the end of their employment was recorded. Until the
        Controller changes them, the periods are:
      </p>
      <table>
        <thead>
          <tr>
            <th>Section</th>
            <th>Kept after leaving</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Card</td>
            <td>Until the record is erased</td>
          </tr>
          <tr>
            <td>Photo</td>
            <td>1 year</td>
          </tr>
          <tr>
            <td>Work contact</td>
            <td>30 days</td>
          </tr>
          <tr>
            <td>Job</td>
            <td>Until the record is erased</td>
          </tr>
          <tr>
            <td>Contact</td>
            <td>30 days</td>
          </tr>
          <tr>
            <td>Personal</td>
            <td>3 years</td>
          </tr>
        </tbody>
      </table>
      <p>
        A nightly run removes every section past its period, unless the Controller has placed a
        retention hold on that person. Shortening a period removes what is past it at the next run;
        lengthening it brings nothing back. The owner and org admins can erase a person&rsquo;s
        directory data at any time. Removed values leave our backups within seven days. Read-log
        entries outlive an erasure until their 12 months run out, because they hold no values.
      </p>

      <h2>8. Exports and requests from people</h2>
      <p>
        The owner and org admins can export one person&rsquo;s directory data, including the dates
        and purposes of reads of their sensitive sections, without the readers&rsquo; names. The
        owner can export the whole organization. We keep each export for seven days, and it
        downloads through a signed link. A person can also download their own records from each
        organization, and requests from people about directory data reach the Controller, as the DPA
        describes.
      </p>

      <h2>9. Turning the directory off and ending the service</h2>
      <p>
        Turning the directory off hides its pages and keeps its data, and retention periods keep
        running. Deleting all directory data is a separate act only the owner can take. When the
        organization is deleted, we delete its directory data with the rest of its organization
        data, together with its data key, so the Contact and Personal values left in our database
        backups can no longer be read.
      </p>

      <h2>10. Versions</h2>
      <p>
        We record who accepted this agreement, when, and which version. When we publish a new
        version, the owner is asked to accept it on their next visit, and the directory keeps
        working meanwhile. Until the owner accepts it, the version they last accepted applies.
      </p>

      <h2>11. Contact</h2>
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
