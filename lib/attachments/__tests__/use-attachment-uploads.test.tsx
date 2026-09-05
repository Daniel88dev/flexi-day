import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ApiError } from "@/lib/api/client";
import { UploadError } from "@/lib/api/attachment-upload";
import type { Attachment } from "@/lib/api/types";
import { useAttachmentUploads } from "../use-attachment-uploads";

const uploadMutate = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  useUploadAttachment: () => ({ mutateAsync: uploadMutate, isPending: false }),
}));

const ready: Attachment = {
  id: "a-1",
  requestId: "r-1",
  fileName: "note.png",
  contentType: "image/png",
  size: 4,
  status: "READY",
  rejectionReason: null,
  uploadedByUserId: "u-1",
  createdAt: "2026-09-05T09:00:00.000Z",
  deletedAt: null,
  deletedByUserId: null,
};

const png = (name = "note.png", bytes = 4) =>
  new File(["x".repeat(bytes)], name, { type: "image/png" });

function setup(requestId: string | null, attachments: Attachment[] = []) {
  return renderHook(
    (props: { requestId: string | null; attachments: Attachment[] }) => useAttachmentUploads(props),
    { initialProps: { requestId, attachments } }
  );
}

describe("useAttachmentUploads", () => {
  beforeEach(() => {
    uploadMutate.mockReset();
    uploadMutate.mockResolvedValue({ ...ready, id: "a-new" });
  });

  it("uploads a pick at once when the Request already exists", async () => {
    const { result } = setup("r-1");

    act(() => result.current.pick([png()]));

    expect(uploadMutate).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: "r-1", file: expect.any(File) })
    );
    expect(result.current.inFlight).toBe(1);
    expect(result.current.queued).toBe(0);
    await waitFor(() => expect(result.current.jobs[0].attachmentId).toBe("a-new"));
  });

  it("holds picks until start names the Request, then sends them all", async () => {
    const { result } = setup(null);

    act(() => result.current.pick([png("a.png"), png("b.png")]));

    expect(uploadMutate).not.toHaveBeenCalled();
    expect(result.current.queued).toBe(2);
    expect(result.current.inFlight).toBe(0);
    expect(result.current.jobs.map((job) => job.queued)).toEqual([true, true]);

    let sent = 0;
    act(() => {
      sent = result.current.start("r-9");
    });

    expect(sent).toBe(2);
    expect(uploadMutate).toHaveBeenCalledTimes(2);
    expect(uploadMutate.mock.calls.map((call) => call[0].requestId)).toEqual(["r-9", "r-9"]);
    expect(result.current.queued).toBe(0);
    expect(result.current.inFlight).toBe(2);
  });

  it("sends nothing from start when no file waits", () => {
    const { result } = setup(null);

    let sent = -1;
    act(() => {
      sent = result.current.start("r-9");
    });

    expect(sent).toBe(0);
    expect(uploadMutate).not.toHaveBeenCalled();
  });

  it("drops a waiting file on remove so start never sends it", () => {
    const { result } = setup(null);

    act(() => result.current.pick([png("a.png"), png("b.png")]));
    act(() => result.current.remove(result.current.jobs[0].key));

    expect(result.current.jobs.map((job) => job.fileName)).toEqual(["b.png"]);
    act(() => {
      result.current.start("r-9");
    });
    expect(uploadMutate).toHaveBeenCalledTimes(1);
    expect(uploadMutate.mock.calls[0][0].file.name).toBe("b.png");
  });

  it("refuses a wrong type, an oversized file and anything past the cap locally", () => {
    const { result } = setup("r-1", [ready, { ...ready, id: "a-2" }, { ...ready, id: "a-3" }]);

    act(() =>
      result.current.pick([
        new File(["x"], "notes.txt", { type: "text/plain" }),
        new File([new ArrayBuffer(10 * 1024 * 1024 + 1)], "huge.png", { type: "image/png" }),
        png("ok-1.png"),
        png("ok-2.png"),
        png("one-too-many.png"),
      ])
    );

    expect(uploadMutate).toHaveBeenCalledTimes(2);
    expect(result.current.jobs.map((job) => job.error)).toEqual([
      "Only PNG, JPEG, WebP, HEIC and PDF files can be attached.",
      "This file is over 10 MB.",
      undefined,
      undefined,
      "This request has the maximum of five attachments.",
    ]);
    expect(result.current.failed).toBe(3);
    expect(result.current.full).toBe(true);
  });

  it("counts waiting files against the cap", () => {
    const { result } = setup(null);

    act(() => result.current.pick([png("1"), png("2"), png("3"), png("4"), png("5")]));

    expect(result.current.remaining).toBe(0);
    expect(result.current.full).toBe(true);
  });

  it("hides a job once its row is in the attachments", async () => {
    const { result, rerender } = setup("r-1");

    act(() => result.current.pick([png()]));
    await waitFor(() => expect(result.current.jobs[0].attachmentId).toBe("a-new"));

    rerender({ requestId: "r-1", attachments: [{ ...ready, id: "a-new" }] });

    expect(result.current.jobs).toHaveLength(0);
    expect(result.current.inFlight).toBe(0);
  });

  it("translates the backend's refusal into the job's error", async () => {
    uploadMutate.mockRejectedValue(
      new ApiError(422, "Unsupported type", undefined, [
        { message: "Unsupported type", context: { reason: "UNSUPPORTED_TYPE" } },
      ])
    );
    const { result } = setup("r-1");

    act(() => result.current.pick([png()]));

    await waitFor(() =>
      expect(result.current.jobs[0].error).toBe(
        "Only PNG, JPEG, WebP, HEIC and PDF files can be attached."
      )
    );
    expect(result.current.failed).toBe(1);
  });

  it("lists a registered row whose bytes never arrived as failed", async () => {
    uploadMutate.mockRejectedValue(new UploadError(0, "Upload failed", "a-lost"));
    const { result } = setup("r-1");

    act(() => result.current.pick([png()]));

    await waitFor(() => expect(result.current.failedIds).toEqual(["a-lost"]));
    expect(result.current.jobs[0].attachmentId).toBe("a-lost");
    expect(result.current.jobs[0].error).toBeUndefined();
  });

  it("forgets everything on reset", () => {
    const { result } = setup(null);

    act(() => result.current.pick([png()]));
    act(() => result.current.reset());

    expect(result.current.jobs).toHaveLength(0);
    act(() => {
      result.current.start("r-9");
    });
    expect(uploadMutate).not.toHaveBeenCalled();
  });
});
