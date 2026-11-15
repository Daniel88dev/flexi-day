import type { Translations } from "./assistant-copy";

/** The fixed words of a notice the backend records or streams by code; never model output. */
export function noticeText(t: Translations, code: string | null, organizationName: string): string {
  if (code === "ASSISTANT_WEEKLY_LIMIT_REACHED") return t.assistant.limit.stopped(organizationName);
  const fixed: Record<string, string> = { ...t.assistant.notices, ...t.assistantBoundary.notices };
  return (code ? fixed[code] : undefined) ?? t.assistant.notices.ASSISTANT_ERROR;
}

export function Notice({ text }: { text: string }) {
  return (
    <div className="text-[15px] leading-[1.6]" style={{ color: "var(--text-muted)" }}>
      {text}
    </div>
  );
}
