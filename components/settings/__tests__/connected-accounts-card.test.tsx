import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConnectedAccountsCard } from "../connected-accounts-card";
import { ToastHost } from "@/components/toast";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import { renderWithClient } from "@/lib/test-utils";

const listAccounts = vi.fn();
const linkSocial = vi.fn();
const unlinkAccount = vi.fn();
const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    listAccounts: () => listAccounts(),
    linkSocial: (...args: unknown[]) => linkSocial(...args),
    unlinkAccount: (...args: unknown[]) => unlinkAccount(...args),
  },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
  usePathname: () => "/settings/",
  useRouter: () => ({ replace: (...args: unknown[]) => replace(...args) }),
}));

function account(providerId: string) {
  // The row id is deliberately unlike the provider id: `unlinkAccount` takes
  // the former, and an id equal to the latter would hide sending the wrong one.
  return { id: `acc-${providerId}`, providerId, accountId: "a1", userId: "u1", scopes: [] };
}

/** The row is found by its provider name, then asserted on from the inside. */
function row(name: string) {
  return screen.getByText(name).closest("li") as HTMLElement;
}

beforeEach(() => {
  listAccounts.mockReset().mockResolvedValue({ data: [account("credential")], error: null });
  linkSocial.mockReset().mockResolvedValue({ error: null });
  unlinkAccount.mockReset().mockResolvedValue({ error: null });
  replace.mockReset();
  searchParams = new URLSearchParams();
  window.history.replaceState(null, "", "/settings/");
});

