import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useIsMobile } from "../use-mobile";

type Listener = () => void;

function stubMatchMedia(matches: boolean) {
  const listeners = new Set<Listener>();
  const list = {
    matches,
    media: "",
    addEventListener: (_: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_: string, listener: Listener) => listeners.delete(listener),
  };
  vi.spyOn(window, "matchMedia").mockImplementation(() => list as unknown as MediaQueryList);
  return {
    resize(next: boolean) {
      list.matches = next;
      listeners.forEach((listener) => listener());
    },
    listeners,
  };
}

describe("useIsMobile", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns whether the viewport is below the md breakpoint", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("asks for widths below 768px", () => {
    stubMatchMedia(false);
    renderHook(() => useIsMobile());
    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
  });

  it("follows the media query as it changes and unsubscribes on unmount", () => {
    const media = stubMatchMedia(false);
    const { result, unmount } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => media.resize(true));
    expect(result.current).toBe(true);

    unmount();
    expect(media.listeners.size).toBe(0);
  });
});
