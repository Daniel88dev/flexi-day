import type { ReactNode } from "react";
import { FileText, Image as ImageIcon } from "lucide-react";
import { isImage } from "@/lib/attachments/rules";
import { cn } from "@/lib/utils";

/**
 * One file, whether it is still being picked, sent, checked or already
 * stored. Both lists draw with it so a Request's files read as one list even
 * when two components render them.
 */
export function AttachmentRow({
  contentType,
  name,
  meta,
  note,
  noteTone = "muted",
  progress,
  progressLabel,
  actions,
}: {
  contentType: string;
  name: ReactNode;
  meta: ReactNode;
  note?: ReactNode;
  noteTone?: "muted" | "destructive";
  /** Fraction sent; rendered as a bar when given. */
  progress?: number;
  progressLabel?: string;
  actions?: ReactNode;
}) {
  const Icon = isImage(contentType) ? ImageIcon : FileText;
  const percent = progress === undefined ? null : Math.round(progress * 100);
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className="bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-xl">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="truncate font-medium">{name}</div>
        <div className="text-muted-foreground truncate text-xs">{meta}</div>
        {note ? (
          <div
            className={cn(
              "mt-0.5 text-xs",
              noteTone === "destructive" ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {note}
          </div>
        ) : null}
        {percent !== null ? (
          <div
            role="progressbar"
            aria-label={progressLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="bg-muted mt-1.5 h-1 w-full overflow-hidden rounded-full"
          >
            <div
              className="bg-primary h-full transition-[width]"
              style={{ width: `${percent}%` }}
            />
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-0.5">{actions}</div> : null}
    </li>
  );
}
