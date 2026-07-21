import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { pushToast, ToastHost } from "../toast";

describe("ToastHost", () => {
  it("shows a toast pushed via pushToast", async () => {
    render(<ToastHost />);
    act(() => pushToast("Feed URL copied"));
    expect(await screen.findByText("Feed URL copied")).toBeInTheDocument();
  });
});
