import type { ProfilePhotoUpload } from "@/lib/api/directory";
import { declaredContentType } from "@/lib/attachments/rules";

export const MAX_PROFILE_PHOTO_BYTES = 10 * 1024 * 1024;

const PHOTO_CONTENT_TYPES = ["image/png", "image/jpeg", "image/webp", "image/heic"];

/** What the picker offers; HEIC by extension too, since browsers often leave its type blank. */
export const PHOTO_PICKER_ACCEPT = [...PHOTO_CONTENT_TYPES, ".heic", ".heif"].join(",");

/** The reason a picked file can't be a Profile photo, as the backend names it; null when it can. */
export function photoFileProblem(
  file: Pick<File, "name" | "type" | "size">
): "UNSUPPORTED_TYPE" | "FILE_TOO_LARGE" | null {
  if (!PHOTO_CONTENT_TYPES.includes(declaredContentType(file))) return "UNSUPPORTED_TYPE";
  if (file.size > MAX_PROFILE_PHOTO_BYTES) return "FILE_TOO_LARGE";
  return null;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Asks how an upload stands until it leaves `UPLOADING`. Against S3 the
 * Lambda takes a few seconds; the disk store has settled it already.
 * Undefined when it is still processing after the last attempt.
 */
export async function waitForPhotoUpload(
  read: () => Promise<ProfilePhotoUpload>,
  {
    attempts = 30,
    intervalMs = 2000,
    sleep = wait,
  }: { attempts?: number; intervalMs?: number; sleep?: (ms: number) => Promise<void> } = {}
): Promise<ProfilePhotoUpload | undefined> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const current = await read();
    if (current.status !== "UPLOADING") return current;
    if (attempt < attempts) await sleep(intervalMs);
  }
  return undefined;
}
