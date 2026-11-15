import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AssistantChat } from "@/lib/api/assistant";
import { ChatList } from "../chat-list";

const chat: AssistantChat = {
  id: "chat-1",
  organizationId: "org-acme",
  organizationName: "Acme",
  title: "Next week",
  createdAt: new Date().toISOString(),
  lastMessageAt: new Date().toISOString(),
  turnRunning: false,
  closed: null,
};

describe("ChatList", () => {
  it("should say there are no chats yet", () => {
    render(
      <ChatList
        chats={[]}
        activeId={null}
        onOpen={vi.fn()}
        onDelete={vi.fn()}
        deleteFailed={false}
      />
    );
    expect(screen.getByText("No chats yet. Chats are kept for 180 days.")).toBeVisible();
  });

  it("should open a chat and delete one after confirming", async () => {
    const onOpen = vi.fn();
    const onDelete = vi.fn();
    render(
      <ChatList
        chats={[chat]}
        activeId="chat-1"
        onOpen={onOpen}
        onDelete={onDelete}
        deleteFailed={false}
      />
    );
    expect(screen.getByRole("region", { name: "Today" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: /^Next week/ }));
    expect(onOpen).toHaveBeenCalledWith(chat);

    await userEvent.click(screen.getByRole("button", { name: "Delete Next week" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(chat);
  });
});
