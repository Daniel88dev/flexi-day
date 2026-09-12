import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useNow } from "../use-now";

describe("useNow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-11T08:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts at the current instant", () => {
    const { result } = renderHook(() => useNow(false));

    expect(result.current.toISOString()).toBe("2026-09-11T08:00:00.000Z");
  });

  it("advances while running", () => {
    const { result } = renderHook(() => useNow(true));

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(result.current.toISOString()).toBe("2026-09-11T08:00:30.000Z");
  });

  it("stands still when nothing is running", () => {
    const { result } = renderHook(() => useNow(false));

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.toISOString()).toBe("2026-09-11T08:00:00.000Z");
  });

  it("stops ticking once the caller stops running", () => {
    const { result, rerender } = renderHook(({ running }) => useNow(running), {
      initialProps: { running: true },
    });

    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    rerender({ running: false });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.toISOString()).toBe("2026-09-11T08:00:15.000Z");
  });
});
