import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildKnowledgeBase,
  checkKnowledgeBase,
  hashEnglishBody,
  listAppRoutes,
} from "../knowledge-base";

const APP_ROUTES = ["/requests", "/settings", "/billing"];

const FIRST_EN_BODY = `Open {{ui:nav.requests}} to see every request.

## Booking

Enterprise costs {{price:ENTERPRISE.monthly}} a month. See [the second article](help:second).
`;

const SECOND_EN_BODY = `Open {{ui:nav.settings}}.

## Language

Pick a language.
`;

function frontmatter(fields: string): string {
  return `---\n${fields.trim()}\n---\n\n`;
}

function enFirst(body = FIRST_EN_BODY, extra = ""): string {
  return (
    frontmatter(`
id: first
title: Booking time off
summary: How to book time off.
module: leave
roles: [member]
routes: [/requests]
tools: [create_request]
keywords: [book, request]
related: [second]
goldenQuestions:
  - question: How do I book a day off?
    expectedArticles: [first]
    mustMention: [Requests]
${extra}`) + body
  );
}

function enSecond(body = SECOND_EN_BODY): string {
  return (
    frontmatter(`
id: second
title: Your settings
summary: Change your language.
module: account
roles: [member]
routes: [/settings]
tools: []
keywords: [language]
related: []
goldenQuestions:
  - question: How do I change the language?
    expectedArticles: [second]
`) + body
  );
}

function csFirst(translatedFrom = hashEnglishBody(FIRST_EN_BODY), body?: string): string {
  return (
    frontmatter(`
id: first
translatedFrom: "${translatedFrom}"
title: Žádost o volno
summary: Jak požádat o volno.
keywords: [žádost]
goldenQuestions:
  - question: Jak si vezmu den volna?
    expectedArticles: [first]
    mustMention: [Žádosti]
`) +
    (body ??
      `Otevři {{ui:nav.requests}}.

## Žádost

Enterprise stojí {{price:ENTERPRISE.monthly}} měsíčně. Viz [druhý článek](help:second).
`)
  );
}

const EN_OVERVIEW = "Flexi Day keeps track of time off. Start at {{ui:nav.dashboard}}.\n";

function validFiles(): Record<string, string> {
  return {
    "en/first.md": enFirst(),
    "en/second.md": enSecond(),
    "cs/first.md": csFirst(),
    "en/_overview.md": EN_OVERVIEW,
    "cs/_overview.md":
      frontmatter(`translatedFrom: "${hashEnglishBody(EN_OVERVIEW)}"`) +
      "Flexi Day eviduje volno. Začni na {{ui:nav.dashboard}}.\n",
    "uncovered-routes.json": JSON.stringify(["/billing"]),
  };
}

const dirs: string[] = [];

