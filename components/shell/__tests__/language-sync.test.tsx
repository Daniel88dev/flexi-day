import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { I18nContext } from "@/lib/i18n/i18n-provider";
import { dictionaries, type Locale } from "@/lib/i18n";
import { LanguageSync } from "../language-sync";

const mySettings = {
  data: undefined as { language?: Locale | null } | undefined,
  dataUpdatedAt: 0,
};
const updateSettings = { mutate: vi.fn(), isPending: false };

vi.mock("@/lib/api/queries", () => ({
  useMySettings: () => mySettings,
  useUpdateMySettings: () => updateSettings,
}));

const tree = (locale: Locale, localeReady = true) => (
  <I18nContext value={{ locale, setLocale: () => {}, t: dictionaries[locale], localeReady }}>
    <LanguageSync />
  </I18nContext>
);

const renderIn = (locale: Locale, localeReady = true) => render(tree(locale, localeReady));

describe("LanguageSync", () => {
  beforeEach(() => {
    updateSettings.mutate.mockReset();
    updateSettings.isPending = false;
    mySettings.data = undefined;
    mySettings.dataUpdatedAt = 0;
  });

  it("writes the active language when the stored one differs", () => {
    mySettings.data = { language: "en" };

    renderIn("cs");

    expect(updateSettings.mutate).toHaveBeenCalledExactlyOnceWith(
      { language: "cs" },
      expect.anything()
    );
  });

  it("writes the detected language for a user who never stored one", () => {
    mySettings.data = { language: null };

    renderIn("en");

    expect(updateSettings.mutate).toHaveBeenCalledExactlyOnceWith(
      { language: "en" },
      expect.anything()
    );
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

  it("retries a failed write once the settings are fetched again", () => {
    mySettings.data = { language: "en" };
    mySettings.dataUpdatedAt = 1;
    updateSettings.mutate.mockImplementation((_input, options) => options?.onError?.());

    const { rerender } = renderIn("cs");
    rerender(tree("cs"));
    expect(updateSettings.mutate).toHaveBeenCalledOnce();

    mySettings.dataUpdatedAt = 2;
    rerender(tree("cs"));
    expect(updateSettings.mutate).toHaveBeenCalledTimes(2);
    expect(updateSettings.mutate).toHaveBeenLastCalledWith({ language: "cs" }, expect.anything());
  });

  it("does not resend a write still in flight when the settings are fetched again", () => {
    mySettings.data = { language: "en" };
    mySettings.dataUpdatedAt = 1;

    const { rerender } = renderIn("cs");
    mySettings.dataUpdatedAt = 2;
    rerender(tree("cs"));

    expect(updateSettings.mutate).toHaveBeenCalledOnce();
  });

  it("writes nothing to a backend whose settings carry no language", () => {
    mySettings.data = {};

    renderIn("cs");

    expect(updateSettings.mutate).not.toHaveBeenCalled();
  });
});
