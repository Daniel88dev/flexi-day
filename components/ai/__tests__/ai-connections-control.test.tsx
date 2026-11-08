import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import type { AiAvailability } from "@/lib/api/ai-features";
import type { AiSettings } from "@/lib/api/ai-settings";
import { AiCard } from "../ai-card";

let settings: AiSettings;
let availability: AiAvailability;
const enableConnections = vi.fn();
const setLevel = vi.fn();
const disableConnections = vi.fn();
const copyText = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  useAiSettings: () => ({ data: settings, isLoading: false }),
  useAiAvailability: () => ({ data: availability }),
  useEnableAssistant: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDisableAssistant: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEnableAiConnections: () => ({ mutateAsync: enableConnections, isPending: false }),
  useSetAiConnectionsLevel: () => ({ mutateAsync: setLevel, isPending: false }),
  useDisableAiConnections: () => ({ mutateAsync: disableConnections, isPending: false }),
}));
vi.mock("@/components/toast", () => ({
  pushToast: vi.fn(),
  copyText: (text: string) => copyText(text),
}));

const NOTICE = {
  en: { title: "Acme allows AI connections.", body: "You can connect an AI app in Settings." },
  cs: {
    title: "V organizaci Acme jsou povolená AI připojení.",
    body: "V Nastavení si můžeš připojit AI aplikaci.",
  },
};

const ACCEPTED = {
  currentVersion: 1,
  acceptedVersion: 1,
  acceptedAt: "2026-11-02T09:00:00Z",
  acceptedByName: "Olga Owner",
  newVersionReady: false,
};

const aiSettings = (overrides: Partial<AiSettings> = {}): AiSettings => ({
  organizationId: "org-1",
  isOwner: true,
  ownerName: "Olga Owner",
  plan: "PRO",
  assistant: {
    enabled: false,
    enabledAt: null,
    planAllows: false,
    weeklyLimitMicroUsd: 10_000_000,
  },
  aiConnections: { level: "off", planAllows: true, grants: [] },
  agreement: {
    currentVersion: 1,
    acceptedVersion: null,
    acceptedAt: null,
    acceptedByName: null,
    newVersionReady: false,
  },
  memberNotice: { assistant: NOTICE, aiConnections: NOTICE },
  ...overrides,
});

const open = (assistant: boolean, aiConnections: boolean): AiAvailability => ({
  assistant,
  aiConnections,
  organizations: [
    { organizationId: "org-1", assistant, aiConnections, newAgreementVersionReady: false },
  ],
});

const renderCard = () =>
  renderWithClient(<AiCard organizationId="org-1" organizationName="Acme" />);

const levels = () => screen.getByRole("radiogroup", { name: "AI connections" });
const level = (name: string) => within(levels()).getByRole("radio", { name });

