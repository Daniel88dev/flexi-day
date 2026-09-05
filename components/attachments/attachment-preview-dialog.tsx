"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * An image attachment at full size. The URL was fetched the moment the user
 * clicked and lives for about a minute, so the dialog is mounted only while
 * open and never keeps a stale link around.
 */
export function AttachmentPreviewDialog({
  fileName,
  url,
  open,
  onOpenChange,
}: {
  fileName: string;
  url: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate">{fileName}</DialogTitle>
          <DialogDescription>{t.attachments.title}</DialogDescription>
        </DialogHeader>
        {url ? (
          // Static export: there is no image optimiser, and the source is a
          // signed URL that must be used as issued.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={fileName} className="max-h-[75vh] w-full object-contain" />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
