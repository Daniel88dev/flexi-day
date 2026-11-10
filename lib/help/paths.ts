import type { Locale } from "@/lib/i18n/config";

/** The public page of a help article: `/help/<id>/` in English, `/cs/help/<id>/` in Czech. */
export function articlePath(locale: Locale, articleId: string): string {
  return `${locale === "en" ? "" : `/${locale}`}/help/${articleId}/`;
}
