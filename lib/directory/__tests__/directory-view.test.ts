import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  DIRECTORY_VIEW_KEY,
  matchesName,
  matchesPerson,
  useDirectoryView,
} from "../directory-view";

describe("useDirectoryView", () => {
  beforeEach(() => window.localStorage.clear());

  it("returns cards when the browser holds no choice", () => {
    const { result } = renderHook(() => useDirectoryView());
    expect(result.current[0]).toBe("cards");
  });

  it("stores the choice and reads it back on the next mount", () => {
    const first = renderHook(() => useDirectoryView());
    act(() => first.result.current[1]("table"));
    expect(first.result.current[0]).toBe("table");
    first.unmount();

    expect(renderHook(() => useDirectoryView()).result.current[0]).toBe("table");
  });

  it("returns cards for a stored value it doesn't know", () => {
    window.localStorage.setItem(DIRECTORY_VIEW_KEY, "grid");
    expect(renderHook(() => useDirectoryView()).result.current[0]).toBe("cards");
  });
});

describe("matchesName", () => {
  it("matches ignoring case, accents and surrounding spaces", () => {
    expect(matchesName("Jana Svobodová", "  SVOBODOVA ")).toBe(true);
    expect(matchesName("Řehoř Říha", "rehor")).toBe(true);
  });

  it("returns false for a name without the text, and true for an empty query", () => {
    expect(matchesName("Jana Svobodová", "petr")).toBe(false);
    expect(matchesName("Jana Svobodová", "")).toBe(true);
  });
});

describe("matchesPerson", () => {
  it("matches the name or the job title", () => {
    const person = { name: "Jana Svobodová", jobTitle: "Účetní" };
    expect(matchesPerson(person, "jana")).toBe(true);
    expect(matchesPerson(person, "ucetni")).toBe(true);
    expect(matchesPerson(person, "sales")).toBe(false);
  });

  it("matches on the name alone when there is no job title", () => {
    expect(matchesPerson({ name: "Petr Novák", jobTitle: null }, "novak")).toBe(true);
    expect(matchesPerson({ name: "Petr Novák" }, "lead")).toBe(false);
  });
});