function writeContent(files: Record<string, string>): string {
  const dir = mkdtempSync(path.join(tmpdir(), "help-kb-"));
  dirs.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

function problemsFor(overrides: Record<string, string | null>, appRoutes = APP_ROUTES): string[] {
  const files: Record<string, string> = validFiles();
  for (const [file, content] of Object.entries(overrides)) {
    if (content === null) delete files[file];
    else files[file] = content;
  }
  return checkKnowledgeBase({ contentDir: writeContent(files), appRoutes });
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("buildKnowledgeBase", () => {
  it("returns articles, index, overview and golden questions per language", () => {
    const bundle = buildKnowledgeBase({ contentDir: writeContent(validFiles()) });

    expect(bundle.siteUrl).toBe("https://www.flexi-day.com");
    expect(bundle.version).toMatch(/^[0-9a-f]{12}$/);
    expect(bundle.languages.en.overview).toBe(
      "Flexi Day keeps track of time off. Start at Dashboard."
    );
    expect(bundle.languages.cs.overview).toBe("Flexi Day eviduje volno. Začni na Přehled.");
    expect(bundle.languages.en.index).toEqual([
      {
        id: "first",
        title: "Booking time off",
        summary: "How to book time off.",
        module: "leave",
        url: "https://www.flexi-day.com/help/first/",
      },
      {
        id: "second",
        title: "Your settings",
        summary: "Change your language.",
        module: "account",
        url: "https://www.flexi-day.com/help/second/",
      },
    ]);
    expect(bundle.goldenQuestions).toEqual([
      {
        language: "en",
        articleId: "first",
        question: "How do I book a day off?",
        expectedArticles: ["first"],
        mustMention: ["Requests"],
      },
      {
        language: "en",
        articleId: "second",
        question: "How do I change the language?",
        expectedArticles: ["second"],
        mustMention: [],
      },
      {
        language: "cs",
        articleId: "first",
        question: "Jak si vezmu den volna?",
        expectedArticles: ["first"],
        mustMention: ["Žádosti"],
      },
    ]);
  });

  it("resolves labels, prices and article links per language", () => {
    const bundle = buildKnowledgeBase({ contentDir: writeContent(validFiles()) });
    const en = bundle.languages.en.articles.find((a) => a.id === "first")!;
    const cs = bundle.languages.cs.articles.find((a) => a.id === "first")!;

    expect(en).toMatchObject({
      language: "en",
      url: "https://www.flexi-day.com/help/first/",
      roles: ["member"],
      routes: ["/requests"],
      tools: ["create_request"],
      keywords: ["book", "request"],
      related: ["second"],
      headings: ["Booking"],
    });
    expect(en.body).toBe(
      "Open Requests to see every request.\n\n## Booking\n\nEnterprise costs €16 a month. See [the second article](https://www.flexi-day.com/help/second/)."
    );
    expect(cs.body).toContain("Otevři Žádosti.");
    expect(cs.body).toMatch(/Enterprise stojí 16\s€ měsíčně/);
    expect(cs.body).toContain("(https://www.flexi-day.com/cs/help/second/)");
    expect(cs).toMatchObject({ language: "cs", title: "Žádost o volno", routes: ["/requests"] });
  });

  it("falls back to English for an article with no Czech file", () => {
    const bundle = buildKnowledgeBase({ contentDir: writeContent(validFiles()) });
    const second = bundle.languages.cs.articles.find((a) => a.id === "second")!;

    expect(second).toMatchObject({
      language: "en",
      title: "Your settings",
      url: "https://www.flexi-day.com/cs/help/second/",
    });
    expect(second.body).toBe("Open Nastavení.\n\n## Language\n\nPick a language.");
  });

  it("throws when a placeholder doesn't resolve", () => {
    const files = { ...validFiles(), "en/second.md": enSecond("Open {{ui:nav.nope}}.\n") };
    expect(() => buildKnowledgeBase({ contentDir: writeContent(files) })).toThrow(
      /en\/second\.md: unknown label \{\{ui:nav\.nope\}\}/
    );
  });
});

describe("checkKnowledgeBase", () => {
  it("passes on valid content", () => {
    expect(problemsFor({})).toEqual([]);
  });

  describe("placeholders", () => {
    it("fails on an unknown label", () => {
      expect(problemsFor({ "en/second.md": enSecond("Open {{ui:nav.nope}}.\n") })).toContain(
        "en/second.md: unknown label {{ui:nav.nope}}"
      );
    });

    it("fails on a label that is not plain text", () => {
      expect(problemsFor({ "en/second.md": enSecond("See {{ui:nav.sections}}.\n") })).toContain(
        "en/second.md: unknown label {{ui:nav.sections}}"
      );
    });

    it("fails on an unknown price", () => {
      expect(
        problemsFor({ "en/second.md": enSecond("It costs {{price:GOLD.monthly}}.\n") })
      ).toContain("en/second.md: unknown price {{price:GOLD.monthly}}");
    });

    it("fails on an unknown placeholder kind or a malformed one", () => {
      const problems = problemsFor({ "en/second.md": enSecond("A {{color:red}} and {{ui:}}.\n") });
      expect(problems).toContain("en/second.md: unknown placeholder {{color:red}}");
      expect(problems).toContain("en/second.md: malformed placeholder {{ui:}}");
    });

    it("checks the Czech files and the overviews too", () => {
      const problems = problemsFor({
        "cs/first.md": csFirst(undefined, "Otevři {{ui:nav.nope}}.\n"),
        "en/_overview.md": "Start at {{ui:nav.gone}}.\n",
      });
      expect(problems).toContain("cs/first.md: unknown label {{ui:nav.nope}}");
      expect(problems).toContain("en/_overview.md: unknown label {{ui:nav.gone}}");
    });
  });

  describe("Czech hashes", () => {
    it("fails when the English body changed after the translation", () => {
      expect(problemsFor({ "cs/first.md": csFirst("0123456789ab") })).toContain(
        `cs/first.md: translatedFrom is 0123456789ab, but en/first.md hashes to ${hashEnglishBody(FIRST_EN_BODY)}. Update the translation, then the hash.`
      );
    });

    it("fails when the overview translation is stale", () => {
      const problems = problemsFor({
        "cs/_overview.md": frontmatter(`translatedFrom: "0123456789ab"`) + "Přehled.\n",
      });
      expect(
        problems.some((p) => p.startsWith("cs/_overview.md: translatedFrom is 0123456789ab"))
      ).toBe(true);
    });

    it("fails on a Czech file with no English source", () => {
      expect(problemsFor({ "cs/third.md": csFirst().replace("id: first", "id: third") })).toContain(
        "cs/third.md: has no English source en/third.md"
      );
    });
  });

  describe("length cap", () => {
    it("fails on an article over about 1,500 tokens", () => {
      const long = `${"Word ".repeat(1100)}\n`;
      const problems = problemsFor({ "en/second.md": enSecond(long) });
      expect(problems).toContain("en/second.md: about 1572 tokens, over the 1500 cap. Split it.");
    });
  });

  describe("links", () => {
    it("fails on a link to a missing article", () => {
      expect(problemsFor({ "en/second.md": enSecond("See [it](help:missing).\n") })).toContain(
        "en/second.md: links to help:missing, which doesn't exist"
      );
    });

    it("fails on related and expected articles that don't exist", () => {
      const problems = problemsFor({
        "en/first.md": enFirst().replace("related: [second]", "related: [ghost]"),
        "en/second.md": enSecond().replace(
          "expectedArticles: [second]",
          "expectedArticles: [phantom]"
        ),
      });
      expect(problems).toContain("en/first.md: related names ghost, which doesn't exist");
      expect(problems).toContain(
        "en/second.md: golden question expects phantom, which doesn't exist"
      );
    });

    it("fails on a hard-coded help URL", () => {
      expect(problemsFor({ "en/second.md": enSecond("See [it](/help/first/).\n") })).toContain(
        "en/second.md: write links between articles as help:<id>, not /help/first/"
      );
    });
  });

  describe("routes", () => {
    it("fails on an app route no article covers and the allow list doesn't name", () => {
      expect(problemsFor({}, [...APP_ROUTES, "/report"])).toContain(
        "/report: no article lists this route. Cover it, or add it to uncovered-routes.json"
      );
    });

    it("fails on an allow-list entry an article already covers", () => {
      expect(
        problemsFor({ "uncovered-routes.json": JSON.stringify(["/billing", "/settings"]) })
      ).toContain("uncovered-routes.json: /settings is covered by an article now. Remove it");
    });

    it("fails on routes that aren't app routes", () => {
      const problems = problemsFor({
        "en/second.md": enSecond().replace("routes: [/settings]", "routes: [/setings]"),
        "uncovered-routes.json": JSON.stringify(["/billing", "/settings", "/gone"]),
      });
      expect(problems).toContain("en/second.md: route /setings isn't an app route");
      expect(problems).toContain("uncovered-routes.json: /gone isn't an app route");
    });
  });

  describe("frontmatter", () => {
    it("fails on a missing field", () => {
      const problems = problemsFor({
        "en/second.md": enSecond().replace("summary: Change your language.\n", ""),
      });
      expect(problems).toContain("en/second.md: summary: missing");
    });

    it("fails on an id that doesn't match the file name", () => {
      const problems = problemsFor({
        "en/second.md": enSecond().replace("id: second", "id: other"),
      });
      expect(problems).toContain("en/second.md: id other doesn't match the file name");
    });

    it("asks for a quoted translatedFrom", () => {
      const problems = problemsFor({
        "cs/first.md": csFirst().replace(/translatedFrom: ".*"/, "translatedFrom: 123456789012"),
      });
      expect(problems).toContain("cs/first.md: translatedFrom: 12 hex characters in quotes");
    });

    it("fails on structural fields in a Czech file", () => {
      const problems = problemsFor({
        "cs/first.md": csFirst().replace("title:", "module: leave\ntitle:"),
      });
      expect(problems.some((p) => p.startsWith("cs/first.md: module:"))).toBe(true);
    });
  });
});

describe("listAppRoutes", () => {
  it("lists every page under the signed-in app as a path", () => {
    const routes = listAppRoutes(path.join(process.cwd(), "app/(app)"));
    expect(routes).toContain("/dashboard");
    expect(routes).toContain("/groups/detail");
    expect(routes).toContain("/directory/person/edit");
    expect(routes).not.toContain("/support/support-gate");
    expect(routes).toEqual([...routes].sort());
  });
});

describe("hashEnglishBody", () => {
  it("ignores line endings and surrounding blank lines", () => {
    expect(hashEnglishBody("\nHello\r\nworld\n\n")).toBe(hashEnglishBody("Hello\nworld"));
  });

  it("is the first 12 hex characters of the body's SHA-256", () => {
    expect(hashEnglishBody("Hello")).toBe("185f8db32271");
  });
});
