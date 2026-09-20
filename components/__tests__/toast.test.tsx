import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { pushToast, ToastHost } from "../toast";

describe("ToastHost", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a toast pushed via pushToast", async () => {
    render(<ToastHost />);
    act(() => pushToast("Feed URL copied"));
    expect(await screen.findByText("Feed URL copied")).toBeInTheDocument();
  });

  it("clears a pending dismiss timer when the host unmounts", () => {
    vi.useFakeTimers();
    const { unmount } = render(<ToastHost />);
    const idle = vi.getTimerCount();

    act(() => pushToast("Feed URL copied"));
    expect(vi.getTimerCount()).toBe(idle + 1);

    unmount();
    expect(vi.getTimerCount()).toBe(idle);
  });
});