describe("AiCard: AI connections", () => {
  beforeEach(() => {
    settings = aiSettings();
    availability = open(true, true);
    for (const mock of [enableConnections, setLevel, disableConnections]) {
      mock.mockReset();
      mock.mockResolvedValue(settings);
    }
    copyText.mockReset();
    window.localStorage.clear();
  });

  it("shows a Pro owner the setting Off, ready to change", () => {
    renderCard();

    expect(level("Off")).toBeChecked();
    for (const name of ["Off", "Read only", "Read and write"]) {
      expect(level(name)).toBeEnabled();
    }
    expect(
      screen.getByText("Off. Members can't connect AI apps such as Claude or ChatGPT to Flexi Day.")
    ).toBeInTheDocument();
  });

  it("turns on after the owner accepts the agreement, at Read only by default, telling members", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(level("Read only"));
    const dialog = await screen.findByRole("dialog", {
      name: "Turn on AI connections for Acme?",
    });
    expect(
      within(dialog).getByText("Read this before you turn it on. You can turn it off any time.")
    ).toBeInTheDocument();
    for (const term of [
      "What it does",
      "What leaves Flexi Day",
      "Which apps",
      "Read only",
      "Read and write",
      "Limits",
    ]) {
      expect(within(dialog).getAllByText(term).length).toBeGreaterThan(0);
    }
    expect(
      within(dialog).getByText(
        "What the app reads goes to the company behind that app, under the member's own agreement with them. Flexi Day has no agreement with those companies. Once data reaches the app, that company handles it, not us."
      )
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Personal accounts of AI apps may keep what they read or train on it. Your organization's own policy decides which apps your people may use."
      )
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "5,000 calls a day for the organization, 1,000 a day per member. Nothing extra to pay."
      )
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Read the AI features agreement" })
    ).toHaveAttribute("href", "/ai-agreement");
    expect(within(dialog).queryByText(/sub-processor/)).toBeNull();

    const startWith = within(dialog).getByRole("radiogroup", { name: "Start with" });
    expect(within(startWith).getByRole("radio", { name: /^Read only/ })).toBeChecked();
    expect(within(dialog).getByRole("checkbox", { name: "Tell members" })).toBeChecked();
    const confirm = within(dialog).getByRole("button", { name: "Accept and turn on" });
    expect(confirm).toBeDisabled();
    await user.click(
      within(dialog).getByRole("checkbox", { name: "I accept the AI features agreement for Acme." })
    );
    await user.click(confirm);

    expect(enableConnections).toHaveBeenCalledWith({
      level: "read",
      agreementVersion: 1,
      tellMembers: true,
    });
  });

  it("starts at Read and write when the owner picked it, with the agreement already accepted", async () => {
    settings = aiSettings({ plan: "ENTERPRISE", agreement: ACCEPTED });
    const user = userEvent.setup();
    renderCard();

    await user.click(level("Read and write"));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(
        "20,000 calls a day for the organization, 1,000 a day per member. Nothing extra to pay."
      )
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole("checkbox", { name: /I accept/ })).toBeNull();
    expect(
      within(dialog).getByText(
        "AI features agreement version 1, accepted by Olga Owner on 02/11/2026"
      )
    ).toBeInTheDocument();
    const startWith = within(dialog).getByRole("radiogroup", { name: "Start with" });
    expect(within(startWith).getByRole("radio", { name: /^Read and write/ })).toBeChecked();
    await user.click(within(dialog).getByRole("checkbox", { name: "Tell members" }));
    await user.click(within(dialog).getByRole("button", { name: "Turn on AI connections" }));

    expect(enableConnections).toHaveBeenCalledWith({
      level: "write",
      agreementVersion: 1,
      tellMembers: false,
    });
  });

  it("raises Read only to Read and write with no dialog", async () => {
    settings = aiSettings({
      aiConnections: { level: "read", planAllows: true, grants: [] },
      agreement: ACCEPTED,
    });
    const user = userEvent.setup();
    renderCard();

    expect(
      screen.getByText("Members' AI apps can read what the member can see.")
    ).toBeInTheDocument();
    await user.click(level("Read and write"));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(setLevel).toHaveBeenCalledWith("write");
  });

  it("warns before lowering to Read only", async () => {
    settings = aiSettings({
      aiConnections: { level: "write", planAllows: true, grants: [] },
      agreement: ACCEPTED,
    });
    const user = userEvent.setup();
    renderCard();

    await user.click(level("Read only"));
    const dialog = await screen.findByRole("dialog", {
      name: "Switch AI connections to read only?",
    });
    expect(
      within(dialog).getByText(
        "This disconnects every app that has write access now. Their members can connect again with read access."
      )
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Disconnect and switch" }));

    expect(setLevel).toHaveBeenCalledWith("read");
  });

  it("warns before turning off, and copies the members' notice while on", async () => {
    settings = aiSettings({
      aiConnections: { level: "read", planAllows: true, grants: [] },
      agreement: ACCEPTED,
    });
    const user = userEvent.setup();
    renderCard();

    expect(
      screen.getByText("AI features agreement version 1, accepted by Olga Owner on 02/11/2026")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Copy the members' notice" }));
    expect(copyText).toHaveBeenCalledWith(
      "Acme allows AI connections. You can connect an AI app in Settings."
    );

    await user.click(level("Off"));
    const dialog = await screen.findByRole("dialog", { name: "Turn off AI connections?" });
    expect(
      within(dialog).getByText(
        "This disconnects every connected app now. If you turn it on again, every member has to connect again."
      )
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Disconnect all and turn off" }));

    expect(disableConnections).toHaveBeenCalled();
  });

  const GRANTS: AiSettings["aiConnections"]["grants"] = [
    {
      grantId: "g-1",
      app: {
        clientId: "https://claude.ai/meta",
        name: "Claude",
        verified: true,
        host: "claude.ai",
      },
      userId: "u-1",
      personName: "Jana Novák",
      access: "write",
    },
    {
      grantId: "g-2",
      app: { clientId: "abc", name: null, verified: false, host: "localhost:8787" },
      userId: "u-2",
      personName: "Petr Svoboda",
      access: "read",
    },
  ];

  const affectedIn = (dialog: HTMLElement) =>
    within(within(dialog).getByRole("list", { name: "Apps it disconnects" }))
      .getAllByRole("listitem")
      .map((item) => item.textContent);

  it("names the write apps lowering disconnects, and every app turning off does", async () => {
    settings = aiSettings({
      aiConnections: { level: "write", planAllows: true, grants: GRANTS },
      agreement: ACCEPTED,
    });
    const user = userEvent.setup();
    renderCard();

    await user.click(level("Read only"));
    const lower = await screen.findByRole("dialog", {
      name: "Switch AI connections to read only?",
    });
    expect(affectedIn(lower)).toEqual(["ClaudeJana Novák"]);
    await user.click(within(lower).getByRole("button", { name: "Cancel" }));

    await user.click(level("Off"));
    const off = await screen.findByRole("dialog", { name: "Turn off AI connections?" });
    expect(affectedIn(off)).toEqual(["ClaudeJana Novák", "localhost:8787Petr Svoboda"]);
  });

  it("says when lowering disconnects nothing", async () => {
    settings = aiSettings({
      aiConnections: { level: "write", planAllows: true, grants: [GRANTS[1]!] },
      agreement: ACCEPTED,
    });
    const user = userEvent.setup();
    renderCard();

    await user.click(level("Read only"));
    const dialog = await screen.findByRole("dialog", {
      name: "Switch AI connections to read only?",
    });
    expect(
      within(dialog).getByText("No app has write access now, so nothing is disconnected.")
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole("list")).toBeNull();
  });

  it("sends a Free owner to the plans", () => {
    settings = aiSettings({
      plan: "FREE",
      aiConnections: { level: "off", planAllows: false, grants: [] },
    });
    renderCard();

    for (const name of ["Off", "Read only", "Read and write"]) {
      expect(level(name)).toBeDisabled();
    }
    expect(screen.getByText("AI connections come with every paid plan.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "See plans" })[0]).toHaveAttribute(
      "href",
      "/billing"
    );
  });

  it("lets a lapsed owner lower or turn off but not raise", () => {
    settings = aiSettings({
      plan: "FREE",
      aiConnections: { level: "read", planAllows: false, grants: [] },
    });
    renderCard();

    expect(level("Off")).toBeEnabled();
    expect(level("Read and write")).toBeDisabled();
  });

  it("shows an org admin the setting read-only, naming the owner", () => {
    settings = aiSettings({
      isOwner: false,
      aiConnections: { level: "read", planAllows: true, grants: [] },
    });
    renderCard();

    for (const name of ["Off", "Read only", "Read and write"]) {
      expect(level(name)).toBeDisabled();
    }
    expect(
      screen.getAllByText("Only Olga Owner, the owner, can change this.").length
    ).toBeGreaterThan(0);
  });

  it("shows only the AI connections half while the Assistant is unavailable", () => {
    availability = open(false, true);
    renderCard();

    expect(levels()).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Assistant" })).toBeNull();
  });

  it("shows only the Assistant half while AI connections are unavailable", () => {
    availability = open(true, false);
    renderCard();

    expect(screen.getByRole("switch", { name: "Assistant" })).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup", { name: "AI connections" })).toBeNull();
  });

  it("asks a Czech owner in T-695's Czech words", async () => {
    window.localStorage.setItem("flexiday-locale", "cs");
    const user = userEvent.setup();
    renderWithClient(
      <I18nProvider>
        <AiCard organizationId="org-1" organizationName="Acme" />
      </I18nProvider>
    );

    await waitFor(() =>
      expect(screen.getByRole("radiogroup", { name: "AI připojení" })).toBeInTheDocument()
    );
    await user.click(screen.getByRole("radio", { name: "Jen čtení" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Zapnout AI připojení pro Acme?",
    });
    expect(
      within(dialog).getByText(
        "Co aplikace přečte, jde ke společnosti, která za ní stojí, podle vlastní smlouvy člena s ní. Flexi Day s těmito společnostmi žádnou smlouvu nemá. Jakmile data do aplikace dorazí, nakládá s nimi ta společnost, ne my."
      )
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Osobní účty AI aplikací si mohou přečtená data uchovat nebo na nich trénovat. Které aplikace mohou vaši lidé používat, určují pravidla vaší organizace."
      )
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/^5\s000 volání denně pro organizaci/)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("checkbox", { name: "Přijímám Smlouvu o funkcích AI za Acme." })
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("checkbox", { name: "Dát vědět členům" })).toBeChecked();
    expect(within(dialog).getByRole("button", { name: "Přijmout a zapnout" })).toBeDisabled();
  });
});
