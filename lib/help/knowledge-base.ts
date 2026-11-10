import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { lexer } from "marked";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { PLAN_PRICES, SLOT_PRICE, formatEur } from "@/lib/billing/prices";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { cs } from "@/lib/i18n/dictionaries/cs";
import { en } from "@/lib/i18n/dictionaries/en";
import { SITE_URL } from "@/lib/site";
import { articlePath } from "./paths";

export const HELP_MODULES = [
  "account",
  "organization",
  "groups",
  "leave",
  "quotas",
  "reports",
  "calendars",
  "attendance",
  "directory",
  "group-events",
  "notifications",
  "assistant-and-mcp",
  "troubleshooting",
] as const;

export const HELP_ROLES = [
  "member",
  "approver",
  "manager",
  "group-admin",
  "org-admin",
  "owner",
] as const;

export const TOKEN_CAP = 1500;
const CHARS_PER_TOKEN = 3.5;

export const DEFAULT_CONTENT_DIR = path.join(process.cwd(), "content/help");
export const DEFAULT_APP_DIR = path.join(process.cwd(), "app/(app)");
const ALLOW_LIST_FILE = "uncovered-routes.json";
const OVERVIEW_ID = "_overview";

const DICTIONARIES: Record<Locale, object> = { en, cs };

const PRICES: Record<string, number> = {
  "PRO.monthly": PLAN_PRICES.PRO.monthly,
  "PRO.yearly": PLAN_PRICES.PRO.yearly,
  "ENTERPRISE.monthly": PLAN_PRICES.ENTERPRISE.monthly,
  "ENTERPRISE.yearly": PLAN_PRICES.ENTERPRISE.yearly,
  "SLOT.monthly": SLOT_PRICE.monthly,
  "SLOT.yearly": SLOT_PRICE.yearly,
};

const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "lowercase words joined by dashes");
const line = z
  .string()
  .min(1)
  .refine((value) => !value.includes("\n"), "one line");
const hash = z
  .string({ error: "12 hex characters in quotes" })
  .regex(/^[0-9a-f]{12}$/, "12 hex characters in quotes");

const goldenQuestion = z.strictObject({
  question: line,
  expectedArticles: z.array(id).min(1),
  mustMention: z.array(z.string().min(1)).default([]),
});

const translated = {
  title: line,
  summary: line,
  keywords: z.array(z.string().min(1)).min(1),
  goldenQuestions: z.array(goldenQuestion).min(1).max(3),
};

const englishFrontmatter = z.strictObject({
  id,
  ...translated,
  module: z.enum(HELP_MODULES),
  roles: z.array(z.enum(HELP_ROLES)).min(1),
  routes: z.array(z.string().regex(/^\/[a-z0-9/-]*$/, "an app path like /requests")).default([]),
  tools: z.array(z.string().min(1)).default([]),
  related: z.array(id).default([]),
});

const czechFrontmatter = z.strictObject({ id, translatedFrom: hash, ...translated });
const englishOverview = z.strictObject({});
const czechOverview = z.strictObject({ translatedFrom: hash });

type EnglishFrontmatter = z.infer<typeof englishFrontmatter>;
type CzechFrontmatter = z.infer<typeof czechFrontmatter>;
type GoldenQuestion = z.infer<typeof goldenQuestion>;

export type HelpModule = (typeof HELP_MODULES)[number];

export interface KnowledgeBaseArticle {
  id: string;
  /** The language the text is in: "en" on a Czech entry that fell back to English. */
  language: Locale;
  url: string;
  title: string;
  summary: string;
  module: HelpModule;
  roles: string[];
  routes: string[];
  tools: string[];
  keywords: string[];
  related: string[];
  headings: string[];
  body: string;
}

export interface KnowledgeBaseIndexEntry {
  id: string;
  title: string;
  summary: string;
  module: HelpModule;
  url: string;
}

export interface KnowledgeBaseGoldenQuestion extends GoldenQuestion {
  language: Locale;
  articleId: string;
}

export interface KnowledgeBaseBundle {
  version: string;
  siteUrl: string;
  languages: Record<
    Locale,
    { overview: string; index: KnowledgeBaseIndexEntry[]; articles: KnowledgeBaseArticle[] }
  >;
  goldenQuestions: KnowledgeBaseGoldenQuestion[];
}

interface SourceFile<T> {
  file: string;
  data: T;
  body: string;
}

interface HelpSource {
  english: Map<string, SourceFile<EnglishFrontmatter>>;
  czech: Map<string, SourceFile<CzechFrontmatter>>;
  overview: Partial<Record<Locale, SourceFile<{ translatedFrom?: string }>>>;
  problems: string[];
}

