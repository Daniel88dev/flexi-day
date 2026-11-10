import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api/client";
import { OAUTH_QUERY, connectContext } from "@/components/ai-connect/__tests__/connect-fixtures";
import ConnectOrganizationPage from "../page";

const getContextMock = vi.fn();
const chooseMock = vi.fn();
const continueMock = vi.fn();
const consentMock = vi.fn();
const goToMock = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(OAUTH_QUERY),
}));

vi.mock("@/lib/api/oauth-connect", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/oauth-connect")>()),
  getConnectContext: (...args: unknown[]) => getContextMock(...args),
  chooseConnectOrganization: (...args: unknown[]) => chooseMock(...args),
  continueAfterPicker: (...args: unknown[]) => continueMock(...args),
  answerConsent: (...args: unknown[]) => consentMock(...args),
  goTo: (url: string) => goToMock(url),
}));

beforeEach(() => {
  vi.clearAllMocks();
  getContextMock.mockResolvedValue(connectContext({ organization: null }));
  chooseMock.mockResolvedValue({});
  continueMock.mockResolvedValue({ redirect: true, url: "http://localhost:3000/oauth/consent/?c" });
  consentMock.mockResolvedValue({
    redirect: true,
    url: "https://claude.ai/cb?error=access_denied",
  });
});

describe("ConnectOrganizationPage", () => {
  it("lists where the app may work, the access each allows, and why others are left out", async () => {
    render(<ConnectOrganizationPage />);

    expect(
      await screen.findByText("Which organization should Claude work in?")
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Acme/ })).toBeChecked();
    expect(screen.getByText("Read and write allowed")).toBeInTheDocument();
    expect(screen.getByText("Read only")).toBeInTheDocument();
    expect(
      screen.getByText("Not listed: Gamma. Its owner hasn't turned on AI connections.")
    ).toBeInTheDocument();
  });

  it("saves the pick, continues the flow and follows it", async () => {
    const user = userEvent.setup();
    render(<ConnectOrganizationPage />);
    await user.click(await screen.findByRole("radio", { name: /Beta/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(chooseMock).toHaveBeenCalledWith("org-beta");
    expect(continueMock).toHaveBeenCalledWith(OAUTH_QUERY);
    await waitFor(() =>
      expect(goToMock).toHaveBeenCalledWith("http://localhost:3000/oauth/consent/?c")
    );
  });

  it("says so when the organization stopped allowing AI connections", async () => {
    chooseMock.mockRejectedValue(
      new ApiError(403, "no", undefined, [
        { message: "no", context: { code: "AI_ORGANIZATION_NOT_ELIGIBLE" } },
      ])
    );
    const user = userEvent.setup();
    render(<ConnectOrganizationPage />);
    await user.click(await screen.findByRole("button", { name: "Continue" }));

    expect(
      await screen.findByText("This organization no longer allows AI connections. Pick another.")
    ).toBeInTheDocument();
    expect(goToMock).not.toHaveBeenCalled();
  });

  it("offers a way back to the app when no organization allows it", async () => {
    getContextMock.mockResolvedValue(
      connectContext({
        organization: null,
        organizations: {
          eligible: [],
          leftOut: [
            {
              organizationId: "org-gamma",
              organizationName: "Gamma",
              ownerName: "Gita Owner",
              reason: "PLAN",
            },
          ],
        },
      })
    );
    const user = userEvent.setup();
    render(<ConnectOrganizationPage />);

    expect(await screen.findByText("Claude can't connect yet")).toBeInTheDocument();
    expect(screen.getByText("Gamma · owner Gita Owner")).toBeInTheDocument();
    expect(screen.getByText("Free organizations can't turn them on.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Go back to Claude" }));

    expect(consentMock).toHaveBeenCalledWith(OAUTH_QUERY, { accept: false });
    await waitFor(() =>
      expect(goToMock).toHaveBeenCalledWith("https://claude.ai/cb?error=access_denied")
    );
  });
});
