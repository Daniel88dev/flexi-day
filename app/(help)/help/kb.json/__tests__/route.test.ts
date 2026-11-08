import { describe, expect, it } from "vitest";
import { GET, dynamic } from "../route";

describe("GET /help/kb.json", () => {
  it("is static, so the export writes it as a file", () => {
    expect(dynamic).toBe("force-static");
  });

  it("serves articles, index, overview and golden questions in both languages", async () => {
    const response = GET();
    expect(response.headers.get("content-type")).toContain("application/json");
    const bundle = await response.json();

    for (const language of ["en", "cs"]) {
      const { overview, index, articles } = bundle.languages[language];
      expect(overview.length).toBeGreaterThan(0);
      expect(index.map((entry: { id: string }) => entry.id)).toEqual(
        expect.arrayContaining(["assistant", "ai-connections"])
      );
      expect(articles.find((a: { id: string }) => a.id === "assistant").language).toBe(language);
    }
    expect(bundle.languages.cs.index.find((e: { id: string }) => e.id === "assistant")).toEqual({
      id: "assistant",
      title: "Co umí Asistent",
      summary: expect.any(String),
      module: "assistant-and-mcp",
      url: "https://www.flexi-day.com/cs/help/assistant/",
    });
    expect(bundle.goldenQuestions).toContainEqual(
      expect.objectContaining({
        language: "cs",
        articleId: "ai-connections",
        question: "Jak připojím ChatGPT k Flexi Day?",
      })
    );
  });
});
