// NOTE: Information for an organization's own impact assessment, promised by DPA section 11.
// Have it reviewed by a qualified lawyer before relying on it. Keep it in step with
// app/(legal)/cs/ai-dpia/page.tsx and with the AI features agreement.
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { aiTextsPublished, aiTextsUpdated, LEGAL } from "@/lib/legal";

export function generateMetadata(): Metadata {
  return {
    title: "AI features: information for your DPIA · flexiday",
    description:
      "The data flow, sub-processors, retention and safeguards of the Assistant and AI connections, for an organization's data protection impact assessment.",
    ...(aiTextsPublished() ? {} : { robots: { index: false, follow: false } }),
  };
}

export default function AiDpiaPage() {
  return (
    <LegalShell
      title="AI features: information for your DPIA"
      updated={aiTextsUpdated("en")}
      intro="What an organization needs about the Assistant and AI connections for its own data protection impact assessment (DPIA)."
      translatedPage="ai-dpia"
    >
      <h2>1. What this page is for</h2>
      <p>
        The organization is the controller of the data its people put into the Assistant and the
        data their AI apps read, and it decides whether it needs a data protection impact assessment
        under Article 35 GDPR before turning either feature on. The people concerned are employees,
        and the features use AI, so many organizations will. Section 11 of our{" "}
        <a href="/dpa/">Data Processing Agreement</a> promises the information for it, and this page
        gives it. It is not an assessment in itself: the organization weighs the risks for its own
        people and purposes.
      </p>
      <p>
        The <a href="/ai-agreement/">AI features agreement</a> is the binding text. Where this page
        and the agreement differ, the agreement prevails.
      </p>

      <h2>2. What the features do</h2>
      <ul>
        <li>
          <strong>The Assistant</strong> is an AI chat inside Flexi Day, on the Enterprise plan.
          Members ask it about their time off, attendance and colleagues, and ask it to make
          changes, such as requesting leave or approving a request they are allowed to decide.
        </li>
        <li>
          <strong>AI connections</strong> let a member connect an AI app they already use, such as
          Claude or ChatGPT, to their own account, on any paid plan. The app reads what the member
          can see in one organization and, if the owner allows read and write, makes the changes the
          member could make on their own records.
        </li>
      </ul>
      <p>
        Both are off until the owner turns them on, and the owner can turn either off at any time.
      </p>

      <h2>3. Data flow</h2>
      <h3>The Assistant</h3>
      <ol>
        <li>A member writes a message in Flexi Day. It reaches our servers on {LEGAL.hosting}.</li>
        <li>
          A separate Anthropic model checks the message first. A message it refuses, for example one
          far from Flexi Day&rsquo;s topics, goes no further and is kept only in our copy of the
          chat.
        </li>
        <li>
          The message goes to Anthropic with the member&rsquo;s name, role, organization, language
          and the date. The Assistant answers, and to do so it asks our servers for Flexi Day data
          through tools. Each tool runs on our servers with the member&rsquo;s own permissions, so
          it returns only what the member can already see, and its result goes to Anthropic.
        </li>
        <li>
          A change the Assistant proposes becomes a card in the chat. Nothing changes until the
          member confirms it, and the change then runs with fresh permission checks.
        </li>
        <li>
          We keep the chat as members see it in our database in Frankfurt. Anthropic keeps the
          session, which is the model&rsquo;s memory of the chat, in the United States.
        </li>
      </ol>
      <h3>AI connections</h3>
      <ol>
        <li>
          The member connects an app through a sign-in and consent screen that names the app, and
          picks one organization. The app gets a token for that organization only, never the
          member&rsquo;s password.
        </li>
        <li>
          The app calls our server. Each call is checked against the member&rsquo;s permissions, the
          owner&rsquo;s setting (read only, or read and write) and the plan, and returns only what
          the member can see.
        </li>
        <li>
          What the app reads goes to the company behind that app, under the member&rsquo;s own
          agreement with it. That company is not our sub-processor. Once data reaches the app, our
          processing and our responsibility end.
        </li>
      </ol>

      <h2>4. Data and people</h2>
      <ul>
        <li>
          <strong>People</strong>: the organization&rsquo;s members who use the features, and the
          colleagues whose records they can see.
        </li>
        <li>
          <strong>Chats</strong>: what members write, the answers, and the Flexi Day data read to
          answer: leave requests and balances, attendance, group events and birthdays, and directory
          entries, as far as the member can see them. Sick leave can reveal health data, a special
          category under Article 9 GDPR. Tools never return the contents of attachments.
        </li>
        <li>
          <strong>Usage records</strong>: who used the Assistant when, which model, tokens and cost,
          how many of a person&rsquo;s messages were refused, and daily counts of calls from AI
          apps. No content.
        </li>
        <li>
          <strong>Connection records</strong>: for each AI connection, the app&rsquo;s name and
          address, the member, the organization, the access granted and when it was last used.
        </li>
        <li>
          Changes made through the Assistant or an AI app are marked with that channel in the
          request history, the attendance history and the directory&rsquo;s read log.
        </li>
      </ul>

      <h2>5. Sub-processors and recipients</h2>
      <table>
        <thead>
          <tr>
            <th>Who</th>
            <th>Role</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Anthropic, PBC</td>
            <td>
              Sub-processor. Runs the Assistant and the message check, only for organizations that
              turn the Assistant on. Its own sub-processors are on{" "}
              <a href="https://trust.anthropic.com/subprocessors">Anthropic&rsquo;s list</a>
            </td>
            <td>
              United States (storage); processing in any country where Anthropic runs its models
            </td>
          </tr>
          <tr>
            <td>Amazon Web Services (AWS)</td>
            <td>Sub-processor. Hosting and the database, including our copy of each chat</td>
            <td>EU (Frankfurt, Germany)</td>
          </tr>
          <tr>
            <td>Functional Software, Inc. (Sentry)</td>
            <td>
              Sub-processor. Error and performance monitoring: pseudonymous ids and timings, never
              chat text, tool arguments or results
            </td>
            <td>EU region (Frankfurt, Germany); the company is based in the United States</td>
          </tr>
          <tr>
            <td>The company behind each connected AI app</td>
            <td>
              Recipient chosen by the member, under the member&rsquo;s own agreement. Not our
              sub-processor
            </td>
            <td>Depends on the app</td>
          </tr>
        </tbody>
      </table>
      <p>
        The transfer to Anthropic rests on the European Commission&rsquo;s Standard Contractual
        Clauses, Module 3 (processor to processor). Anthropic is not certified under the EU-U.S.
        Data Privacy Framework. Because Anthropic may run inference in countries it does not name, a
        transfer impact assessment has to cover that. Anthropic tells us about changes to its own
        sub-processors 15 days ahead, and we pass each change on as soon as we receive it.
      </p>

      <h2>6. Retention</h2>
      <ul>
        <li>
          We keep a chat for 180 days after its last message, and a member can delete their own
          chats sooner.
        </li>
        <li>
          Anthropic deletes a chat 30 days after its last message, or at once when the chat is
          deleted. Anthropic keeps a message its safety systems flag for up to 2 years, to enforce
          its usage policy.
        </li>
        <li>
          A member who leaves the organization, is removed from it or deletes their account loses
          their chats in that organization at once, here and at Anthropic. Deleting the organization
          deletes every chat it holds.
        </li>
        <li>
          Usage records are kept for 90 days, then as weekly totals per person for 180 days, then as
          organization totals that name nobody.
        </li>
        <li>
          Connection records are kept until the app is disconnected, which also happens on a
          password reset or change and on account deletion.
        </li>
        <li>Our backups age out within seven days.</li>
      </ul>

      <h2>7. Safeguards</h2>
      <ul>
        <li>Neither we nor Anthropic train models on the organization&rsquo;s data.</li>
        <li>
          Both features read only what the member can already see, through the same permission
          checks as the app, and stay inside the one organization the chat or connection belongs to.
        </li>
        <li>
          Every change the Assistant proposes waits for the member to confirm it. The Assistant
          never recommends approving or rejecting someone else&rsquo;s request; it shows the facts
          and the approver decides. The chat tells members that the Assistant is an AI and that its
          answers can be wrong.
        </li>
        <li>
          Text that people wrote, such as notes on requests, reaches the model marked as such and is
          never treated as an instruction. A separate check screens each message before the
          Assistant sees it.
        </li>
        <li>
          The owner and org admins see each person&rsquo;s usage and how many of their messages were
          refused, never what anyone wrote.
        </li>
        <li>
          AI apps sign in with OAuth, get one organization per connection and only the access the
          owner allows, and lose it when the member disconnects, resets or changes their password,
          or when the owner turns AI connections off.
        </li>
        <li>
          Each organization has a Weekly limit on the Assistant and a daily AI connection limit, and
          each member a daily limit on AI app calls.
        </li>
        <li>
          Our logs and error reports never record chat text, tool arguments or results. Data is
          encrypted in transit and at rest.
        </li>
      </ul>

      <h2>8. Points for your assessment</h2>
      <ul>
        <li>Answers can be wrong. Changes need the member&rsquo;s confirmation, answers do not.</li>
        <li>
          Chats are stored in the United States and may be processed in other countries, as section
          5 describes.
        </li>
        <li>
          Owners and org admins see per-person usage and refused messages. Check whether your
          employment law treats that as monitoring of employees.
        </li>
        <li>
          Members may connect AI apps on personal accounts, which may keep what they read or train
          on it. Your own policy decides which apps your people may use; read only limits what they
          can change.
        </li>
      </ul>

      <h2>9. Anthropic&rsquo;s SOC 2 report</h2>
      <p>
        Anthropic gives its SOC 2 reports to its customers on written request. To see one, write to{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> from your organization&rsquo;s owner
        account email. We request the current report from Anthropic and share it with you under
        Anthropic&rsquo;s confidentiality terms.
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
