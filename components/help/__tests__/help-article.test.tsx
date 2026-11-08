import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HelpArticle } from "../help-article";

const article = {
  id: "second",
  language: "en" as const,
  title: "Your settings",
  summary: "Change your language.",
  body: "## Language\n\nPick a language.",
};

describe("HelpArticle", () => {
  it("renders the title, summary and body", () => {
    render(<HelpArticle locale="en" article={article} />);

    expect(screen.getByRole("heading", { level: 1, name: "Your settings" })).toBeInTheDocument();
    expect(screen.getByText("Change your language.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Language" })).toBeInTheDocument();
    expect(screen.queryByText(/isn't in English yet/)).toBeNull();
  });

  it("says so when the Czech page shows the English text", () => {
    const { container } = render(<HelpArticle locale="cs" article={article} />);

    expect(screen.getByText(/Tento článek zatím není přeložený do češtiny/)).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("lang", "en");
    expect(screen.getByRole("link", { name: "English version" })).toHaveAttribute(
      "href",
      "/help/second/"
    );
  });
});
