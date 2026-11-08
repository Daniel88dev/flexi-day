"use client";

import { useSyncExternalStore } from "react";

// A module store, like the group event sheet's: the top bar's button and the panel the shell
// mounts share it without a provider.
let open = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setAssistantOpen(next: boolean) {
  open = next;
  listeners.forEach((fn) => fn());
}

export function useAssistantOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false
  );
}
