import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPage from "../privacy/page";
import TermsPage from "../terms/page";
import SecurityPage from "../security/page";
import ContactPage from "../contact/page";

function sectionText(heading: HTMLElement): string {
  let text = "";
  for (let el = heading.nextElementSibling; el && el.tagName !== "H2"; el = el.nextElementSibling) {
    text += ` ${el.textContent ?? ""}`;
  }
  return text.replace(/\s+/g, " ");
}

describe("Legal pages", () => {
  it("Privacy page renders its heading and controller email", () => {
    render(<PrivacyPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /daniel@hrynusiw\.cz/ }).length).toBeGreaterThan(0);
  });

  it("Privacy page describes the attachments data category", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("Support communications")).toBeInTheDocument();
    expect(screen.getByText("Request attachments")).toBeInTheDocument();
    expect(screen.getByText(/doctor.s note/)).toBeInTheDocument();
    expect(screen.getByText(/encrypted at rest on AWS in Frankfurt/)).toBeInTheDocument();
    expect(screen.getByText(/only you, the group.s approvers and its admins/)).toBeInTheDocument();
    expect(screen.getByText(/twelve months after the absence it belongs to/)).toBeInTheDocument();
  });

  it("Legal pages carry the current update date", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("Last updated: 28 October 2026")).toBeInTheDocument();
  });

  it("Privacy page describes attendance location, its audience and its retention", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("Attendance location")).toBeInTheDocument();
    expect(
      screen.getByText(/latitude, longitude and accuracy your browser reports/)
    ).toBeInTheDocument();
    expect(screen.getByText(/declining is neither recorded nor flagged/)).toBeInTheDocument();
    expect(
      screen.getByText(/visible to you and to the administrators of your organisation/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/erase them twelve months after the business date/)
    ).toBeInTheDocument();
  });

  it("Privacy page names us controller of account data and processor of organization data", () => {
    render(<PrivacyPage />);
    const text = sectionText(screen.getByRole("heading", { name: "1. Who we are" }));
    expect(text).toMatch(/data controller.* of your account data/);
    expect(text).toMatch(/processor.* of organization data/);
    expect(text).toMatch(/on every plan/);
    expect(text).not.toMatch(/We are the data controller for the personal data described/);
  });

  it("Privacy page says what deleting the account removes and what the employer keeps", () => {
    render(<PrivacyPage />);
    const text = sectionText(screen.getByRole("heading", { name: "8. How long we keep it" }));
    expect(text).toMatch(/removes your account data from our live systems at once/);
    expect(text).toMatch(/does not delete the records the organizations you work in hold/);
    expect(text).toMatch(/Your employments stay open/);
    expect(text).toMatch(/leave, request attachments, attendance, quotas and the change log stay/);
    expect(text).toMatch(/Leave requests still pending are cancelled/);
    expect(text).toMatch(/the day is flagged for an admin/);
    expect(text).toMatch(/deletes the organization: its groups, its subscription record/);
    expect(text).toMatch(
      /remove the other members who have an account and cancel a renewing subscription/
    );
    expect(text).toMatch(/backups .* within seven days/);
    expect(text).toMatch(/unless we are legally required to keep it longer/);
    expect(text).not.toMatch(/what your team or employer could see/);
  });

  it("Privacy page sends organization data requests to the employer", () => {
    render(<PrivacyPage />);
    const text = sectionText(screen.getByRole("heading", { name: "9. Your rights" }));
    expect(text).toMatch(/your organization is the controller and answers/);
    expect(text).toMatch(/we forward it to the organization.s owner/);
  });

  it("Privacy page links its Czech version", () => {
    render(<PrivacyPage />);
    expect(screen.getByRole("link", { name: "Česká verze" })).toHaveAttribute(
      "href",
      "/cs/privacy/"
    );
  });

  it("Privacy page discloses the Google calendar scope, its limits and Limited Use", () => {
    render(<PrivacyPage />);
    const text = sectionText(
      screen.getByRole("heading", { name: "6. Calendar connections and Google user data" })
    );
    expect(text).toMatch(/calendar\.events\.owned/);
    expect(text).toMatch(/We do not read your other events/);
    expect(text).toMatch(/train AI or machine learning models/);
    expect(text).toMatch(
      /use and transfer to any other app of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements/
    );
    expect(
      screen.getByRole("link", { name: "Google API Services User Data Policy" })
    ).toHaveAttribute("href", "https://developers.google.com/terms/api-services-user-data-policy");
    expect(text).toMatch(/revoke our access at Google/);
  });

  it("Privacy page says deleting the account clears the connected calendars first", () => {
    render(<PrivacyPage />);
    const text = sectionText(
      screen.getByRole("heading", { name: "6. Calendar connections and Google user data" })
    );
    expect(text).toMatch(
      /When you delete your flexiday account, we do the same for every connected calendar first/
    );
    expect(text).toMatch(/Anything we cannot remove or revoke at that point stays/);
    expect(text).toMatch(/remove flexiday’s access in your Google account permissions/);
    expect(text).not.toMatch(/without disconnecting first/);
  });

  it("Terms page still lets the user delete their Account at any time", () => {
    render(<TermsPage />);
    expect(
      screen.getByText(/You may stop using the Service and delete your Account at any time/)
    ).toBeInTheDocument();
  });

  it("Privacy page lists Apple Push Notification service and what it sees", () => {
    render(<PrivacyPage />);
    const row = screen.getByRole("row", { name: /Apple Push Notification service/ });
    expect(row).toHaveTextContent("Delivers push notifications to your iPhone");
    expect(row).toHaveTextContent("sees the notification text: names, leave and attendance dates");
  });

  it("Privacy page gives push notifications the transactional-email legal basis", () => {
    render(<PrivacyPage />);
    const push = screen.getByRole("row", { name: /Send push notifications to the iPhone app/ });
    const email = screen.getByRole("row", { name: /Send transactional emails/ });
    expect(push).toHaveTextContent("Performance of a contract (b) / legitimate interests (f)");
    expect(email).toHaveTextContent("Performance of a contract (b) / legitimate interests (f)");
  });

  it("Privacy page says the push token is kept only when notifications are allowed", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("Push token")).toBeInTheDocument();
    expect(
      screen.getByText(/only if you allow notifications in the iPhone app/)
    ).toBeInTheDocument();
  });

  it("Terms page puts the location agreement on the employer", () => {
    render(<TermsPage />);
    expect(
      screen.getByRole("heading", { name: "7. Attendance and employee location" })
    ).toBeInTheDocument();
    expect(screen.getByText(/It is your responsibility to inform the people/)).toBeInTheDocument();
    expect(
      screen.getByText(/records nothing about that agreement and cannot verify it/)
    ).toBeInTheDocument();
  });

  it("Terms page takes the Data Processing Agreement in by reference", () => {
    render(<TermsPage />);
    const text = sectionText(screen.getByRole("heading", { name: "8. Data protection" }));
    expect(text).toMatch(/the organization is the controller and we are its processor/);
    expect(text).toMatch(/forms part of these Terms/);
    expect(text).toMatch(/every organization on every plan/);
    expect(text).toMatch(/the Data Processing Agreement prevails/);
    expect(screen.getAllByRole("link", { name: "Data Processing Agreement" })[0]).toHaveAttribute(
      "href",
      "/dpa/"
    );
  });

  it("Terms page says account deletion leaves the organization's records", () => {
    render(<TermsPage />);
    expect(
      screen.getByText(
        /does not delete the Organization data that the organizations you work in keep/
      )
    ).toBeInTheDocument();
  });

  it("Terms page links its Czech version", () => {
    render(<TermsPage />);
    expect(screen.getByRole("link", { name: "Česká verze" })).toHaveAttribute("href", "/cs/terms/");
  });

  it("Terms page renders its heading", () => {
    render(<TermsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeInTheDocument();
  });

  it("Security page renders its heading and disclosure guidance", () => {
    render(<SecurityPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Security" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Responsible disclosure" })).toBeInTheDocument();
  });

  it("Security page explains how attachments are stored and reached", () => {
    render(<SecurityPage />);
    expect(screen.getByRole("heading", { name: "Attachments" })).toBeInTheDocument();
    expect(
      screen.getByText(/encrypted at rest, and are never reachable by a public link/)
    ).toBeInTheDocument();
  });

  it("Contact page renders its heading", () => {
    render(<ContactPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Contact us" })).toBeInTheDocument();
  });
});

