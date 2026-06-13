import { cn } from "@/lib/utils";

interface AvatarBubbleProps {
  initials: string;
  background: string;
  name?: string;
  size?: number;
  className?: string;
}

export function AvatarBubble({
  initials,
  background,
  name,
  size = 34,
  className,
}: AvatarBubbleProps) {
  return (
    <span
      title={name}
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold text-white",
        className
      )}
      style={{
        width: size,
        height: size,
        background,
        fontSize: size * 0.4,
        letterSpacing: ".01em",
        boxShadow: "inset 0 0 0 1px oklch(1 0 0 / .14), 0 1px 2px oklch(0 0 0 / .15)",
      }}
    >
      {initials}
    </span>
  );
}

interface AvatarStackProps {
  people: Array<{ id: string; name: string; initials: string; av: string }>;
  size?: number;
  max?: number;
}

export function AvatarStack({ people, size = 30, max = 5 }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  const overlap = size * 0.32;
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <div
          key={p.id}
          className="relative rounded-full"
          style={{
            marginLeft: i ? -overlap : 0,
            zIndex: shown.length - i,
            boxShadow: "0 0 0 2.5px var(--surface)",
          }}
        >
          <AvatarBubble initials={p.initials} background={p.av} name={p.name} size={size} />
        </div>
      ))}
      {extra > 0 ? (
        <div
          className="grid place-items-center rounded-full font-bold"
          style={{
            marginLeft: -overlap,
            width: size,
            height: size,
            fontSize: size * 0.36,
            background: "var(--surface-2)",
            color: "var(--text-muted)",
            boxShadow: "0 0 0 2.5px var(--surface), inset 0 0 0 1px var(--border)",
          }}
        >
          +{extra}
        </div>
      ) : null}
    </div>
  );
}
