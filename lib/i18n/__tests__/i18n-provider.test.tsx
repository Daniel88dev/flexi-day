import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "../i18n-provider";
import { useTranslation } from "../use-translation";
import { STORAGE_KEY } from "../config";

function Probe() {
  const { locale, setLocale, t } = useTranslation();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="label">{t.nav.dashboard}</span>
      <button onClick={() => setLocale("cs")}>cs</button>
      <button onClick={() => setLocale("en")}>en</button>
    </div>
  );
}

describe("I18nProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to English (jsdom navigator language)", () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );
    expect(screen.getByTestId("locale").textContent).toBe("en");
    expect(screen.getByTestId("label").textContent).toBe("Dashboard");
  });

  it("switches the dictionary and persists the choice on setLocale", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );

    await user.click(screen.getByRole("button", { name: "cs" }));

    expect(screen.getByTestId("locale").textContent).toBe("cs");
    expect(screen.getByTestId("label").textContent).toBe("Přehled");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("cs");
    expect(document.documentElement.lang).toBe("cs");
  });

  it("falls back to English text when used without a provider", () => {
    render(<Probe />);
    expect(screen.getByTestId("label").textContent).toBe("Dashboard");
  });
});