describe("ConnectedAccountsCard", () => {
  it("shows the password method and both providers as not connected", async () => {
    renderWithClient(<ConnectedAccountsCard />);

    await screen.findByText("Password");
    expect(within(row("Google")).getByText("Not connected")).toBeInTheDocument();
    expect(within(row("Microsoft")).getByText("Not connected")).toBeInTheDocument();
  });

  it("offers Disconnect for a provider that is already linked", async () => {
    listAccounts.mockResolvedValue({
      data: [account("credential"), account("google")],
      error: null,
    });
    renderWithClient(<ConnectedAccountsCard />);

    await screen.findByRole("button", { name: "Disconnect Google" });
    expect(within(row("Google")).getByText("Connected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect Microsoft" })).toBeInTheDocument();
  });

  it("sends absolute URLs so the provider returns to this page, not the API", async () => {
    renderWithClient(<ConnectedAccountsCard />);
    await userEvent.click(await screen.findByRole("button", { name: "Connect Microsoft" }));

    const here = `${window.location.origin}/settings/`;
    expect(linkSocial).toHaveBeenCalledWith({
      provider: "microsoft",
      callbackURL: `${here}?linked=microsoft`,
      errorCallbackURL: here,
    });
  });

  it("unlinks a provider by its id", async () => {
    listAccounts.mockResolvedValue({
      data: [account("credential"), account("google")],
      error: null,
    });
    renderWithClient(<ConnectedAccountsCard />);
    await userEvent.click(await screen.findByRole("button", { name: "Disconnect Google" }));

    expect(unlinkAccount).toHaveBeenCalledWith({ accountId: "acc-google" });
  });

  it("refetches the list when an unlink fails, rather than keeping a dead button", async () => {
    // The row is already gone server-side — unlinked in another tab — so the
    // id this card holds is stale. Under 1.7 the unlink names a row id, so it
    // misses; without the refetch the card would go on offering a Disconnect
    // that can only ever fail.
    listAccounts
      .mockResolvedValueOnce({ data: [account("credential"), account("google")], error: null })
      .mockResolvedValue({ data: [account("credential")], error: null });
    unlinkAccount.mockResolvedValue({ error: { code: "ACCOUNT_NOT_FOUND", message: "gone" } });
    renderWithClient(<ConnectedAccountsCard />);
    await userEvent.click(await screen.findByRole("button", { name: "Disconnect Google" }));

    // The refetch has to land the truth, not just fire: the row flips to "Not
    // connected", and the error explaining the failed attempt survives it.
    expect(await within(row("Google")).findByText("Not connected")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(listAccounts).toHaveBeenCalledTimes(2);
  });

  it("refuses to remove the only sign-in method", async () => {
    listAccounts.mockResolvedValue({ data: [account("google")], error: null });
    renderWithClient(<ConnectedAccountsCard />);

    // Without a password row, Google is all that is left — the backend would
    // reject the unlink, so the button must not offer it.
    expect(await screen.findByRole("button", { name: "Disconnect Google" })).toBeDisabled();
    expect(unlinkAccount).not.toHaveBeenCalled();
  });

  it("translates the code better-auth appends when it refuses a link", async () => {
    searchParams = new URLSearchParams("error=email_doesn't_match");
    renderWithClient(<ConnectedAccountsCard />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/different email address/i);
  });

  it("confirms a completed link and drops the marker that announced it", async () => {
    searchParams = new URLSearchParams("linked=google");
    renderWithClient(
      // Mirrors the app layout, where ToastHost is mounted above {children}
      // precisely so it has subscribed before a page pushes from its own
      // mount effect. Reversing these two makes this test fail — which is the
      // bug the layout order exists to prevent.
      <>
        <ToastHost />
        <ConnectedAccountsCard />
      </>
    );

    expect(await screen.findByText("Google connected.")).toBeInTheDocument();
    // A reload must not replay a toast for a link that already happened.
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/settings/", { scroll: false }));
  });

  it("keeps unrelated query parameters when it drops its own", async () => {
    searchParams = new URLSearchParams("tab=general&linked=google");
    renderWithClient(<ConnectedAccountsCard />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/settings/?tab=general", { scroll: false })
    );
  });

  it("asks for a fresh sign-in when better-auth demands one", async () => {
    listAccounts.mockResolvedValue({
      data: [account("credential"), account("google")],
      error: null,
    });
    unlinkAccount.mockResolvedValue({
      error: { code: "SESSION_NOT_FRESH", message: "Session is not fresh" },
    });
    renderWithClient(<ConnectedAccountsCard />);
    await userEvent.click(await screen.findByRole("button", { name: "Disconnect Google" }));

    // better-auth's own English message must not reach a page that may be Czech.
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/sign out and back in/i);
    expect(alert).not.toHaveTextContent("Session is not fresh");
  });

  it("reports a failure to load rather than showing an empty list", async () => {
    listAccounts.mockResolvedValue({ data: null, error: { message: "boom" } });
    renderWithClient(<ConnectedAccountsCard />);

    expect(await screen.findByText("Could not load your sign-in methods.")).toBeInTheDocument();
  });

  it("shows no methods and no last-method notice when the lookup failed", async () => {
    listAccounts.mockResolvedValue({ data: null, error: { message: "boom" } });
    renderWithClient(<ConnectedAccountsCard />);
    await screen.findByText("Could not load your sign-in methods.");

    // An empty fallback would call a linked provider "Not connected" and pair
    // that with a notice about a method it is not showing.
    expect(screen.queryByText("Not connected")).not.toBeInTheDocument();
    expect(screen.queryByText(/only way to sign in/i)).not.toBeInTheDocument();
  });

  it("ignores a linked value that names no provider", async () => {
    searchParams = new URLSearchParams("linked=Your card was declined, call 555-0100");
    renderWithClient(
      <>
        <ToastHost />
        <ConnectedAccountsCard />
      </>
    );
    await screen.findByText("Password");

    // The toast is success-styled and sits on an authenticated page, so a
    // crafted link must not choose its words.
    expect(screen.queryByText(/555-0100/)).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("clears a previous error when the next disconnect starts", async () => {
    listAccounts.mockResolvedValue({
      data: [account("credential"), account("google"), account("microsoft")],
      error: null,
    });
    unlinkAccount.mockResolvedValueOnce({
      error: { code: "SESSION_NOT_FRESH", message: "Session is not fresh" },
    });
    renderWithClient(<ConnectedAccountsCard />);

    await userEvent.click(await screen.findByRole("button", { name: "Disconnect Google" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    unlinkAccount.mockResolvedValue({ error: null });
    await userEvent.click(screen.getByRole("button", { name: "Disconnect Microsoft" }));

    // A stale red error under a green success toast reads as a failure.
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("keeps unrelated query parameters across the provider round trip", async () => {
    window.history.replaceState(null, "", "/settings/?vacationId=abc");
    renderWithClient(<ConnectedAccountsCard />);
    await userEvent.click(await screen.findByRole("button", { name: "Connect Google" }));

    const call = linkSocial.mock.calls[0]?.[0] as { callbackURL: string; errorCallbackURL: string };
    expect(call.callbackURL).toContain("vacationId=abc");
    expect(call.callbackURL).toContain("linked=google");
    expect(call.errorCallbackURL).toContain("vacationId=abc");
    expect(call.errorCallbackURL).not.toContain("linked=");
  });

  it("announces the link in the page's own language, not the pre-detection default", async () => {
    window.localStorage.setItem("flexiday-locale", "cs");
    searchParams = new URLSearchParams("linked=google");
    renderWithClient(
      <I18nProvider>
        <ToastHost />
        <ConnectedAccountsCard />
      </I18nProvider>
    );

    // I18nProvider corrects the locale from its own mount effect, which runs
    // after this card's — so a toast fired eagerly would come out English on a
    // Czech page.
    expect(await screen.findByText("Google připojen.")).toBeInTheDocument();
    window.localStorage.clear();
  });

  it("dismisses a refused link's message once another action is taken", async () => {
    listAccounts.mockResolvedValue({
      data: [account("credential"), account("microsoft")],
      error: null,
    });
    searchParams = new URLSearchParams("error=email_doesn't_match");
    renderWithClient(<ConnectedAccountsCard />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await userEvent.click(await screen.findByRole("button", { name: "Disconnect Microsoft" }));

    // The param is never stripped from the URL, so without an explicit
    // dismissal the old failure sits under the new success.
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("does not explain a disabled Disconnect that is not on screen", async () => {
    // Password-only: one account, so isLastMethod is true, but neither
    // provider row renders a Disconnect for the notice to be about.
    renderWithClient(<ConnectedAccountsCard />);
    await screen.findByText("Password");

    expect(screen.queryByText(/only way to sign in/i)).not.toBeInTheDocument();
  });

  it("explains the disabled Disconnect when a provider is the only method", async () => {
    listAccounts.mockResolvedValue({ data: [account("google")], error: null });
    renderWithClient(<ConnectedAccountsCard />);

    expect(await screen.findByRole("button", { name: "Disconnect Google" })).toBeDisabled();
    expect(screen.getByText(/only way to sign in/i)).toBeInTheDocument();
  });

  it("frees the button again when the browser restores the page from bfcache", async () => {
    linkSocial.mockReturnValue(new Promise(() => {}));
    renderWithClient(<ConnectedAccountsCard />);
    await userEvent.click(await screen.findByRole("button", { name: "Connect Google" }));
    expect(screen.getByRole("button", { name: "Redirecting…" })).toBeInTheDocument();

    // Back out of the provider's consent screen: React state comes back with
    // it, so the button would otherwise read "Redirecting…" for good.
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));

    expect(await screen.findByRole("button", { name: "Connect Google" })).toBeEnabled();
  });

  it("leaves the other provider usable while one connect is in flight", async () => {
    linkSocial.mockReturnValue(new Promise(() => {}));
    renderWithClient(<ConnectedAccountsCard />);
    await userEvent.click(await screen.findByRole("button", { name: "Connect Google" }));

    // The redirect can be abandoned with Back, and bfcache restores this state.
    expect(screen.getByRole("button", { name: "Connect Microsoft" })).toBeEnabled();
  });
});