/** Hash of an English body that a Czech file's `translatedFrom` pins. */
export function hashEnglishBody(body: string): string {
  return createHash("sha256").update(normalize(body)).digest("hex").slice(0, 12);
}

function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}

function splitFrontmatter(raw: string): { frontmatter: unknown; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { frontmatter: {}, body: raw };
  return { frontmatter: parseYaml(match[1]) ?? {}, body: match[2] };
}

function readSource(contentDir: string): HelpSource {
  const source: HelpSource = {
    english: new Map(),
    czech: new Map(),
    overview: {},
    problems: [],
  };

  for (const locale of LOCALES) {
    const dir = path.join(contentDir, locale);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).sort()) {
      if (!name.endsWith(".md")) continue;
      const file = `${locale}/${name}`;
      const fileId = name.slice(0, -3);
      let parsed: { frontmatter: unknown; body: string };
      try {
        parsed = splitFrontmatter(readFileSync(path.join(dir, name), "utf8"));
      } catch (error) {
        source.problems.push(`${file}: frontmatter isn't valid YAML (${(error as Error).message})`);
        continue;
      }

      const raw = (parsed.frontmatter ?? {}) as Record<string, unknown>;
      if (fileId !== OVERVIEW_ID && typeof raw.id === "string" && raw.id !== fileId) {
        source.problems.push(`${file}: id ${raw.id} doesn't match the file name`);
        continue;
      }
      const schema =
        fileId === OVERVIEW_ID
          ? locale === "en"
            ? englishOverview
            : czechOverview
          : locale === "en"
            ? englishFrontmatter
            : czechFrontmatter;
      const result = schema.safeParse(raw);
      if (!result.success) {
        for (const issue of result.error.issues) {
          if (issue.code === "unrecognized_keys") {
            for (const key of issue.keys) {
              source.problems.push(`${file}: ${key}: not allowed here`);
            }
            continue;
          }
          const field = issue.path.join(".") || "frontmatter";
          const missing = issue.path.length === 1 && !Object.hasOwn(raw, issue.path[0]);
          source.problems.push(`${file}: ${field}: ${missing ? "missing" : issue.message}`);
        }
        continue;
      }

      if (fileId === OVERVIEW_ID) {
        source.overview[locale] = { file, data: result.data, body: parsed.body };
        continue;
      }
      const data = result.data as unknown;
      if (locale === "en") {
        source.english.set(fileId, { file, data: data as EnglishFrontmatter, body: parsed.body });
      } else {
        source.czech.set(fileId, { file, data: data as CzechFrontmatter, body: parsed.body });
      }
    }
  }

  if (!source.overview.en) source.problems.push("en/_overview.md: missing");
  return source;
}

