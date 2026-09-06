import type { UploadTarget } from "./types";

/**
 * The bytes go straight to the store, not through the JSON client: no session
 * cookie, no JSON encoding, and progress events, which `fetch` cannot report.
 */

export class UploadError extends Error {
  status: number;
  /** The row that was registered for these bytes, when the caller knows it. */
  attachmentId?: string;

  constructor(status: number, message: string, attachmentId?: string) {
    super(message);
    this.name = "UploadError";
    this.status = status;
    this.attachmentId = attachmentId;
  }
}

/**
 * Sends one file to its upload target. A presigned S3 POST wants a multipart
 * form with every signed field ahead of the file, which must be last and
 * named `file`; the local route wants the raw bytes. Resolves when the store
 * has accepted the bytes; the row's status settles server-side afterwards.
 */
export function uploadToTarget(
  target: UploadTarget,
  file: File,
  onProgress?: (fraction: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(target.method, target.url);

    let body: XMLHttpRequestBodyInit;
    if (target.method === "POST") {
      const form = new FormData();
      for (const [name, value] of Object.entries(target.fields)) form.append(name, value);
      form.append("file", file);
      body = form;
    } else {
      for (const [name, value] of Object.entries(target.headers)) xhr.setRequestHeader(name, value);
      body = file;
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
      } else {
        reject(new UploadError(xhr.status, `Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new UploadError(0, "Upload failed"));
    xhr.onabort = () => reject(new UploadError(0, "Upload cancelled"));

    xhr.send(body);
  });
}
