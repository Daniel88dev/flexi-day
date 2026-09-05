import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
vi.mock("../client", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

import { createAttachment, getAttachmentDownloadUrl } from "../attachments";

describe("attachments api", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({});
  });

  it("createAttachment posts the file facts as JSON", async () => {
    const input = {
      requestId: "r-1",
      fileName: "note.png",
      contentType: "image/png",
      size: 1234,
    };
    await createAttachment(input);
    expect(apiMock).toHaveBeenCalledWith("/api/attachments", { method: "POST", body: input });
  });

  it("getAttachmentDownloadUrl asks for the disposition the caller wants", async () => {
    await getAttachmentDownloadUrl("a-1", "attachment");
    expect(apiMock).toHaveBeenCalledWith(
      "/api/attachments/a-1/download-url?disposition=attachment"
    );
  });
});
