"use client";

import { useState } from "react";

export type DirectoryView = "cards" | "table";

export const DIRECTORY_VIEW_KEY = "flexiday.directory.view";

const readView = (): DirectoryView => {
  try {
    return window.localStorage.getItem(DIRECTORY_VIEW_KEY) === "table" ? "table" : "cards";
  } catch {
    return "cards";
  }
};

/** Cards by default; the browser remembers the last choice. */
export function useDirectoryView(): [DirectoryView, (view: DirectoryView) => void] {
  const [view, setView] = useState<DirectoryView>(readView);
  const choose = (next: DirectoryView) => {
    setView(next);
    try {
      window.localStorage.setItem(DIRECTORY_VIEW_KEY, next);
    } catch {
      // Private mode or a full quota: the choice lasts for this visit only.
    }
  };
  return [view, choose];
}

/** Case- and accent-insensitive match on the name. */
export function matchesName(name: string, query: string): boolean {
  const fold = (value: string) =>
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase();
  return fold(name).includes(fold(query.trim()));
}
