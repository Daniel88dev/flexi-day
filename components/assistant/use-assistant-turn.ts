"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createAssistantChat,
  reconnectAssistantStream,
  sendAssistantMessage,
  type ChatStreamEvent,
  type ToolStatus,
} from "@/lib/api/assistant";
import { assistantKeys } from "@/lib/api/assistant-queries";
import { errorCode } from "@/lib/api/client";

export type LiveTool = { eventId: string; name: string | null; status: ToolStatus };

/** The answer being written, as the stream has shown it so far. */
export type LiveTurn = {
  /** The text just sent; null when the panel reconnected to a turn already running. */
  userText: string | null;
  phase: "streaming" | "reconnecting";
  tools: LiveTool[];
  /** Finished Assistant messages of this turn. */
  texts: string[];
  /** Text arriving now; dropped on reconnect. */
  partial: string;
  notice: string | null;
  lastEventId: string | null;
};

export type FailedSend = { text: string; code: string | null };

const RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 1_000;

const startTurn = (userText: string | null, phase: LiveTurn["phase"]): LiveTurn => ({
  userText,
  phase,
  tools: [],
  texts: [],
  partial: "",
  notice: null,
  lastEventId: null,
});

/** Applies one stream event to the live turn. */
export function applyStreamEvent(turn: LiveTurn, event: ChatStreamEvent): LiveTurn {
  const next = { ...turn, lastEventId: event.id ?? turn.lastEventId };
  switch (event.event) {
    case "text":
      return "delta" in event.data
        ? { ...next, phase: "streaming", partial: next.partial + event.data.delta }
        : { ...next, phase: "streaming", texts: [...next.texts, event.data.text], partial: "" };
    case "tool": {
      const { eventId, name, status } = event.data;
      const known = next.tools.find((tool) => tool.eventId === eventId);
      return {
        ...next,
        phase: "streaming",
        tools: known
          ? next.tools.map((tool) =>
              tool.eventId === eventId ? { ...tool, status, name: name ?? tool.name } : tool
            )
          : [...next.tools, { eventId, name, status }],
      };
    }
    case "error":
      return { ...next, notice: event.data.code };
    default:
      return next;
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends a message and follows its answer: creates the chat on the first
 * message, reads the stream, and when the stream is cut before `done`
 * shows "Still writing" and reconnects from the last event it saw. A chat
 * opened with an answer running reconnects the same way.
 */
export function useAssistantTurn(args: {
  chatId: string | null;
  turnRunning: boolean;
  onChatCreated: (chatId: string) => void;
}) {
  const qc = useQueryClient();
  const [live, setLive] = useState<LiveTurn | null>(null);
  const [failed, setFailed] = useState<FailedSend | null>(null);
  const turnRef = useRef<LiveTurn | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  /** The chat the current turn belongs to, so creating it on the first message doesn't stop the turn. */
  const turnChatRef = useRef<string | null>(args.chatId);

  const update = useCallback((next: LiveTurn | null) => {
    turnRef.current = next;
    setLive(next);
  }, []);

  const onEvent = useCallback(
    (event: ChatStreamEvent) => {
      if (turnRef.current) update(applyStreamEvent(turnRef.current, event));
    },
    [update]
  );

  const finish = useCallback(
    async (chatId: string) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: assistantKeys.chat(chatId) }),
        qc.invalidateQueries({ queryKey: assistantKeys.chats() }),
      ]);
      update(null);
    },
    [qc, update]
  );

  const follow = useCallback(
    async (chatId: string, controller: AbortController) => {
      for (let attempt = 0; attempt < RECONNECT_ATTEMPTS; attempt++) {
        if (controller.signal.aborted) return false;
        update({ ...turnRef.current!, phase: "reconnecting", partial: "" });
        try {
          const done = await reconnectAssistantStream(
            chatId,
            turnRef.current?.lastEventId ?? null,
            onEvent,
            controller.signal
          );
          if (done) return true;
        } catch {
          // A failed reconnect is retried like a cut one.
        }
        await wait(RECONNECT_DELAY_MS);
      }
      return false;
    },
    [onEvent, update]
  );

  const send = useCallback(
    async (text: string, organizationId: string) => {
      if (turnRef.current) return;
      setFailed(null);
      const controller = new AbortController();
      abortRef.current = controller;
      update(startTurn(text, "streaming"));
      let chatId = args.chatId;
      try {
        if (!chatId) {
          chatId = (await createAssistantChat(organizationId)).id;
          turnChatRef.current = chatId;
          args.onChatCreated(chatId);
        }
        let done = await sendAssistantMessage(chatId, text, onEvent, controller.signal);
        if (!done) done = await follow(chatId, controller);
        if (controller.signal.aborted) return;
        await finish(chatId);
      } catch (error) {
        if (controller.signal.aborted) return;
        update(null);
        setFailed({ text, code: errorCode(error) ?? null });
        if (chatId) void qc.invalidateQueries({ queryKey: assistantKeys.chat(chatId) });
      }
    },
    [args, finish, follow, onEvent, qc, update]
  );

  const { chatId, turnRunning } = args;

  // Switching chats stops reading; the answer goes on on the server.
  useEffect(() => {
    if (turnChatRef.current === chatId) return;
    turnChatRef.current = chatId;
    abortRef.current?.abort();
    update(null);
    setFailed(null);
  }, [chatId, update]);

  // Opening a chat whose answer is still being written follows it.
  useEffect(() => {
    if (!chatId || !turnRunning || turnRef.current) return;
    const controller = new AbortController();
    abortRef.current = controller;
    update(startTurn(null, "reconnecting"));
    void follow(chatId, controller).then(() => {
      if (!controller.signal.aborted) void finish(chatId);
    });
  }, [chatId, turnRunning, finish, follow, update]);

  // Closing the panel stops reading too.
  useEffect(() => () => abortRef.current?.abort(), []);

  return { live, failed, busy: live !== null || turnRunning, send };
}
