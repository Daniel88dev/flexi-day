import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { I18nContext } from "@/lib/i18n/i18n-provider";
import { dictionaries, type Locale } from "@/lib/i18n";
import { LanguageSync } from "../language-sync";

const mySettings = { data: undefined as { language?: Locale | null } | undefined };
const updateSettings = { mutate: vi.fn(), isPending: false };

vi.mock("@/lib/api/queries", () => ({
  useMySettings: () => mySettings,
  useUpdateMySettings: () => updateSettings,
}));

const renderIn = (locale: Locale, localeReady = true) =>
  render(
    <I18nContext value={{ locale, setLocale: () => {}, t: dictionaries[locale], localeReady }}>
      <LanguageSync />
    </I18nContext>
  );

describe("LanguageSync", () => {
  beforeEach(() => {
    updateSettings.mutate.mockReset();
    updateSettings.isPending = false;
    mySettings.data = undefined;
  });

  it("writes the active language when the stored one differs", () => {
    mySettings.data = { language: "en" };

    renderIn("cs");

    expect(updateSettings.mutate).toHaveBeenCalledExactlyOnceWith({ language: "cs" });
  });

  it("writes the detected language for a user who never stored one", () => {
    mySettings.data = { language: null };

    renderIn("en");

    expect(updateSettings.mutate).toHaveBeenCalledExactlyOnceWith({ language: "en" });
  });

  it("writes nothing when the stored language matches", () => {
    mySettings.data = { language: "cs" };

    renderIn("cs");

    expect(updateSettings.mutate).not.toHaveBeenCalled();
  });

  it("waits for the settings and for the detected locale", () => {
    renderIn("cs");
    mySettings.data = { language: "en" };
    renderIn("en", false);

    expect(updateSettings.mutate).not.toHaveBeenCalled();
  });

  it("writes nothing to a backend whose settings carry no language", () => {
    mySettings.data = {};

    renderIn("cs");

    expect(updateSettings.mutate).not.toHaveBeenCalled();
  });
});
