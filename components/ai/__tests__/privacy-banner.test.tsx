import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import { PrivacyBanner } from "../privacy-banner";

let banner: { show: boolean } | undefined;
const dismiss = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  usePrivacyBanner: () => ({ data: banner }),
  useDismissPrivacyBanner: () => ({ mutate: dismiss }),
}));

describe("PrivacyBanner", () => {
  beforeEach(() => {
    dismiss.mockReset();
    window.localStorage.clear();
  });

  it("tells the user about the Privacy Policy update, in T-695's words", () => {
    banner = { show: true };
    renderWithClient(<PrivacyBanner />);

    expect(
      screen.getByText("We've updated our Privacy Policy for the new AI features.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read what changed" })).toHaveAttribute(
      "href",
      "/privacy/#what-changed"
    );
  });

  it("dismisses it with the close button", async () => {
    banner = { show: true };
    const user = userEvent.setup();
    renderWithClient(<PrivacyBanner />);

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("counts reading what changed as dismissing it", async () => {
    banner = { show: true };
    const user = userEvent.setup();
    renderWithClient(<PrivacyBanner />);

    await user.click(screen.getByRole("link", { name: "Read what changed" }));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("shows nothing when the backend says so, or before it answers", () => {
    banner = { show: false };
    const { unmount } = renderWithClient(<PrivacyBanner />);
    expect(screen.queryByText(/updated our Privacy Policy/)).toBeNull();
    unmount();

    banner = undefined;
    renderWithClient(<PrivacyBanner />);
    expect(screen.queryByText(/updated our Privacy Policy/)).toBeNull();
  });

  it("speaks Czech and links the Czech policy", async () => {
    window.localStorage.setItem("flexiday-locale", "cs");
    banner = { show: true };
    renderWithClient(
      <I18nProvider>
        <PrivacyBanner />
      </I18nProvider>
    );

    await waitFor(() =>
      expect(
        screen.getByText("Upravili jsme Zásady ochrany osobních údajů kvůli novým funkcím AI.")
      ).toBeInTheDocument()
    );
    expect(screen.getByRole("link", { name: "Přečíst, co se změnilo" })).toHaveAttribute(
      "href",
      "/cs/privacy/#what-changed"
    );
    expect(screen.getByRole("button", { name: "Zavřít" })).toBeInTheDocument();
  });
});
