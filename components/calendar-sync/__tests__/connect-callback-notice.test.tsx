import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToastHost } from "@/components/toast";
import { rememberConnectProvider } from "@/lib/calendar-sync/connect-callback";
import { en } from "@/lib/i18n/dictionaries/en";
import { ConnectCallbackNotice, connectionErrorMessage } from "../connect-callback-notice";

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
  usePathname: () => "/calendar-sync/",
  useRouter: () => ({ replace: (...args: unknown[]) => replace(...args) }),
}));

function renderAt(query: string) {
  searchParams = new URLSearchParams(query);
  return render(
    <>
      <ToastHost />
      <ConnectCallbackNotice />
    </>
  );
}

beforeEach(() => {
  replace.mockReset();
  window.sessionStorage.clear();
});

describe("ConnectCallbackNotice", () => {
  it("does nothing on a plain visit", () => {
    renderAt("");
    expect(replace).not.toHaveBeenCalled();
  });

  it("announces the connected provider and strips the callback query", async () => {
    renderAt("connected=google&config=cfg-1");

    expect(
      await screen.findByText("Connected to Google. Your days off are syncing now.")
    ).toBeInTheDocument();
    expect(replace).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledWith("/calendar-sync/", { scroll: false });
  });

  it("keeps unrelated query parameters when stripping", () => {
    renderAt("error=state_invalid&tab=feeds");
    expect(replace).toHaveBeenCalledWith("/calendar-sync/?tab=feeds", { scroll: false });
  });

  it.each([
    ["state_invalid", "The connection request expired. Please connect again."],
    ["consent_denied", "Access was not granted, so nothing was connected."],
    ["scope_denied", /Allow access to your calendar/],
    ["team_scope", "Team calendars cannot connect to a provider."],
    ["provider_off", "This calendar provider is not available right now."],
    ["something_new", "Couldn't connect your calendar. Please try again."],
  ])("explains the %s error", async (code, message) => {
    renderAt(`error=${code}&config=cfg-1`);
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it("tells a Microsoft user that an IT admin may need to approve Flexi Day", async () => {
    rememberConnectProvider("microsoft");
    renderAt("error=consent_denied&config=cfg-1");

    expect(
      await screen.findByText(/an IT admin needs to approve Flexi Day once/)
    ).toBeInTheDocument();
  });

  it("names Microsoft from the redirect when consent finished in another tab", async () => {
    renderAt("error=consent_denied&provider=microsoft&config=cfg-1");

    expect(
      await screen.findByText(/an IT admin needs to approve Flexi Day once/)
    ).toBeInTheDocument();
  });

  it("prefers the redirect's provider over the stored one", async () => {
    rememberConnectProvider("microsoft");
    renderAt("error=consent_denied&provider=google&config=cfg-1");

    expect(
      await screen.findByText("Access was not granted, so nothing was connected.")
    ).toBeInTheDocument();
    expect(window.sessionStorage.getItem("flexi-day.calendar-connect-provider")).toBeNull();
  });

  it("strips the provider from the query", () => {
    renderAt("error=consent_denied&provider=google&config=cfg-1&tab=feeds");
    expect(replace).toHaveBeenCalledWith("/calendar-sync/?tab=feeds", { scroll: false });
  });

  it("keeps the general wording for a declined Google consent", async () => {
    rememberConnectProvider("google");
    renderAt("error=consent_denied&config=cfg-1");

    expect(
      await screen.findByText("Access was not granted, so nothing was connected.")
    ).toBeInTheDocument();
  });
});

describe("connectionErrorMessage", () => {
  it.each([
    ["team_config", "Team calendars cannot connect to a provider."],
    ["not_entitled", "Direct sync needs a paid plan."],
    ["provider_disabled", "This calendar provider is not available right now."],
    ["needs_reconnect", "Reconnect your calendar to sync again."],
    [
      "target_exists",
      "This calendar already syncs to another provider. Disconnect that one first.",
    ],
    ["unknown", "Something went wrong"],
  ] as const)("returns the message for %s", (name, message) => {
    expect(connectionErrorMessage(name, en)).toBe(message);
  });
});
