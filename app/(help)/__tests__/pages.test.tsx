import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EnglishHelpPage, {
  generateMetadata as englishMetadata,
  generateStaticParams as englishParams,
} from "../help/[id]/page";
import CzechHelpPage, {
  generateMetadata as czechMetadata,
  generateStaticParams as czechParams,
} from "../cs/help/[id]/page";

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("help article pages", () => {
  it("exports a page per article in both languages", () => {
    for (const generate of [englishParams, czechParams]) {
      expect(generate()).toEqual(
        expect.arrayContaining([{ id: "assistant" }, { id: "ai-connections" }])
      );
    }
  });

  it("renders the English article with a link to its Czech twin", async () => {
    render(await EnglishHelpPage(params("ai-connections")));

    expect(
      screen.getByRole("heading", { level: 1, name: "Connect an AI app to Flexi Day" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Connect an app" })).toBeInTheDocument();
    expect(screen.getByText(/Open Settings and find the AI connections card/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Česká verze" })).toHaveAttribute(
      "href",
      "/cs/help/ai-connections/"
    );
    expect(screen.getByRole("link", { name: "the Assistant" }).getAttribute("href")).toBe(
      "/help/assistant/"
    );
  });

  it("renders the Czech article with resolved Czech labels", async () => {
    const { container } = render(await CzechHelpPage(params("ai-connections")));

    expect(
      screen.getByRole("heading", { level: 1, name: "Připoj k Flexi Day AI aplikaci" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Otevři Nastavení a najdi kartu AI připojení/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "English version" })).toHaveAttribute(
      "href",
      "/help/ai-connections/"
    );
    expect(container.querySelector("[lang='cs']")).not.toBeNull();
  });

  it("keeps both languages out of search indexes", async () => {
    for (const metadata of [
      await englishMetadata(params("assistant")),
      await czechMetadata(params("assistant")),
    ]) {
      expect(metadata.robots).toEqual({ index: false, follow: true });
    }
    expect((await englishMetadata(params("assistant"))).title).toBe(
      "What the Assistant can do · flexiday help"
    );
    expect((await czechMetadata(params("assistant"))).title).toBe(
      "Co umí Asistent · nápověda flexiday"
    );
  });
});