function lookupLabel(locale: Locale, key: string): string | undefined {
  let value: unknown = DICTIONARIES[locale];
  for (const part of key.split(".")) {
    if (typeof value !== "object" || value === null || !Object.hasOwn(value, part)) {
      return undefined;
    }
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === "string" ? value : undefined;
}

const PLACEHOLDER = /\{\{([^{}]*)\}\}/g;

interface ResolveOptions {
  locale: Locale;
  /** Prepended to `/help/<id>/` and `/cs/help/<id>/` in links between articles. */
  origin: string;
}

function resolveText(text: string, file: string, options: ResolveOptions, problems: string[]) {
  const { locale, origin } = options;
  const dateLocale = lookupLabel(locale, "common.dateLocale") ?? locale;

  const resolved = text.replace(PLACEHOLDER, (whole, inner: string) => {
    const match = /^\s*([a-z]+):([A-Za-z0-9_.]+)\s*$/.exec(inner);
    if (!match) {
      problems.push(`${file}: malformed placeholder ${whole}`);
      return whole;
    }
    const [, kind, key] = match;
    if (kind === "ui") {
      const label = lookupLabel(locale, key);
      if (label === undefined) problems.push(`${file}: unknown label ${whole}`);
      return label ?? whole;
    }
    if (kind === "price") {
      const price = PRICES[key];
      if (price === undefined) {
        problems.push(`${file}: unknown price ${whole}`);
        return whole;
      }
      return formatEur(dateLocale, price);
    }
    problems.push(`${file}: unknown placeholder ${whole}`);
    return whole;
  });

  return resolved.replace(
    /\]\(help:([a-z0-9-]+)(#[\w-]+)?\)/g,
    (_whole, target: string, anchor = "") => `](${origin}${articlePath(locale, target)}${anchor})`
  );
}

function headingsOf(body: string): string[] {
  return lexer(body)
    .filter((token) => token.type === "heading")
    .map((token) => (token as { text: string }).text);
}

interface ResolvedKnowledgeBase {
  bundle: KnowledgeBaseBundle;
  problems: string[];
}

function resolve(source: HelpSource, origin: string): ResolvedKnowledgeBase {
  const problems = [...source.problems];
  const languages = {} as KnowledgeBaseBundle["languages"];
  const goldenQuestions: KnowledgeBaseGoldenQuestion[] = [];

  for (const locale of LOCALES) {
    const options = { locale, origin };
    const overviewSource = source.overview[locale] ?? source.overview.en;
    const overview = overviewSource
      ? normalize(resolveText(overviewSource.body, overviewSource.file, options, problems))
      : "";

    const articles: KnowledgeBaseArticle[] = [];
    for (const [articleId, english] of source.english) {
      const czech = locale === "cs" ? source.czech.get(articleId) : undefined;
      const text = czech ?? english;
      const resolveField = (value: string) => resolveText(value, text.file, options, problems);
      const body = normalize(resolveText(text.body, text.file, options, problems));
      articles.push({
        id: articleId,
        language: czech ? "cs" : "en",
        url: `${SITE_URL}${articlePath(locale, articleId)}`,
        title: resolveField(text.data.title),
        summary: resolveField(text.data.summary),
        module: english.data.module,
        roles: english.data.roles,
        routes: english.data.routes,
        tools: english.data.tools,
        keywords: text.data.keywords,
        related: english.data.related,
        headings: headingsOf(body),
        body,
      });
      if (locale === "en" || czech) {
        for (const question of text.data.goldenQuestions) {
          goldenQuestions.push({ language: locale, articleId, ...question });
        }
      }
    }

    languages[locale] = {
      overview,
      index: articles.map(({ id: articleId, title, summary, module, url }) => ({
        id: articleId,
        title,
        summary,
        module,
        url,
      })),
      articles,
    };
  }

  const content = { siteUrl: SITE_URL, languages, goldenQuestions };
  const version = createHash("sha256").update(JSON.stringify(content)).digest("hex").slice(0, 12);
  return { bundle: { version, ...content }, problems: [...new Set(problems)] };
}

/**
 * The bundle published at `/help/kb.json`. Throws when the content has a problem the build can't
 * paper over: a placeholder that doesn't resolve or invalid frontmatter.
 */
export function buildKnowledgeBase(options: { contentDir?: string } = {}): KnowledgeBaseBundle {
  const { bundle, problems } = resolve(
    readSource(options.contentDir ?? DEFAULT_CONTENT_DIR),
    SITE_URL
  );
  if (problems.length) {
    throw new Error(`Help articles have problems:\n${problems.join("\n")}`);
  }
  return bundle;
}

/** Every page under the signed-in app, as `/path` without route groups. */
export function listAppRoutes(appDir: string = DEFAULT_APP_DIR): string[] {
  const routes: string[] = [];
  const walk = (dir: string, segments: string[]) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) {
        if (name === "__tests__") continue;
        walk(full, /^\(.*\)$/.test(name) ? segments : [...segments, name]);
      } else if (name === "page.tsx") {
        routes.push(`/${segments.join("/")}`);
      }
    }
  };
  walk(appDir, []);
  return routes.sort();
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Every rule the CI enforces on the help articles. Returns one line per problem; an empty list
 * means the content is good.
 */
