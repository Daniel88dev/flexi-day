import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * The field's title with how many of the Request's slots are taken. The
 * count replaces a sentence about the limit: it says the same thing and
 * stays true as files come and go.
 */
export function AttachmentsHeading({
  id,
  used,
  max,
  as: Tag = "span",
}: {
  id?: string;
  used: number;
  max: number;
  as?: "h3" | "span";
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-baseline justify-between gap-3">
      <Tag id={id} className="text-sm font-medium">
        {t.attachments.title}
      </Tag>
      <span
        className="text-muted-foreground tnum text-xs"
        aria-label={t.attachments.slotsUsed(used, max)}
      >
        {used} / {max}
      </span>
    </div>
  );
}
