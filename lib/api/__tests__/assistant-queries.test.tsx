import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const getOrganizationsMock = vi.fn();
const getChatsMock = vi.fn();
const getChatMock = vi.fn();
const createChatMock = vi.fn();
const deleteChatMock = vi.fn();
vi.mock("../assistant", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../assistant")>()),
  getAssistantOrganizations: () => getOrganizationsMock(),
  getAssistantChats: () => getChatsMock(),
  getAssistantChat: (chatId: string) => getChatMock(chatId),
  createAssistantChat: (organizationId: string) => createChatMock(organizationId),
  deleteAssistantChat: (chatId: string) => deleteChatMock(chatId),
}));

import {
  assistantKeys,
  useAssistantChat,
  useAssistantChats,
  useAssistantOrganizations,
  useCreateAssistantChat,
  useDeleteAssistantChat,
} from "../assistant-queries";

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  for (const mock of [
    getOrganizationsMock,
    getChatsMock,
    getChatMock,
    createChatMock,
    deleteChatMock,
  ]) {
    mock.mockReset();
  }
});

describe("useAssistantOrganizations", () => {
  it("caches the organizations under their own key", async () => {
    getOrganizationsMock.mockResolvedValue({ organizations: [] });
    const { client, wrapper: Wrapper } = wrapper();

    const { result } = renderHook(() => useAssistantOrganizations(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(assistantKeys.organizations())).toEqual({ organizations: [] });
  });
});

describe("useAssistantChats", () => {
  it("fetches the chats only while enabled", async () => {
    getChatsMock.mockResolvedValue({ chats: [] });
    const { wrapper: Wrapper } = wrapper();

    const idle = renderHook(() => useAssistantChats(false), { wrapper: Wrapper });
    expect(idle.result.current.fetchStatus).toBe("idle");
    const { result } = renderHook(() => useAssistantChats(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getChatsMock).toHaveBeenCalledTimes(1);
  });
});

describe("useAssistantChat", () => {
  it("waits for a chat id, then fetches that chat", async () => {
    getChatMock.mockResolvedValue({ chat: { id: "chat-1" }, messages: [] });
    const { client, wrapper: Wrapper } = wrapper();

    const idle = renderHook(() => useAssistantChat(null), { wrapper: Wrapper });
    expect(idle.result.current.fetchStatus).toBe("idle");
    const { result } = renderHook(() => useAssistantChat("chat-1"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getChatMock).toHaveBeenCalledWith("chat-1");
    expect(client.getQueryData(assistantKeys.chat("chat-1"))).toEqual({
      chat: { id: "chat-1" },
      messages: [],
    });
  });
});

describe("useCreateAssistantChat", () => {
  it("creates a chat and refreshes the chat list", async () => {
    createChatMock.mockResolvedValue({ chat: { id: "chat-1" } });
    const { client, wrapper: Wrapper } = wrapper();
    const invalidate = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useCreateAssistantChat(), { wrapper: Wrapper });
    await act(() => result.current.mutateAsync("org-1"));

    expect(createChatMock).toHaveBeenCalledWith("org-1");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: assistantKeys.chats() });
  });
});

describe("useDeleteAssistantChat", () => {
  it("drops the deleted chat's cache and refreshes the chat list", async () => {
    deleteChatMock.mockResolvedValue(undefined);
    const { client, wrapper: Wrapper } = wrapper();
    client.setQueryData(assistantKeys.chat("chat-1"), { chat: { id: "chat-1" } });
    const invalidate = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useDeleteAssistantChat(), { wrapper: Wrapper });
    await act(() => result.current.mutateAsync("chat-1"));

    expect(deleteChatMock).toHaveBeenCalledWith("chat-1");
    expect(client.getQueryData(assistantKeys.chat("chat-1"))).toBeUndefined();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: assistantKeys.chats() });
  });
});
