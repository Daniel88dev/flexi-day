"use client";

import { useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";

export function Composer({ busy, onSend }: { busy: boolean; onSend: (text: string) => void }) {
  const { t } = useTranslation();
  const copy = t.assistant;
  const [text, setText] = useState("");

  function submit() {
    const value = text.trim();
    if (!value || busy) return;
    onSend(value);
    setText("");
  }

  return (
    <div className="space-y-2">
      <div
        className="flex items-end gap-2 rounded-[22px] border px-2 py-2 transition-colors focus-within:border-[color:var(--primary)]"
        style={{ borderColor: "var(--border-strong)", background: "var(--surface)" }}
      >
        <textarea
          aria-label={copy.composer.label}
          rows={1}
          value={text}
          disabled={busy}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={copy.composer.label}
          maxLength={4000}
          className="[field-sizing:content] max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] leading-[1.5] outline-none placeholder:text-[color:var(--text-faint)] disabled:opacity-60"
        />
        <button
          type="button"
          aria-label={copy.composer.send}
          onClick={submit}
          disabled={!text.trim() || busy}
          className="grid size-9 shrink-0 place-items-center rounded-full transition-opacity disabled:opacity-35"
          style={{ background: "var(--primary)", color: "var(--primary-fg)" }}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ArrowUp className="size-4" aria-hidden />
          )}
        </button>
      </div>
      <p className="px-2 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
        {copy.aiLine}
      </p>
    </div>
  );
}