describe("Data Processing Agreement page", () => {
  it("covers what Article 28(3) GDPR asks a processor contract to say", async () => {
    const { default: DpaPage } = await import("../dpa/page");
    render(<DpaPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Data Processing Agreement" })
    ).toBeInTheDocument();
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    for (const topic of [
      /Subject matter/,
      /Instructions/,
      /Confidentiality/,
      /Security/,
      /Sub-processors/,
      /requests from people/,
      /breaches/,
      /End of the service/,
      /Audits/,
    ]) {
      expect(headings.some((h) => topic.test(h ?? ""))).toBe(true);
    }
  });

  it("keeps the organization's records when a person deletes their account", async () => {
    const { default: DpaPage } = await import("../dpa/page");
    render(<DpaPage />);
    const text = sectionText(screen.getByRole("heading", { name: /End of the service/ }));
    expect(text).toMatch(/is not an instruction from the organization/);
    expect(text).toMatch(/deleting the organization/);
    expect(text).toMatch(/within seven days/);
  });

  it("lists only sub-processors the Privacy Policy also names", async () => {
    const { default: DpaPage } = await import("../dpa/page");
    const dpa = render(<DpaPage />);
    const firstCells = (container: HTMLElement) =>
      [...container.querySelectorAll("tbody tr td:first-child")].map((td) => td.textContent);
    const subProcessors = firstCells(dpa.container);
    dpa.unmount();
    const privacy = render(<PrivacyPage />);
    expect(subProcessors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Amazon Web Services/),
        expect.stringMatching(/Sentry/),
      ])
    );
    expect(firstCells(privacy.container)).toEqual(expect.arrayContaining(subProcessors));
  });

  it("links its Czech version", async () => {
    const { default: DpaPage } = await import("../dpa/page");
    render(<DpaPage />);
    expect(screen.getByRole("link", { name: "Česká verze" })).toHaveAttribute("href", "/cs/dpa/");
  });
});

