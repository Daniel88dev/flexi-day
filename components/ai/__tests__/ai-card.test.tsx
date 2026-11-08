import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import { ApiError } from "@/lib/api/client";
import type { AiSettings } from "@/lib/api/ai-settings";
import { AiCard } from "../ai-card";

let settings: AiSettings | undefined;
const enable = vi.fn();
const disable = vi.fn();
const copyText = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  useAiSettings: () => ({ data: settings, isLoading: false }),
  // AI connections have their own suite; this one sees the Assistant half alone.
  useAiAvailability: () => ({
    data: {
      assistant: true,
      aiConnections: false,
      organizations: [
        {
          organizationId: "org-1",
          assistant: true,
          aiConnections: false,
          newAgreementVersionReady: false,
        },
      ],
    },
  }),
  useEnableAssistant: () => ({ mutateAsync: enable, isPending: false }),
  useDisableAssistant: () => ({ mutateAsync: disable, isPending: false }),
}));
vi.mock("@/components/toast", () => ({
  pushToast: vi.fn(),
  copyText: (text: string) => copyText(text),
}));

const NOTICE = {
  en: {
    title: "Acme turned on the Assistant.",
    body: "Ask it about your time off, attendance and colleagues.",
  },
  cs: {
    title: "V organizaci Acme je zapnutý Asistent.",
    body: "Ptej se ho na svou dovolenou, docházku a kolegy.",
  },
};

