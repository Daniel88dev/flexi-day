import type { Attachment, AttachmentStatus } from "@/lib/api/types";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_REQUEST = 5;
/** An `UPLOADING` row this old never got its bytes checked; the UI shows it as failed. */
export const STALE_UPLOAD_MS = 10 * 60 * 1000;
/** While a fresh upload is still being checked, the detail refetches this often. */
export const PROCESSING_POLL_MS = 3000;

export const ACCEPTED_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "application/pdf",
] as const;

export type AcceptedContentType = (typeof ACCEPTED_CONTENT_TYPES)[number];

/** What the file picker accepts; HEIC by extension too, since browsers often leave its type blank. */
export const PICKER_ACCEPT = [...ACCEPTED_CONTENT_TYPES, ".heic", ".heif"].join(",");

const EXTENSION_TYPES: Record<string, AcceptedContentType> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heic",
  pdf: "application/pdf",
};

/**
 * The type to declare for a picked file. Browsers report HEIC as an empty
 * string on some platforms, so the extension is the fallback; anything else
 * unknown stays unsupported and the backend's 422 wording applies.
 */
export function declaredContentType(file: Pick<File, "name" | "type">): string {
  if (isAcceptedContentType(file.type)) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[extension] ?? file.type;
}

export function isAcceptedContentType(contentType: string): contentType is AcceptedContentType {
  return (ACCEPTED_CONTENT_TYPES as readonly string[]).includes(contentType);
}

export function isImage(contentType: string): boolean {
  return contentType.startsWith("image/");
}

/** Uploading and ready rows both hold one of the five slots; rejected and deleted ones do not. */
export function attachmentSlotsUsed(attachments: readonly Attachment[]): number {
  return attachments.filter(
    (a) => a.deletedAt === null && (a.status === "UPLOADING" || a.status === "READY")
  ).length;
}

// Rows this session registered whose bytes never arrived. The server keeps
// them UPLOADING until its sweep, so the detail must not keep polling for
// them, and a reopened dialog must still show them as failed.
const failedUploads = new Set<string>();

export function rememberFailedUpload(attachmentId: string): void {
  failedUploads.add(attachmentId);
}

/**
 * Whether this session saw the row's bytes fail to arrive. Only a row still
 * `UPLOADING` can be read that way: a transfer the browser reported lost may
 * still have reached the store, and the server's verdict then wins.
 */
export function isFailedUpload(
  attachment: Pick<Attachment, "id" | "status">,
  failedIds: readonly string[] = []
): boolean {
  return (
    attachment.status === "UPLOADING" &&
    (failedIds.includes(attachment.id) || failedUploads.has(attachment.id))
  );
}

export type AttachmentDisplayStatus = "processing" | "ready" | "rejected" | "failed";

/** The state to show: an `UPLOADING` row older than ten minutes is a failure, not a wait. */
export function attachmentDisplayStatus(
  attachment: Pick<Attachment, "status" | "createdAt">,
  now: number = Date.now()
): AttachmentDisplayStatus {
  const status: AttachmentStatus = attachment.status;
  if (status === "READY") return "ready";
  if (status === "REJECTED") return "rejected";
  return now - new Date(attachment.createdAt).getTime() > STALE_UPLOAD_MS ? "failed" : "processing";
}

/** True while some row is still being checked, so the detail knows to keep polling. */
export function hasProcessingAttachment(
  attachments: readonly Attachment[] | undefined,
  now: number = Date.now()
): boolean {
  return (attachments ?? []).some(
    (a) =>
      a.deletedAt === null && !isFailedUpload(a) && attachmentDisplayStatus(a, now) === "processing"
  );
}

export function formatFileSize(bytes: number, locale: string): string {
  const format = (value: number, unit: string, digits: number) =>
    `${value.toLocaleString(locale, { maximumFractionDigits: digits })} ${unit}`;
  if (bytes < 1024) return format(bytes, "B", 0);
  if (bytes < 1024 * 1024) return format(bytes / 1024, "kB", 0);
  return format(bytes / (1024 * 1024), "MB", 1);
}
