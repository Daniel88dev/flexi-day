import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer, FOOTER_LINKS } from "../footer";
import { I18nContext } from "@/lib/i18n/i18n-provider";
import { dictionaries } from "@/lib/i18n";

describe("Footer", () => {
  it("renders the four policy links pointing at their routes", () => {
    render(<Footer />);
    for (const { href, label } of FOOTER_LINKS) {
      const link = screen.getByRole("link", { name: label });
      expect(link.getAttribute("href")).toMatch(new RegExp(href));
    }
  });

  it("shows the copyright with the current year", () => {
    render(<Footer />);
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });

  it("renders the compact variant with all links", () => {
    render(<Footer minimal />);
    for (const { label } of FOOTER_LINKS) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("points the privacy and terms links at the Czech pages when the locale is Czech", () => {
    render(
      <I18nContext
        value={{ locale: "cs", setLocale: () => {}, t: dictionaries.cs, localeReady: true }}
      >
        <Footer />
      </I18nContext>
    );
    expect(screen.getByRole("link", { name: "Soukromí" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/cs\/privacy\/?$/)
    );
    expect(screen.getByRole("link", { name: "Podmínky" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/cs\/terms\/?$/)
    );
    expect(screen.getByRole("link", { name: "Zabezpečení" })).toHaveAttribute("href", "/security");
  });
});
