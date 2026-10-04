import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppleButton, GoogleButton, MicrosoftButton, OAuthErrorAlert } from "../auth-card";

const signInSocial = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("@/lib/auth-client", () => ({
  authClient: { signIn: { social: (...args: unknown[]) => signInSocial(...args) } },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

describe("social sign-in buttons", () => {
  beforeEach(() => {
    signInSocial.mockReset();
    signInSocial.mockResolvedValue({ error: null });
  });

  it("renders all three providers", () => {
    render(
      <>
        <AppleButton label="Continue with Apple" />
        <GoogleButton label="Continue with Google" />
        <MicrosoftButton label="Continue with Microsoft" />
      </>
    );
    expect(screen.getByRole("button", { name: "Continue with Apple" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with Microsoft" })).toBeInTheDocument();
  });

  it.each([
    ["Apple", AppleButton, "apple"],
    ["Google", GoogleButton, "google"],
    ["Microsoft", MicrosoftButton, "microsoft"],
  ] as const)("sends %s to its provider with absolute URLs", async (name, Button, id) => {
    render(<Button label={name} />);
    await userEvent.click(screen.getByRole("button", { name }));

    // Relative URLs resolve against the BACKEND origin inside better-auth, and
    // the default error URL is the backend's own page — both would take the
    // user off the SPA, so the button must absolutize them onto this origin.
    expect(signInSocial).toHaveBeenCalledWith({
      provider: id,
      callbackURL: `${window.location.origin}/dashboard`,
      errorCallbackURL: `${window.location.origin}${window.location.pathname}`,
    });
  });

  it("honours an explicit callbackURL so a deep link survives the round trip", async () => {
    render(<MicrosoftButton label="Microsoft" callbackURL="/report" />);
    await userEvent.click(screen.getByRole("button", { name: "Microsoft" }));

    expect(signInSocial).toHaveBeenCalledWith(
      expect.objectContaining({ callbackURL: `${window.location.origin}/report` })
    );
  });

  it("sends Apple to the page's callback", async () => {
    render(<AppleButton label="Apple" callbackURL="/join/?token=abc" />);
    await userEvent.click(screen.getByRole("button", { name: "Apple" }));

    expect(signInSocial).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "apple",
        callbackURL: `${window.location.origin}/join/?token=abc`,
      })
    );
  });

  it("styles Apple's button the way Apple requires, black in light mode and white in dark", () => {
    render(
      <>
        <AppleButton label="Apple" />
        <GoogleButton label="Google" />
      </>
    );
    const apple = screen.getByRole("button", { name: "Apple" });
    const google = screen.getByRole("button", { name: "Google" });

    expect(apple).toHaveClass("bg-black", "text-white", "dark:bg-white", "dark:text-black");
    // An inline background would beat the classes and paint Apple's button like the others.
    expect(apple.style.background).toBe("");
    for (const shared of ["rounded-full", "border", "py-3", "text-[15px]", "font-semibold"]) {
      expect(apple).toHaveClass(shared);
      expect(google).toHaveClass(shared);
    }
    expect(apple.firstElementChild?.tagName.toLowerCase()).toBe("svg");
    expect(apple.firstElementChild).toHaveAttribute("fill", "currentColor");
  });

  it("reports a returned error and re-enables the button", async () => {
    signInSocial.mockResolvedValue({ error: { message: "Provider not configured" } });
    const onError = vi.fn();
    render(<MicrosoftButton label="Microsoft" onError={onError} />);

    const button = screen.getByRole("button", { name: "Microsoft" });
    await userEvent.click(button);

    // The provider's own English string must not reach the UI — the page may
    // be in Czech.
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalledWith("Provider not configured");
    expect(button).not.toBeDisabled();
  });

  it("reports a thrown error instead of swallowing it", async () => {
    signInSocial.mockRejectedValue(new Error("network down"));
    const onError = vi.fn();
    render(<MicrosoftButton label="Microsoft" onError={onError} />);

    await userEvent.click(screen.getByRole("button", { name: "Microsoft" }));

    expect(onError).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Microsoft" })).not.toBeDisabled();
  });
});

describe("OAuthErrorAlert", () => {
  it("renders nothing without an error param", () => {
    searchParams = new URLSearchParams();
    const { container } = render(<OAuthErrorAlert />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each(["account_not_linked", "access_denied", "something_unmapped"])(
    "surfaces %s as an alert",
    (code) => {
      searchParams = new URLSearchParams({ error: code });
      render(<OAuthErrorAlert />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    }
  );
});