describe("Directory agreement page", () => {
  it("renders the agreement as a draft with its version", async () => {
    const { default: DirectoryAgreementPage } = await import("../directory-agreement/page");
    render(<DirectoryAgreementPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "People directory agreement" })
    ).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(/Draft\./);
    expect(screen.getByText(/^Version 1\./)).toBeInTheDocument();
  });
});

describe("Czech legal pages", () => {
  const pairs = [
    {
      name: "privacy",
      en: () => import("../privacy/page"),
      cs: () => import("../cs/privacy/page"),
    },
    { name: "terms", en: () => import("../terms/page"), cs: () => import("../cs/terms/page") },
    { name: "dpa", en: () => import("../dpa/page"), cs: () => import("../cs/dpa/page") },
  ];

  for (const pair of pairs) {
    it(`keeps the ${pair.name} page's sections in step with the English one`, async () => {
      const { default: En } = await pair.en();
      const { default: Cs } = await pair.cs();
      const en = render(<En />);
      const enSections = en.container.querySelectorAll("h2").length;
      en.unmount();
      const cs = render(<Cs />);
      expect(cs.container.querySelectorAll("h2").length).toBe(enSections);
      expect(cs.container.querySelector("[lang='cs']")).not.toBeNull();
      expect(screen.getByText("Poslední aktualizace: 28. října 2026")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "English version" })).toHaveAttribute(
        "href",
        `/${pair.name}/`
      );
    });
  }

  it("Czech privacy page describes the dual role and what account deletion keeps", async () => {
    const { default: CsPrivacy } = await import("../cs/privacy/page");
    render(<CsPrivacy />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Zásady ochrany osobních údajů" })
    ).toBeInTheDocument();
    const role = sectionText(screen.getByRole("heading", { name: "1. Kdo jsme" }));
    expect(role).toMatch(/správcem.* údajů vašeho účtu/);
    expect(role).toMatch(/zpracovatelem.* údajů organizace/);
    expect(role).toMatch(/u všech tarifů/);
    const keep = sectionText(
      screen.getByRole("heading", { name: "8. Jak dlouho údaje uchováváme" })
    );
    expect(keep).toMatch(/Vaše pracovní poměry zůstávají otevřené/);
    expect(keep).toMatch(/Čekající žádosti se zruší/);
    expect(keep).toMatch(/do sedmi dnů/);
  });

  it("Czech terms take the Czech DPA in by reference", async () => {
    const { default: CsTerms } = await import("../cs/terms/page");
    render(<CsTerms />);
    const text = sectionText(screen.getByRole("heading", { name: "8. Ochrana osobních údajů" }));
    expect(text).toMatch(/je součástí těchto Podmínek/);
    expect(
      screen.getAllByRole("link", { name: "Smlouva o zpracování osobních údajů" })[0]
    ).toHaveAttribute("href", "/cs/dpa/");
  });
});