export function checkKnowledgeBase(options: {
  contentDir?: string;
  appRoutes?: string[];
}): string[] {
  const contentDir = options.contentDir ?? DEFAULT_CONTENT_DIR;
  const appRoutes = new Set(options.appRoutes ?? listAppRoutes());
  const source = readSource(contentDir);
  const { bundle, problems } = resolve(source, "");
  const exists = (articleId: string) => source.english.has(articleId);

  for (const [articleId, czech] of source.czech) {
    const english = source.english.get(articleId);
    if (!english) {
      problems.push(`${czech.file}: has no English source en/${articleId}.md`);
      continue;
    }
    checkHash(czech.file, czech.data.translatedFrom, english, problems);
    for (const question of czech.data.goldenQuestions) {
      for (const expected of question.expectedArticles) {
        if (!exists(expected)) {
          problems.push(`${czech.file}: golden question expects ${expected}, which doesn't exist`);
        }
      }
    }
  }
  const czechOverviewSource = source.overview.cs;
  if (czechOverviewSource && source.overview.en) {
    checkHash(
      czechOverviewSource.file,
      czechOverviewSource.data.translatedFrom ?? "",
      source.overview.en,
      problems
    );
  }

  for (const english of source.english.values()) {
    for (const related of english.data.related) {
      if (!exists(related)) {
        problems.push(`${english.file}: related names ${related}, which doesn't exist`);
      }
    }
    for (const question of english.data.goldenQuestions) {
      for (const expected of question.expectedArticles) {
        if (!exists(expected)) {
          problems.push(
            `${english.file}: golden question expects ${expected}, which doesn't exist`
          );
        }
      }
    }
    for (const route of english.data.routes) {
      if (!appRoutes.has(route)) {
        problems.push(`${english.file}: route ${route} isn't an app route`);
      }
    }
  }

  const files = [
    ...source.english.values(),
    ...source.czech.values(),
    ...Object.values(source.overview),
  ];
  for (const { file, body } of files) {
    for (const [, target] of body.matchAll(/\]\(help:([a-z0-9-]+)/g)) {
      if (!exists(target)) problems.push(`${file}: links to help:${target}, which doesn't exist`);
    }
    for (const [, url] of body.matchAll(
      /\]\(((?:https?:\/\/(?:www\.)?flexi-day\.com)?(?:\/[a-z]{2})?\/help\/[^)]*)\)/g
    )) {
      problems.push(`${file}: write links between articles as help:<id>, not ${url}`);
    }
  }

  for (const locale of LOCALES) {
    const { overview, articles } = bundle.languages[locale];
    const texts = [
      { file: `${locale}/_overview.md`, text: overview, own: !!source.overview[locale] },
      ...articles.map((article) => ({
        file: `${locale}/${article.id}.md`,
        text: article.body,
        own: article.language === locale,
      })),
    ];
    for (const { file, text, own } of texts) {
      const tokens = estimateTokens(text);
      if (own && tokens > TOKEN_CAP) {
        problems.push(`${file}: about ${tokens} tokens, over the ${TOKEN_CAP} cap. Split it.`);
      }
    }
  }

  const covered = new Set([...source.english.values()].flatMap((english) => english.data.routes));
  const allowList = readAllowList(contentDir, problems);
  for (const route of allowList) {
    if (!appRoutes.has(route)) {
      problems.push(`${ALLOW_LIST_FILE}: ${route} isn't an app route`);
    } else if (covered.has(route)) {
      problems.push(`${ALLOW_LIST_FILE}: ${route} is covered by an article now. Remove it`);
    }
  }
  for (const route of appRoutes) {
    if (!covered.has(route) && !allowList.includes(route)) {
      problems.push(
        `${route}: no article lists this route. Cover it, or add it to ${ALLOW_LIST_FILE}`
      );
    }
  }

  return [...new Set(problems)];
}

function checkHash(
  file: string,
  translatedFrom: string,
  english: SourceFile<unknown>,
  problems: string[]
) {
  const expected = hashEnglishBody(english.body);
  if (translatedFrom !== expected) {
    problems.push(
      `${file}: translatedFrom is ${translatedFrom}, but ${english.file} hashes to ${expected}. Update the translation, then the hash.`
    );
  }
}

function readAllowList(contentDir: string, problems: string[]): string[] {
  const file = path.join(contentDir, ALLOW_LIST_FILE);
  if (!existsSync(file)) return [];
  const parsed = z.array(z.string()).safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!parsed.success) {
    problems.push(`${ALLOW_LIST_FILE}: must be a JSON array of routes`);
    return [];
  }
  return parsed.data;
}

export interface HelpArticlePage {
  id: string;
  language: Locale;
  title: string;
  summary: string;
  body: string;
}

let pageCache: Record<Locale, Map<string, HelpArticlePage>> | undefined;

function pages(): Record<Locale, Map<string, HelpArticlePage>> {
  // Rebuilt on every call in `next dev`, so an edited article shows without a restart.
  if (!pageCache || process.env.NODE_ENV === "development") {
    const { bundle, problems } = resolve(readSource(DEFAULT_CONTENT_DIR), "");
    if (problems.length) throw new Error(`Help articles have problems:\n${problems.join("\n")}`);
    pageCache = { en: new Map(), cs: new Map() };
    for (const locale of LOCALES) {
      for (const { id: articleId, language, title, summary, body } of bundle.languages[locale]
        .articles) {
        pageCache[locale].set(articleId, { id: articleId, language, title, summary, body });
      }
    }
  }
  return pageCache;
}

/** Article ids with a page, the same in every language. */
export function helpArticleIds(): string[] {
  return [...pages().en.keys()];
}

/** One article as its page shows it, with links between articles kept relative. */
export function getHelpArticle(locale: Locale, articleId: string): HelpArticlePage | undefined {
  return pages()[locale].get(articleId);
}
