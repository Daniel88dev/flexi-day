"use client";

// PROTOTYPE (T-445): throwaway variant switcher, never merged to main.

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useVariant<K extends string>(keys: readonly K[]): K {
  const params = useSearchParams();
  const raw = params.get("variant");
  return (keys.find((k) => k === raw) ?? keys[0]) as K;
}

export function PrototypeSwitcher<K extends string>({
  variants,
  names,
}: {
  variants: readonly K[];
  names: Record<K, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = useVariant(variants);

  const go = useCallback(
    (delta: number) => {
      const i = variants.indexOf(current);
      const next = variants[(i + delta + variants.length) % variants.length];
      const q = new URLSearchParams(params.toString());
      q.set("variant", next);
      router.replace(`${pathname}?${q.toString()}`, { scroll: false });
    },
    [variants, current, params, pathname, router]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable], [role=dialog]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-full bg-black px-2 py-1.5 text-sm text-white shadow-2xl ring-2 ring-fuchsia-500">
      <button
        type="button"
        className="rounded-full px-3 py-1 hover:bg-white/15"
        onClick={() => go(-1)}
      >
        ←
      </button>
      <span className="min-w-[230px] text-center font-mono">
        {current} · {names[current]}
      </span>
      <button
        type="button"
        className="rounded-full px-3 py-1 hover:bg-white/15"
        onClick={() => go(1)}
      >
        →
      </button>
    </div>
  );
}
