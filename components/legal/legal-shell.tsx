import type { Locale } from "@/lib/i18n/config";
import { legalHref, type TranslatedLegalPage } from "@/lib/legal";

interface LegalShellProps {
  title: string;
  /** Human-readable last-updated date, e.g. "23 July 2026". */
  updated: string;
  /** Short one-line summary shown under the title. */
  intro?: string;
  locale?: Locale;
  /** Set on pages with a twin in the other language, to link to it. */
  translatedPage?: TranslatedLegalPage;
  children: React.ReactNode;
}

const UPDATED_LABEL: Record<Locale, string> = {
  en: "Last updated",
  cs: "Poslední aktualizace",
};

const OTHER_LOCALE: Record<Locale, Locale> = { en: "cs", cs: "en" };

const VERSION_LABEL: Record<Locale, string> = {
  en: "English version",
  cs: "Česká verze",
};

export function LegalShell({
  title,
  updated,
  intro,
  locale = "en",
  translatedPage,
  children,
}: LegalShellProps) {
  const other = OTHER_LOCALE[locale];
  return (
    <div
      lang={locale}
      className="mx-auto w-full max-w-[760px] px-7 py-14 max-[600px]:px-5 max-[600px]:py-10"
    >
      <h1
        className="font-display font-semibold"
        style={{ fontSize: "clamp(30px, 5vw, 40px)", letterSpacing: "-0.03em" }}
      >
        {title}
      </h1>
      {intro ? (
        <p className="mt-3 text-[16px]" style={{ color: "var(--text-muted)", lineHeight: 1.55 }}>
          {intro}
        </p>
      ) : null}
      <p className="mt-3 text-[13.5px]" style={{ color: "var(--text-faint)" }}>
        <span>
          {UPDATED_LABEL[locale]}: {updated}
        </span>
        {translatedPage ? (
          <>
            {" · "}
            <a
              href={legalHref(translatedPage, other)}
              hrefLang={other}
              lang={other}
              className="underline underline-offset-2 hover:text-[color:var(--text)]"
            >
              {VERSION_LABEL[other]}
            </a>
          </>
        ) : null}
      </p>
      <article className="legal-prose mt-9">{children}</article>
    </div>
  );
}
