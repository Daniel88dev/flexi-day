import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleToggle } from "../LocaleToggle";
import { I18nProvider } from "@/lib/i18n/i18n-provider";

describe("LocaleToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the current locale and flips it on click", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <LocaleToggle />
      </I18nProvider>
    );

    // Starts in English; the button offers a switch to Czech.
    const button = screen.getByRole("button", { name: /Switch to Czech/i });
    expect(button.textContent).toContain("en");

    await user.click(button);

    // Now in Czech: the code updates and the accessible label is the Czech one.
    expect(screen.getByRole("button").textContent).toContain("cs");
    expect(screen.getByRole("button", { name: /Přepnout do angličtiny/i })).toBeInTheDocument();
  });
});
