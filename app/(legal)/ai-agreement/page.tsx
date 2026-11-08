// NOTE: A good-faith Article 28 GDPR draft that adds to the DPA. Have it reviewed by a
// qualified lawyer before relying on it. Keep it in step with
// app/(legal)/cs/ai-agreement/page.tsx, and raise AI_AGREEMENT_VERSION in the backend and in
// lib/legal.ts with every change of substance.
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { AI_AGREEMENT_VERSION, aiTextsPublished, aiTextsUpdated, LEGAL } from "@/lib/legal";

// Reachable before Day 0 for the preview organizations, but kept out of search until then.
export function generateMetadata(): Metadata {
  return {
    title: "AI features agreement · flexiday",
    description:
      "The agreement an organization accepts when its owner first turns on the Assistant or AI connections. It adds to the Data Processing Agreement.",
    ...(aiTextsPublished() ? {} : { robots: { index: false, follow: false } }),
  };
}

export default function AiAgreementPage() {
  return (
    <LegalShell
      title="AI features agreement"
      updated={aiTextsUpdated("en")}
      intro={`Version ${AI_AGREEMENT_VERSION}. The owner of an organization accepts it on the organization’s behalf the first time they turn on the Assistant or AI connections.`}
      translatedPage="ai-agreement"
    >
      <h2>1. Parties and scope</h2>
      <p>
        This agreement is between the organization whose owner turns on an AI feature (the
        &ldquo;Controller&rdquo;), acting through its owner, and <strong>{LEGAL.entity}</strong>,{" "}
        {LEGAL.address}, IČO {LEGAL.ico} (the &ldquo;Processor&rdquo;, &ldquo;we&rdquo;). It adds to
        the <a href="/dpa/">Data Processing Agreement</a> (&ldquo;DPA&rdquo;) for the two AI
        features of the Service: the <strong>Assistant</strong> and <strong>AI connections</strong>.
      </p>
      <p>
        Everything the DPA says about organization data applies to the data these features handle,
        including breach notices, audits and help with requests. Where this agreement and the DPA
        differ on that data, this agreement prevails.
      </p>

      <h2>2. What the AI features are for</h2>
      <ul>
        <li>
          <strong>The Assistant</strong> is an AI chat inside the Service, on the Enterprise plan.
          Members ask it about their time off, attendance and colleagues, and ask it to make
          changes. It reads only what the member asking can already see, and every change waits
          until that member confirms it.
        </li>
        <li>
          <strong>AI connections</strong> let a member connect an AI app they already use, such as
          Claude or ChatGPT, to their own account. The app works with that member&rsquo;s own
          permissions in the organization.
        </li>
      </ul>
      <p>
        Both are off until the owner turns them on, and the owner can turn either off at any time.
      </p>

      <h2>3. The data involved</h2>
      <ul>
        <li>
          <strong>Chats</strong>: what a member writes to the Assistant, its answers, and the
          Service data it reads to answer, such as requests, balances, attendance and directory
          entries the member can see.
        </li>
        <li>
          <strong>The display record</strong>: the copy of each chat we keep so the member can read
          it back, with its tool activity lines, confirmation cards and their status, and messages
          the Assistant refused.
        </li>
        <li>
          <strong>Usage records</strong>: for each step of a chat, who, when, which model, the
          number of tokens and the cost. They hold no content.
        </li>
        <li>
          <strong>Connection records</strong>: for each AI connection, the app&rsquo;s name and
          address, the member, the organization, the access granted and when it was last used.
        </li>
      </ul>
      <p>
        The Assistant also receives the name and role of the member who is asking. Chats are{" "}
        <strong>organization data</strong>: we process them for the Controller under the DPA, on its
        instructions, and not for any purpose of our own.
      </p>

      <h2>4. The Controller&rsquo;s instructions</h2>
      <p>
        The owner&rsquo;s settings in the Service are the Controller&rsquo;s documented instructions
        under the DPA: turning the Assistant on or off, and allowing AI connections as read only,
        read and write, or not at all. A change takes effect as an instruction when it is saved.
      </p>
      <p>
        The Controller makes sure it has a legal basis for using the AI features with its
        people&rsquo;s data, and tells its people about them as Article 13 GDPR requires. The
        &ldquo;Tell members&rdquo; option sends everyone a notice in the app and on their phone; it
        does not replace the Controller&rsquo;s own information to its people.
      </p>
      <p>
        For its own data protection impact assessment, the Controller finds the data flow,
        sub-processors, retention and safeguards on the{" "}
        <a href="/ai-dpia/">DPIA information page</a>.
      </p>

      <h2>5. Anthropic as a sub-processor</h2>
      <p>
        The Assistant runs on <strong>Anthropic, PBC</strong>, a company in the United States, which
        the Controller authorizes as a sub-processor by accepting this agreement. Anthropic receives
        chat data only from organizations that turn the Assistant on.
      </p>
      <ul>
        <li>
          Anthropic stores chats in the United States, and may run inference in any country where
          Anthropic runs its models.
        </li>
        <li>
          The transfer rests on the EU Standard Contractual Clauses, Module 3 (processor to
          processor). Anthropic is not certified under the EU-U.S. Data Privacy Framework.
        </li>
        <li>Anthropic never trains models on the Controller&rsquo;s data, and neither do we.</li>
        <li>
          Anthropic keeps a message its safety systems flag for up to 2 years, to enforce its usage
          policy.
        </li>
        <li>
          Anthropic tells us about changes to its own sub-processors 15 days ahead. We pass each
          change on to the Controller as soon as we receive it, and the Controller may object as the
          DPA describes, or turn the Assistant off.
        </li>
      </ul>

      <h2>6. Retention and deletion</h2>
      <ul>
        <li>
          We keep a chat&rsquo;s display record for 180 days after its last message, and a member
          can delete their own chats sooner.
        </li>
        <li>
          Anthropic deletes a chat 30 days after its last message, or at once when the chat is
          deleted in the Service.
        </li>
        <li>
          When a member leaves the organization, is removed from it, or deletes their account, their
          chats in that organization are deleted at once, here and at Anthropic, and any change
          still waiting for their confirmation is cancelled.
        </li>
        <li>
          When the organization is deleted, every chat it holds is deleted, here and at Anthropic.
        </li>
        <li>
          Usage records are kept for 90 days. Each week then rolls into a total per person, kept for
          180 days, and after that into a total for the organization that names nobody.
        </li>
        <li>Connection records are kept until the member disconnects the app.</li>
        <li>
          Turning the Assistant off stops new messages at once. Chats stay readable until they are
          deleted as above.
        </li>
      </ul>

      <h2>7. What the owner and org admins see</h2>
      <p>
        The owner and org admins see how much each person uses the Assistant and how many of their
        messages it refused. They never see what anyone wrote.
      </p>

      <h2>8. AI connections</h2>
      <p>
        Allowing AI connections is the Controller&rsquo;s documented instruction to hand a
        member&rsquo;s app what that member can see in the organization, and, with read and write,
        to let it make the changes the member could make. The company behind the app is the
        member&rsquo;s choice, under the member&rsquo;s own agreement with it. It is not our
        sub-processor, and we have no agreement with it.
      </p>
      <p>
        Our responsibility ends when the data reaches the app. Personal accounts of AI apps may keep
        what they read or train on it, so the Controller&rsquo;s own policy decides which apps its
        people may use.
      </p>

      <h2>9. Versions</h2>
      <p>
        We record who accepted this agreement, when, and which version. When we publish a new
        version, the owner is asked to accept it on their next visit, and the Assistant and AI
        connections keep working meanwhile. Until the owner accepts it, the version they last
        accepted applies.
      </p>

      <h2>10. Contact</h2>
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
