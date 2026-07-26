"use client";

import { useContext } from "react";
import { I18nContext } from "./i18n-provider";

/**
 * Access the active locale, its dictionary (`t`), and a setter.
 * Usage: `const { t } = useTranslation(); …t.settings.title…`
 */
export function useTranslation() {
  return useContext(I18nContext);
}
