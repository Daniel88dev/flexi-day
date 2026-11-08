import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import type { HelpArticlePage } from "@/lib/help/knowledge-base";
import { articlePath } from "@/lib/help/paths";
import { HelpMarkdown } from "./help-markdown";

const OTHER_LOCALE: Record<Locale, Locale> = { en: "cs", cs: "en" };

const COPY: Record<
  Locale,
  { help: string; titleSuffix: string; version: string; notTranslated: string }
> = {
  en: {
    help: "Help",
    titleSuffix: "flexiday help",
    version: "English version",
    notTranslated: "This article isn't in English yet.",
  },
  cs: {
    help: "Nápověda",
    titleSuffix: "nápověda flexiday",
    version: "Česká verze",
    notTranslated: "Tento článek zatím není přeložený do češtiny.",
  },
};

/** Help article pages are citation targets for the Assistant, not search results. */
export function helpArticleMetadata(locale: Locale, article: HelpArticlePage): Metadata {
  return {
    title: `${article.title} · ${COPY[locale].titleSuffix}`,
    description: article.summary,
    robots: { index: false, follow: true },
  };
}

export function HelpArticle({ locale, article }: { locale: Locale; article: HelpArticlePage }) {
  const other = OTHER_LOCALE[locale];
  return (
    <div
      lang={article.language}
      className="mx-auto w-full max-w-[760px] px-7 py-14 max-[600px]:px-5 max-[600px]:py-10"
    >
      <p
        lang={locale}
        className="text-[13px] font-semibold tracking-wide uppercase"
        style={{ color: "var(--text-faint)" }}
      >
        {COPY[locale].help}
      </p>
      <h1
        className="font-display mt-2 font-semibold"
        style={{ fontSize: "clamp(30px, 5vw, 40px)", letterSpacing: "-0.03em" }}
      >
        {article.title}
      </h1>
      <p className="mt-3 text-[16px]" style={{ color: "var(--text-muted)", lineHeight: 1.55 }}>
        {article.summary}
      </p>
      <p className="mt-3 text-[13.5px]" style={{ color: "var(--text-faint)" }}>
        {article.language !== locale ? (
          <span lang={locale}>{COPY[locale].notTranslated} · </span>
        ) : null}
        <a
          href={articlePath(other, article.id)}
          hrefLang={other}
          lang={other}
          className="underline underline-offset-2 hover:text-[color:var(--text)]"
        >
          {COPY[other].version}
        </a>
      </p>
      <article className="legal-prose mt-9">
        <HelpMarkdown markdown={article.body} />
      </article>
    </div>
  );
}
