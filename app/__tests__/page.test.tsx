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
    <I18nContext
      value={{ locale, setLocale: () => {}, t: dictionaries[locale], localeReady: true }}
    >
      <LandingPage />
    </I18nContext>
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

  it("lists birthdays on the group calendar under the Pro plan in English", () => {
    renderIn("en");

    expect(screen.getByText("Birthdays on the group calendar")).toBeInTheDocument();
  });

  it("lists birthdays on the group calendar under the Pro plan in Czech", () => {
    renderIn("cs");

    expect(screen.getByText("Narozeniny v kalendáři skupiny")).toBeInTheDocument();
  });

  it("lists group events on the shared calendar under the Pro plan in English", () => {
    renderIn("en");

    expect(screen.getByText("Group events on the shared calendar")).toBeInTheDocument();
  });

  it("lists group events on the shared calendar under the Pro plan in Czech", () => {
    renderIn("cs");

    expect(screen.getByText("Skupinové události ve sdíleném kalendáři")).toBeInTheDocument();
  });
});
