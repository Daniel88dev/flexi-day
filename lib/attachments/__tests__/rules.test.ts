import { describe, expect, it } from "vitest";
import type { Attachment } from "@/lib/api/types";
import {
  attachmentDisplayStatus,
  attachmentSlotsUsed,
  declaredContentType,
  formatFileSize,
  hasProcessingAttachment,
  isAcceptedContentType,
  isFailedUpload,
  isImage,
  rememberFailedUpload,
} from "../rules";

const base: Attachment = {
  id: "a-1",
  requestId: "r-1",
  fileName: "note.png",
  contentType: "image/jpeg",
  size: 1000,
  status: "READY",
  rejectionReason: null,
  uploadedByUserId: "u-1",
  createdAt: "2026-09-05T10:00:00.000Z",
  deletedAt: null,
  deletedByUserId: null,
};

const at = (iso: string) => new Date(iso).getTime();

describe("declaredContentType", () => {
  it("keeps a browser-reported type the backend accepts", () => {
    expect(declaredContentType({ name: "scan.pdf", type: "application/pdf" })).toBe(
      "application/pdf"
    );
  });

  it("falls back to the extension when the browser leaves HEIC untyped", () => {
    expect(declaredContentType({ name: "IMG_0001.HEIC", type: "" })).toBe("image/heic");
  });

  it("leaves an unsupported type alone so the backend's reason applies", () => {
    expect(declaredContentType({ name: "notes.txt", type: "text/plain" })).toBe("text/plain");
    expect(isAcceptedContentType("text/plain")).toBe(false);
  });
});

describe("isAcceptedContentType", () => {
  it("accepts exactly the five upload types", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp", "image/heic", "application/pdf"]) {
      expect(isAcceptedContentType(type)).toBe(true);
    }
    expect(isAcceptedContentType("image/gif")).toBe(false);
    expect(isAcceptedContentType("")).toBe(false);
  });
});

describe("isImage", () => {
  it("tells images from PDFs by the stored type", () => {
    expect(isImage("image/jpeg")).toBe(true);
    expect(isImage("application/pdf")).toBe(false);
  });
});

describe("attachmentSlotsUsed", () => {
  it("counts uploading and ready rows and ignores rejected or deleted ones", () => {
    expect(
      attachmentSlotsUsed([
        base,
        { ...base, id: "a-2", status: "UPLOADING" },
        { ...base, id: "a-3", status: "REJECTED", rejectionReason: "PDF_JAVASCRIPT" },
        { ...base, id: "a-4", deletedAt: "2026-09-05T11:00:00.000Z", deletedByUserId: "u-1" },
      ])
    ).toBe(2);
  });
});

describe("attachmentDisplayStatus", () => {
  it("shows a fresh upload as processing", () => {
    expect(
      attachmentDisplayStatus({ ...base, status: "UPLOADING" }, at("2026-09-05T10:05:00.000Z"))
    ).toBe("processing");
  });

  it("shows an upload stuck for more than ten minutes as failed", () => {
    expect(
      attachmentDisplayStatus({ ...base, status: "UPLOADING" }, at("2026-09-05T10:10:01.000Z"))
    ).toBe("failed");
  });

  it("maps ready and rejected straight through", () => {
    expect(attachmentDisplayStatus(base)).toBe("ready");
    expect(attachmentDisplayStatus({ ...base, status: "REJECTED" })).toBe("rejected");
  });
});

describe("hasProcessingAttachment", () => {
  it("is true only while a live upload is still within the ten-minute window", () => {
    const now = at("2026-09-05T10:05:00.000Z");
    expect(hasProcessingAttachment([base], now)).toBe(false);
    expect(hasProcessingAttachment([{ ...base, status: "UPLOADING" }], now)).toBe(true);
    expect(
      hasProcessingAttachment([{ ...base, status: "UPLOADING" }], at("2026-09-05T10:11:00.000Z"))
    ).toBe(false);
    expect(hasProcessingAttachment(undefined, now)).toBe(false);
  });

  it("ignores an upload this session already knows has failed", () => {
    const now = at("2026-09-05T10:05:00.000Z");
    const stuck = { ...base, id: "a-lost", status: "UPLOADING" as const };
    expect(hasProcessingAttachment([stuck], now)).toBe(true);

    rememberFailedUpload("a-lost");

    expect(hasProcessingAttachment([stuck], now)).toBe(false);
    expect(hasProcessingAttachment([{ ...stuck, id: "a-other" }], now)).toBe(true);
  });
});

describe("isFailedUpload", () => {
  it("reads the session's verdict only while the server still says UPLOADING", () => {
    expect(isFailedUpload({ id: "a-1", status: "UPLOADING" }, ["a-1"])).toBe(true);
    expect(isFailedUpload({ id: "a-1", status: "READY" }, ["a-1"])).toBe(false);
    expect(isFailedUpload({ id: "a-1", status: "UPLOADING" }, ["a-2"])).toBe(false);
  });

  it("remembers a failure across remounts, where the session's list starts empty", () => {
    rememberFailedUpload("a-remembered");
    expect(isFailedUpload({ id: "a-remembered", status: "UPLOADING" })).toBe(true);
    expect(isFailedUpload({ id: "a-remembered", status: "READY" })).toBe(false);
  });
});

describe("formatFileSize", () => {
  it("picks the unit by magnitude", () => {
    expect(formatFileSize(512, "en-GB")).toBe("512 B");
    expect(formatFileSize(2048, "en-GB")).toBe("2 kB");
    expect(formatFileSize(1.5 * 1024 * 1024, "en-GB")).toBe("1.5 MB");
  });

  it("formats the decimal for the locale", () => {
    expect(formatFileSize(1.5 * 1024 * 1024, "cs-CZ")).toBe("1,5 MB");
  });
});
