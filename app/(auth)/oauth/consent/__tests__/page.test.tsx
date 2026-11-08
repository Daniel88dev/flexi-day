import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api/client";
import { OAUTH_QUERY, connectContext } from "@/components/ai-connect/__tests__/connect-fixtures";
import ConnectConsentPage from "../page";

const getContextMock = vi.fn();
const consentMock = vi.fn();
const goToMock = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(OAUTH_QUERY),
}));

vi.mock("@/lib/api/oauth-connect", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/oauth-connect")>()),
  getConnectContext: (...args: unknown[]) => getContextMock(...args),
  answerConsent: (...args: unknown[]) => consentMock(...args),
  goTo: (url: string) => goToMock(url),
}));

beforeEach(() => {
  vi.clearAllMocks();
  getContextMock.mockResolvedValue(connectContext());
  consentMock.mockResolvedValue({ redirect: true, url: "https://claude.ai/cb?code=c" });
});

const allow = async () => {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Allow" }));
  return user;
};

describe("ConnectConsentPage", () => {
  it("shows the checked address, the organization and where the browser goes", async () => {
    render(<ConnectConsentPage />);

    expect(
      await screen.findByText("Allow Claude to use your Flexi Day account?")
    ).toBeInTheDocument();
    expect(screen.getByText(/Address checked: claude\.ai/)).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("You go back to claude.ai")).toBeInTheDocument();
    expect(screen.getByText("See what you can see")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("says the name is not verified for a registered app, and warns about a local one", async () => {
    getContextMock.mockResolvedValue(
      connectContext({
        client: {
          ...connectContext().client,
          name: "Cursor",
          verified: false,
          host: "localhost:8787",
        },
        redirect: { host: "localhost:8787", local: true },
      })
    );
    render(<ConnectConsentPage />);

    expect(await screen.findByText(/Name not verified/)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This sends your access to a program on this computer"
    );
  });

  it("grants every requested scope with Make changes for you ticked", async () => {
    render(<ConnectConsentPage />);
    expect(await screen.findByRole("checkbox", { name: "Make changes for you" })).toBeChecked();
    await allow();

    expect(consentMock).toHaveBeenCalledWith(OAUTH_QUERY, {
      accept: true,
      scope: "flexiday.read flexiday.write offline_access",
    });
    await waitFor(() => expect(goToMock).toHaveBeenCalledWith("https://claude.ai/cb?code=c"));
  });

  it("leaves write out when the member unticks it", async () => {
    const user = userEvent.setup();
    render(<ConnectConsentPage />);
    await user.click(await screen.findByRole("checkbox", { name: "Make changes for you" }));
    await allow();

    expect(consentMock).toHaveBeenCalledWith(OAUTH_QUERY, {
      accept: true,
      scope: "flexiday.read offline_access",
    });
  });

  it("offers no write option on a Read only organization", async () => {
    getContextMock.mockResolvedValue(
      connectContext({
        organization: { organizationId: "org-beta", organizationName: "Beta", access: "read" },
      })
    );
    render(<ConnectConsentPage />);

    expect(
      await screen.findByText("Beta allows read only, so Claude can't make changes.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Make changes for you")).not.toBeInTheDocument();
    await allow();
    expect(consentMock).toHaveBeenCalledWith(OAUTH_QUERY, {
      accept: true,
      scope: "flexiday.read offline_access",
    });
  });

  it("shows only https policy links the backend passed on", async () => {
    getContextMock.mockResolvedValue(
      connectContext({
        client: { ...connectContext().client, policyUri: "https://claude.ai/privacy" },
      })
    );
    render(<ConnectConsentPage />);

    expect(await screen.findByRole("link", { name: "Privacy policy" })).toHaveAttribute(
      "href",
      "https://claude.ai/privacy"
    );
    expect(screen.queryByRole("link", { name: "Terms" })).not.toBeInTheDocument();
  });

  it("says the organization stopped allowing AI connections when consent is refused", async () => {
    consentMock.mockRejectedValue(new ApiError(403, "access_denied"));
    render(<ConnectConsentPage />);
    await allow();

    expect(
      await screen.findByText(
        "This organization no longer allows AI connections, so Claude can't connect to it."
      )
    ).toBeInTheDocument();
    expect(goToMock).not.toHaveBeenCalled();
  });

  it("refuses with Cancel and returns to the app", async () => {
    const user = userEvent.setup();
    render(<ConnectConsentPage />);
    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(consentMock).toHaveBeenCalledWith(OAUTH_QUERY, { accept: false });
  });
});