const aiSettings = (overrides: Partial<AiSettings> = {}): AiSettings => ({
  organizationId: "org-1",
  isOwner: true,
  ownerName: "Olga Owner",
  plan: "ENTERPRISE",
  assistant: { enabled: false, enabledAt: null, planAllows: true, weeklyLimitMicroUsd: 10_000_000 },
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

const accepted = {
  currentVersion: 1,
  acceptedVersion: 1,
  acceptedAt: "2026-11-02T09:00:00Z",
  acceptedByName: "Olga Owner",
  newVersionReady: false,
};

const renderCard = () =>
  renderWithClient(<AiCard organizationId="org-1" organizationName="Acme" />);

const assistantSwitch = () => screen.getByRole("switch", { name: "Assistant" });

describe("AiCard", () => {
  beforeEach(() => {
    settings = aiSettings();
    enable.mockReset();
    enable.mockResolvedValue(
      aiSettings({
        assistant: {
          enabled: true,
          enabledAt: null,
          planAllows: true,
          weeklyLimitMicroUsd: 10_000_000,
        },
      })
    );
    disable.mockReset();
    disable.mockResolvedValue(aiSettings());
    copyText.mockReset();
    window.localStorage.clear();
  });

  it("shows the Enterprise owner the switch off, with See AI usage in the header", () => {
    renderCard();
    expect(screen.getByRole("heading", { name: "AI" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See AI usage" })).toHaveAttribute("href", "/ai-usage");
    expect(assistantSwitch()).not.toBeChecked();
    expect(assistantSwitch()).toBeEnabled();
    expect(screen.getByText(/^Off\. Members don't see it\./)).toBeInTheDocument();
  });

  it("turns it on only after the owner accepts the agreement, telling members by default", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(assistantSwitch());
    const dialog = await screen.findByRole("dialog", { name: "Turn on the Assistant for Acme?" });
    expect(
      within(dialog).getByText("Read this before you turn it on. You can turn it off any time.")
    ).toBeInTheDocument();
    for (const term of [
      "What it does",
      "What leaves Flexi Day",
      "How long it's kept",
      "When someone leaves",
      "What it costs",
      "What you see",
    ]) {
      expect(within(dialog).getByText(term)).toBeInTheDocument();
    }
    expect(
      within(dialog).getByText(
        /stores them in the United States and may process them in other countries where it runs its models/
      )
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /Their chats are deleted when they leave Acme or delete their account\./
      )
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/pauses for everyone until \p{L}+.*\d{2}:\d{2}\.$/u)
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "This adds Anthropic as a sub-processor under the AI features agreement."
      )
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Read the AI features agreement" })
    ).toHaveAttribute("href", "/ai-agreement");
    expect(
      within(dialog).getByText("We record who accepted, when, and which version.")
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Everyone here gets a notice in the app and on their phone.")
    ).toBeInTheDocument();

    const confirm = within(dialog).getByRole("button", { name: "Accept and turn on" });
    expect(confirm).toBeDisabled();
    expect(within(dialog).getByRole("checkbox", { name: "Tell members" })).toBeChecked();
    await user.click(
      within(dialog).getByRole("checkbox", { name: "I accept the AI features agreement for Acme." })
    );
    await user.click(confirm);

    expect(enable).toHaveBeenCalledWith({ agreementVersion: 1, tellMembers: true });
  });

  it("shows who accepted instead of the checkbox once the current version is accepted", async () => {
    settings = aiSettings({ agreement: accepted });
    const user = userEvent.setup();
    renderCard();

    await user.click(assistantSwitch());
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("checkbox", { name: /I accept/ })).toBeNull();
    expect(
      within(dialog).getByText(
        "AI features agreement version 1, accepted by Olga Owner on 02/11/2026"
      )
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("checkbox", { name: "Tell members" }));
    await user.click(within(dialog).getByRole("button", { name: "Turn on the Assistant" }));

    expect(enable).toHaveBeenCalledWith({ agreementVersion: 1, tellMembers: false });
  });

  it("explains a stale agreement version", async () => {
    settings = aiSettings({ agreement: accepted });
    enable.mockRejectedValue(
      new ApiError(409, "conflict", undefined, [
        { message: "stale", context: { code: "AGREEMENT_VERSION_STALE" } },
      ])
    );
    const user = userEvent.setup();
    renderCard();

    await user.click(assistantSwitch());
    await user.click(await screen.findByRole("button", { name: "Turn on the Assistant" }));

    expect(await screen.findByText(/The agreement has changed\./)).toBeInTheDocument();
  });

  it("turns it off through the confirm dialog, and copies the members' notice while it is on", async () => {
    settings = aiSettings({
      assistant: {
        enabled: true,
        enabledAt: "2026-11-02T09:00:00Z",
        planAllows: true,
        weeklyLimitMicroUsd: 10_000_000,
      },
      agreement: accepted,
    });
    const user = userEvent.setup();
    renderCard();

    expect(screen.getByText("On. Every member can open it from the top bar.")).toBeInTheDocument();
    expect(
      screen.getByText("AI features agreement version 1, accepted by Olga Owner on 02/11/2026")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Copy the members' notice" }));
    expect(copyText).toHaveBeenCalledWith(
      "Acme turned on the Assistant. Ask it about your time off, attendance and colleagues."
    );

    await user.click(assistantSwitch());
    const dialog = await screen.findByRole("dialog", { name: "Turn off the Assistant?" });
    expect(
      within(dialog).getByText(
        "Members lose the Assistant at once. Their chats stay readable until they are 180 days old."
      )
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Turn off" }));
    expect(disable).toHaveBeenCalled();
  });

  it("tells a Pro owner the Assistant comes with Enterprise", () => {
    settings = aiSettings({
      plan: "PRO",
      assistant: {
        enabled: false,
        enabledAt: null,
        planAllows: false,
        weeklyLimitMicroUsd: 10_000_000,
      },
    });
    renderCard();

    expect(assistantSwitch()).toBeDisabled();
    expect(screen.getByText("The Assistant comes with Enterprise.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See Enterprise" })).toHaveAttribute(
      "href",
      "/billing"
    );
    expect(screen.queryByRole("link", { name: "See plans" })).toBeNull();
  });

  it("sends a Free owner to the plans, without See AI usage", () => {
    settings = aiSettings({
      plan: "FREE",
      assistant: {
        enabled: false,
        enabledAt: null,
        planAllows: false,
        weeklyLimitMicroUsd: 10_000_000,
      },
    });
    renderCard();

    expect(assistantSwitch()).toBeDisabled();
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/billing");
    expect(screen.queryByRole("link", { name: "See AI usage" })).toBeNull();
  });

  it("shows an org admin the setting read-only, naming the owner", () => {
    settings = aiSettings({ isOwner: false });
    renderCard();

    expect(assistantSwitch()).toBeDisabled();
    expect(screen.getByText("Only Olga Owner, the owner, can change this.")).toBeInTheDocument();
  });

  it("speaks Czech and copies the Czech notice", async () => {
    window.localStorage.setItem("flexiday-locale", "cs");
    settings = aiSettings({
      assistant: {
        enabled: true,
        enabledAt: null,
        planAllows: true,
        weeklyLimitMicroUsd: 10_000_000,
      },
      agreement: accepted,
    });
    const user = userEvent.setup();
    renderWithClient(
      <I18nProvider>
        <AiCard organizationId="org-1" organizationName="Acme" />
      </I18nProvider>
    );

    await waitFor(() =>
      expect(screen.getByRole("switch", { name: "Asistent" })).toBeInTheDocument()
    );
    await user.click(screen.getByRole("button", { name: "Zkopírovat upozornění pro členy" }));
    expect(copyText).toHaveBeenCalledWith(
      "V organizaci Acme je zapnutý Asistent. Ptej se ho na svou dovolenou, docházku a kolegy."
    );

    await user.click(screen.getByRole("switch", { name: "Asistent" }));
    const off = await screen.findByRole("dialog", { name: "Vypnout Asistenta?" });
    expect(
      within(off).getByText(
        "Členové o Asistenta hned přijdou. Jejich chaty zůstanou čitelné, dokud nebudou 180 dní staré."
      )
    ).toBeInTheDocument();
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
      expect(screen.getByRole("switch", { name: "Asistent" })).toBeInTheDocument()
    );
    await user.click(screen.getByRole("switch", { name: "Asistent" }));
    const dialog = await screen.findByRole("dialog", { name: "Zapnout Asistenta pro Acme?" });
    expect(
      within(dialog).getByText("Než ho zapnete, přečtěte si tohle. Vypnout ho můžete kdykoli.")
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /ukládá ve Spojených státech a zpracovávat je může i v dalších zemích, kde provozuje své modely/
      )
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Tím se Anthropic stává dalším zpracovatelem podle Smlouvy o funkcích AI."
      )
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("checkbox", { name: "Přijímám Smlouvu o funkcích AI za Acme." })
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("checkbox", { name: "Dát vědět členům" })).toBeChecked();
    expect(within(dialog).getByRole("button", { name: "Přijmout a zapnout" })).toBeDisabled();
  });
});
