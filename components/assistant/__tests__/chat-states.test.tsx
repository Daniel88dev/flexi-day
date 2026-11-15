import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClosedChat, EmptyChat, LoadingChat, ReadOnlyChat } from "../chat-states";

describe("ClosedChat", () => {
  it("should say why the chat closed and start a new one", async () => {
    const onNewChat = vi.fn();
    render(<ClosedChat reason="idle" onNewChat={onNewChat} />);
    expect(screen.getByTestId("assistant-chat-closed")).toHaveTextContent(
      "Nobody wrote in it for 30 days."
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onNewChat).toHaveBeenCalledOnce();
  });
});

describe("ReadOnlyChat", () => {
  it("should render the given text", () => {
    render(<ReadOnlyChat text="The Assistant is off for Acme." />);
    expect(screen.getByTestId("assistant-read-only")).toHaveTextContent(
      "The Assistant is off for Acme."
    );
  });
});

describe("EmptyChat", () => {
  it("should render the picker and send a suggestion", async () => {
    const onPick = vi.fn();
    render(<EmptyChat picker={<span>Acme</span>} onPick={onPick} />);
    expect(
      screen.getByRole("heading", { name: "Ask about time off, attendance or your team" })
    ).toBeVisible();
    expect(screen.getByText("Acme")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Who's away next week?" }));
    expect(onPick).toHaveBeenCalledWith("Who's away next week?");
  });
});

describe("LoadingChat", () => {
  it("should render a busy placeholder", () => {
    const { container } = render(<LoadingChat />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});
