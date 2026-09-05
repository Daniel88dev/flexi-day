import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const createAttachmentMock = vi.fn();
const uploadToTargetMock = vi.fn();
vi.mock("../attachments", () => ({
  createAttachment: (...args: unknown[]) => createAttachmentMock(...args),
}));
vi.mock("../attachment-upload", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../attachment-upload")>()),
  uploadToTarget: (...args: unknown[]) => uploadToTargetMock(...args),
}));
const getVacationMock = vi.fn();
vi.mock("../vacations", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../vacations")>()),
  getVacation: (...args: unknown[]) => getVacationMock(...args),
}));
// Shortened so a test sees a second fetch without waiting three seconds.
vi.mock("@/lib/attachments/rules", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/attachments/rules")>()),
  PROCESSING_POLL_MS: 20,
}));

import { useUploadAttachment, useVacation } from "../queries";
import { ApiError } from "../client";
import { UploadError } from "../attachment-upload";

const target = { url: "u", method: "PUT" as const, headers: {}, expiresAt: "x" };
const attachment = { id: "a-1", status: "UPLOADING" };

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useUploadAttachment(), { wrapper });
  return { invalidate, result };
}

describe("useUploadAttachment", () => {
  beforeEach(() => {
    createAttachmentMock.mockReset();
    uploadToTargetMock.mockReset();
  });

  it("registers the file with its declared type, then sends the bytes to the target", async () => {
    createAttachmentMock.mockResolvedValue({ attachment, upload: target });
    uploadToTargetMock.mockResolvedValue(undefined);
    const file = new File(["x"], "IMG_1.HEIC", { type: "" });
    const onProgress = vi.fn();
    const { invalidate, result } = setup();

    result.current.mutate({ requestId: "r-1", file, onProgress });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createAttachmentMock).toHaveBeenCalledWith({
      requestId: "r-1",
      fileName: "IMG_1.HEIC",
      contentType: "image/heic",
      size: 1,
    });
    expect(uploadToTargetMock).toHaveBeenCalledWith(target, file, onProgress);
    expect(result.current.data).toEqual(attachment);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["vacation"] });
  });

  it("names the registered row when the bytes fail to arrive", async () => {
    createAttachmentMock.mockResolvedValue({ attachment, upload: target });
    uploadToTargetMock.mockRejectedValue(new UploadError(0, "Upload failed"));
    const { result } = setup();

    result.current.mutate({
      requestId: "r-1",
      file: new File(["x"], "a.png", { type: "image/png" }),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(UploadError);
    expect((result.current.error as UploadError).attachmentId).toBe("a-1");
  });

  it("does not upload when the backend refuses the registration, but still refetches", async () => {
    createAttachmentMock.mockRejectedValue(new ApiError(402, "Attachments require a paid plan"));
    const { invalidate, result } = setup();

    result.current.mutate({
      requestId: "r-1",
      file: new File(["x"], "a.png", { type: "image/png" }),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(uploadToTargetMock).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["vacation"] });
  });
});

describe("useVacation", () => {
  const row = (status: "UPLOADING" | "READY") => ({
    id: "v-1",
    attachments: [{ id: "a-1", status, createdAt: new Date().toISOString(), deletedAt: null }],
  });

  function setupDetail() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return renderHook(() => useVacation("v-1"), { wrapper });
  }

  beforeEach(() => {
    getVacationMock.mockReset();
  });

  it("keeps refetching while an attachment is still being checked", async () => {
    getVacationMock.mockImplementation(() => Promise.resolve(row("UPLOADING")));
    setupDetail();

    await waitFor(() => expect(getVacationMock.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it("stops once every attachment has settled", async () => {
    getVacationMock.mockImplementation(() => Promise.resolve(row("READY")));
    const { result } = setupDetail();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await new Promise((r) => setTimeout(r, 80));
    expect(getVacationMock).toHaveBeenCalledTimes(1);
  });
});
