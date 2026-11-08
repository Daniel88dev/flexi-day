import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import type { AiAvailability } from "@/lib/api/ai-features";
import { AiAgreementBanner } from "../ai-agreement-banner";

let availability: AiAvailability | undefined;
const accept = vi.fn();
const acceptFor = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  useAiAvailability: () => ({ data: availability }),
  useAcceptAiAgreement: (organizationId: string | null) => {
    acceptFor(organizationId);
    return { mutateAsync: accept, isPending: false };
  },
}));
vi.mock("@/components/toast", () => ({ pushToast: vi.fn() }));

const org = (overrides: Partial<AiAvailability["organizations"][number]> = {}) => ({
  organizationId: "org-1",
  assistant: true,
  aiConnections: false,
  newAgreementVersionReady: true,
  ...overrides,
});

const withOrganizations = (organizations: AiAvailability["organizations"]): AiAvailability => ({
  assistant: true,
  aiConnections: false,
  organizations,
});

describe("AiAgreementBanner", () => {
  beforeEach(() => {
    accept.mockReset();
    accept.mockResolvedValue({});
    acceptFor.mockReset();
    window.localStorage.clear();
  });

  it("asks the owner to accept the raised version, in T-695's words", async () => {
    availability = withOrganizations([
      org({ organizationId: "org-other", newAgreementVersionReady: false }),
      org(),
    ]);
    const user = userEvent.setup();
    renderWithClient(<AiAgreementBanner />);

    expect(
      screen.getByText("Version 1 of the AI features agreement is ready.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Read it and accept it for your organization. The Assistant and AI connections keep working meanwhile."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read the agreement" })).toHaveAttribute(
      "href",
      "/ai-agreement"
    );
    await user.click(screen.getByRole("button", { name: "Accept version 1" }));
    expect(acceptFor).toHaveBeenLastCalledWith("org-1");
    expect(accept).toHaveBeenCalledWith(1);
  });

  it("shows nothing when no version waits, or the feature is dark there", () => {
    availability = withOrganizations([org({ newAgreementVersionReady: false })]);
    const { unmount } = renderWithClient(<AiAgreementBanner />);
    expect(screen.queryByText(/AI features agreement is ready/)).toBeNull();
    unmount();

    availability = withOrganizations([org({ assistant: false, aiConnections: false })]);
    renderWithClient(<AiAgreementBanner />);
    expect(screen.queryByText(/AI features agreement is ready/)).toBeNull();
  });

  it("speaks Czech", async () => {
    window.localStorage.setItem("flexiday-locale", "cs");
    availability = withOrganizations([org()]);
    renderWithClient(
      <I18nProvider>
        <AiAgreementBanner />
      </I18nProvider>
    );

    await waitFor(() =>
      expect(screen.getByText("Je připravena verze 1 Smlouvy o funkcích AI.")).toBeInTheDocument()
    );
    expect(
      screen.getByText(
        "Přečtěte si ji a přijměte ji za svou organizaci. Asistent a AI připojení mezitím fungují dál."
      )
    ).toBeInTheDocument();
  });
});
