"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAssistantChat,
  deleteAssistantChat,
  getAssistantChat,
  getAssistantChats,
  getAssistantOrganizations,
} from "./assistant";

export const assistantKeys = {
  all: ["assistant"] as const,
  organizations: () => ["assistant", "organizations"] as const,
  chats: () => ["assistant", "chats"] as const,
  chat: (chatId: string | null) => ["assistant", "chat", chatId] as const,
};

export function useAssistantOrganizations() {
  return useQuery({
    queryKey: assistantKeys.organizations(),
    queryFn: getAssistantOrganizations,
    staleTime: 60_000,
  });
}

export function useAssistantChats(enabled = true) {
  return useQuery({ queryKey: assistantKeys.chats(), queryFn: getAssistantChats, enabled });
}

export function useAssistantChat(chatId: string | null) {
  return useQuery({
    queryKey: assistantKeys.chat(chatId),
    queryFn: () => getAssistantChat(chatId!),
    enabled: !!chatId,
  });
}

export function useCreateAssistantChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAssistantChat,
    onSuccess: () => qc.invalidateQueries({ queryKey: assistantKeys.chats() }),
  });
}

export function useDeleteAssistantChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAssistantChat,
    onSuccess: (_, chatId) => {
      qc.removeQueries({ queryKey: assistantKeys.chat(chatId) });
      return qc.invalidateQueries({ queryKey: assistantKeys.chats() });
    },
  });
}
