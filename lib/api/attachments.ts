import { api } from "./client";
import type {
  AttachmentDisposition,
  AttachmentDownload,
  CreateAttachmentInput,
  CreateAttachmentResult,
} from "./types";

export function createAttachment(input: CreateAttachmentInput): Promise<CreateAttachmentResult> {
  return api<CreateAttachmentResult>(`/api/attachments`, { method: "POST", body: input });
}

/**
 * A URL good for about a minute. Fetched on click and never at render, so a
 * link never sits in the page waiting to be copied.
 */
export function getAttachmentDownloadUrl(
  id: string,
  disposition: AttachmentDisposition
): Promise<AttachmentDownload> {
  return api<AttachmentDownload>(`/api/attachments/${id}/download-url?disposition=${disposition}`);
}
