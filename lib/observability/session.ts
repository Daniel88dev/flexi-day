// Per-tab session id, sessionStorage and not a cookie: it does not travel
// automatically. Nothing here outlives the tab. A persistent cross-visit
// identifier would need consent under ePrivacy Art. 5(3), which is why there
// is no device id.

const SESSION_KEY = "fd.sid";

const newId = (): string => {
  // randomUUID needs a secure context.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
};

// Guarded twice over: no `window` during the static export build, and Safari
// private mode throws on storage access.
const readOrCreate = (storage: () => Storage, key: string, cache: { value?: string }): string => {
  if (cache.value) return cache.value;
  if (typeof window === "undefined") return "";

  try {
    const store = storage();
    const existing = store.getItem(key);
    if (existing) {
      cache.value = existing;
      return existing;
    }
    const created = newId();
    store.setItem(key, created);
    cache.value = created;
    return created;
  } catch {
    cache.value = newId();
    return cache.value;
  }
};

const sessionCache: { value?: string } = {};

export const getSessionId = (): string =>
  readOrCreate(() => window.sessionStorage, SESSION_KEY, sessionCache);

export const correlationHeaders = (): Record<string, string> => {
  const sessionId = getSessionId();
  return {
    ...(sessionId ? { "x-client-session-id": sessionId } : {}),
  };
};

export const __resetIdCacheForTests = (): void => {
  delete sessionCache.value;
};
