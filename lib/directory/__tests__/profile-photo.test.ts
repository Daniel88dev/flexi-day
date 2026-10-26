import { describe, expect, it, vi } from "vitest";
import type { ProfilePhotoUpload } from "@/lib/api/directory";
import { PHOTO_PICKER_ACCEPT, photoFileProblem, waitForPhotoUpload } from "../profile-photo";

const status = (value: ProfilePhotoUpload["status"]): ProfilePhotoUpload => ({
  id: "photo-1",
  status: value,
  rejectionReason: value === "REJECTED" ? "IMAGE_UNREADABLE" : null,
});

describe("waitForPhotoUpload", () => {
  it("asks until the upload settles, then returns how it settled", async () => {
    const read = vi
      .fn<() => Promise<ProfilePhotoUpload>>()
      .mockResolvedValueOnce(status("UPLOADING"))
      .mockResolvedValueOnce(status("UPLOADING"))
      .mockResolvedValueOnce(status("READY"));
    const sleep = vi.fn(() => Promise.resolve());

    await expect(waitForPhotoUpload(read, { sleep })).resolves.toEqual(status("READY"));
    expect(read).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("returns undefined when it never settles in time", async () => {
    const read = vi.fn(() => Promise.resolve(status("UPLOADING")));

    await expect(
      waitForPhotoUpload(read, { sleep: () => Promise.resolve(), attempts: 4 })
    ).resolves.toBeUndefined();
    expect(read).toHaveBeenCalledTimes(4);
  });
});

describe("photoFileProblem", () => {
  const file = (name: string, type: string, size = 1000) => ({ name, type, size });

  it("accepts PNG, JPEG, WebP and HEIC, HEIC by extension too", () => {
    expect(photoFileProblem(file("a.png", "image/png"))).toBeNull();
    expect(photoFileProblem(file("a.jpg", "image/jpeg"))).toBeNull();
    expect(photoFileProblem(file("a.webp", "image/webp"))).toBeNull();
    expect(photoFileProblem(file("IMG_1.HEIC", ""))).toBeNull();
    expect(PHOTO_PICKER_ACCEPT).toContain(".heic");
  });

  it("refuses a PDF and a file over 10 MB", () => {
    expect(photoFileProblem(file("a.pdf", "application/pdf"))).toBe("UNSUPPORTED_TYPE");
    expect(photoFileProblem(file("a.png", "image/png", 10 * 1024 * 1024 + 1))).toBe(
      "FILE_TOO_LARGE"
    );
  });
});
