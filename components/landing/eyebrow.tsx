import { cn } from "@/lib/utils";

export function Eyebrow({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.04em] uppercase",
        center && "justify-center"
      )}
      style={{ color: "var(--primary)" }}
    >
      <span
        aria-hidden
        className="h-[1.5px] w-[18px]"
        style={{ background: "var(--primary)", opacity: 0.5 }}
      />
      {children}
    </div>
  );
}
