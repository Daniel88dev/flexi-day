"use client";

// PROTOTYPE (T-265): throwaway variant switcher. Lives on prototype/* branches only.

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function PrototypeSwitcher({
  variants,
  param = "variant",
  extra,
}: {
  variants: ReadonlyArray<{ key: string; name: string }>;
  param?: string;
  extra?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const currentKey = params.get(param) ?? variants[0].key;
  const index = Math.max(
    0,
    variants.findIndex((v) => v.key === currentKey)
  );
  const current = variants[index];

  const go = (delta: number) => {
    const next = variants[(index + delta + variants.length) % variants.length];
    const search = new URLSearchParams(params.toString());
    search.set(param, next.key);
    router.replace(`${pathname}?${search.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target;
      if (target instanceof Element && target.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-full bg-black px-2 py-1.5 text-[13px] font-semibold text-white shadow-2xl ring-2 ring-yellow-300">
      <button
        type="button"
        onClick={() => go(-1)}
        className="rounded-full px-2.5 py-1 hover:bg-white/15"
      >
        ←
      </button>
      <span className="min-w-[11rem] text-center">
        {current.key} — {current.name}
      </span>
      <button
        type="button"
        onClick={() => go(1)}
        className="rounded-full px-2.5 py-1 hover:bg-white/15"
      >
        →
      </button>
      {extra}
    </div>
  );
}
