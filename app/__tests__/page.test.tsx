import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPage from "../page";
import { I18nContext } from "@/lib/i18n/i18n-provider";
import { dictionaries } from "@/lib/i18n";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: null, isPending: false }),
}));

function renderIn(locale: "en" | "cs") {
  return render(
    <I18nContext.Provider
      value={{ locale, setLocale: () => {}, t: dictionaries[locale], localeReady: true }}
    >
      <LandingPage />
    </I18nContext.Provider>
  );
}

describe("LandingPage", () => {
  it("lists attachments under the Pro plan in English", () => {
    renderIn("en");

    expect(screen.getByText("Attachments on requests (images & PDF)")).toBeInTheDocument();
  });

  it("lists attachments under the Pro plan in Czech", () => {
    renderIn("cs");

    expect(screen.getByText("Přílohy k žádostem (obrázky a PDF)")).toBeInTheDocument();
  });
});
