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

  it("dismisses a toast after four seconds", () => {
    vi.useFakeTimers();
    render(<ToastHost />);

    act(() => pushToast("Feed URL copied"));
    act(() => vi.advanceTimersByTime(3999));
    expect(screen.getByText("Feed URL copied")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("Feed URL copied")).not.toBeInTheDocument();
  });

  it("links its action and dismisses itself when the link is followed", () => {
    render(<ToastHost />);
    act(() =>
      pushToast("Group event created", "ok", {
        action: { label: "View on calendar", href: "/dashboard/?groupId=g-1&month=2026-11" },
      })
    );

    const link = screen.getByRole("link", { name: "View on calendar" });
    // next/link applies `trailingSlash` only under the app's config, so the slash is optional here.
    expect(link.getAttribute("href")).toMatch(/^\/dashboard\/?\?groupId=g-1&month=2026-11$/);
    act(() => link.click());
    expect(screen.queryByText("Group event created")).not.toBeInTheDocument();
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
