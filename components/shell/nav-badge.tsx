import { cn } from "@/lib/utils";

/** The chip beside a navigation label, such as the plan a link needs. */
export function NavBadge({ children, className }: { children: string; className?: string }) {
  return (
    <span
      className={cn(
        "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold",
        "bg-[var(--warm-soft)] text-[color:var(--warm)]",
        className
      )}
    >
      {children}
    </span>
  );
}
