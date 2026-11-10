import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api/client";
import { OAUTH_QUERY, connectContext } from "@/components/ai-connect/__tests__/connect-fixtures";
import ConnectSignInPage from "../page";

const replaceMock = vi.fn();
const getContextMock = vi.fn();
const signInMock = vi.fn();
const goToMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(OAUTH_QUERY),
  useRouter: () => ({ replace: replaceMock, refresh: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    $fetch: (...args: unknown[]) => fetchMock(...args),
    signIn: { social: vi.fn() },
  },
}));

vi.mock("@/lib/api/oauth-connect", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/oauth-connect")>()),
  getConnectContext: (...args: unknown[]) => getContextMock(...args),
  signInForConnection: (...args: unknown[]) => signInMock(...args),
  goTo: (url: string) => goToMock(url),
}));

beforeEach(() => {
  vi.clearAllMocks();
  getContextMock.mockResolvedValue(
    connectContext({ signedIn: false, organization: null, organizations: null })
  );
  fetchMock.mockResolvedValue({ data: { url: "https://accounts.google.com/" }, error: null });
});

async function submit() {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Work email"), "jana@example.com");
  await user.type(screen.getByPlaceholderText("••••••••"), "hunter2hunter2");
  await user.click(screen.getByRole("button", { name: /Sign in/ }));
}

describe("ConnectSignInPage", () => {
  it("names the app and its host, and says nothing is shared yet", async () => {
    render(<ConnectSignInPage />);

    expect(await screen.findByText("Sign in to connect Claude")).toBeInTheDocument();
    expect(screen.getByText("Claude · claude.ai")).toBeInTheDocument();
    expect(screen.getByText(/Nothing is shared until you allow it/)).toBeInTheDocument();
    expect(getContextMock).toHaveBeenCalledWith(OAUTH_QUERY);
  });

  it("says the link expired when the backend refuses the signed query", async () => {
    getContextMock.mockRejectedValue(new ApiError(400, "invalid"));
    render(<ConnectSignInPage />);

    expect(await screen.findByText("This link has expired")).toBeInTheDocument();
  });

  it("signs in with the signed query and follows the flow to its next page", async () => {
    signInMock.mockResolvedValue({
      redirect: true,
      url: "http://localhost:3000/oauth/organization/?x",
    });
    render(<ConnectSignInPage />);
    await submit();

    expect(signInMock).toHaveBeenCalledWith({
      email: "jana@example.com",
      password: "hunter2hunter2",
      oauthQuery: OAUTH_QUERY,
    });
    expect(goToMock).toHaveBeenCalledWith("http://localhost:3000/oauth/organization/?x");
  });

  it("keeps the signed query through the two-factor page", async () => {
    signInMock.mockResolvedValue({ twoFactorRedirect: true, twoFactorMethods: ["totp"] });
    render(<ConnectSignInPage />);
    await submit();

    const target = new URL(replaceMock.mock.calls[0]![0] as string, "http://localhost");
    expect(target.pathname).toBe("/two-factor/");
    expect(target.searchParams.get("methods")).toBe("totp");
    expect(target.searchParams.get("oauth_query")).toBe(OAUTH_QUERY);
    expect(goToMock).not.toHaveBeenCalled();
  });

  it("carries the signed query into a social sign-in", async () => {
    const user = userEvent.setup();
    render(<ConnectSignInPage />);
    await user.click(await screen.findByRole("button", { name: "Continue with Google" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/sign-in/social",
      expect.objectContaining({
        method: "POST",
        body: expect.objectContaining({ provider: "google", oauth_query: OAUTH_QUERY }),
      })
    );
  });
});
