import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UploadError, uploadToTarget } from "../attachment-upload";

type Listener = ((event: ProgressEvent) => void) | null;

class FakeXhr {
  static instances: FakeXhr[] = [];
  method = "";
  url = "";
  headers: Record<string, string> = {};
  body: unknown;
  status = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  upload: { onprogress: Listener } = { onprogress: null };

  constructor() {
    FakeXhr.instances.push(this);
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: unknown) {
    this.body = body;
  }
  finish(status: number) {
    this.status = status;
    this.onload?.();
  }
}

const file = new File(["png-bytes"], "note.png", { type: "image/png" });

describe("uploadToTarget", () => {
  beforeEach(() => {
    FakeXhr.instances = [];
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts a multipart form with the signed fields before the file for a presigned POST", async () => {
    const pending = uploadToTarget(
      {
        url: "https://bucket.s3.test/",
        method: "POST",
        fields: { key: "incoming/a-1", policy: "p", "Content-Type": "image/png" },
        expiresAt: "2026-09-05T10:05:00.000Z",
      },
      file
    );
    const xhr = FakeXhr.instances[0]!;
    expect(xhr.method).toBe("POST");
    expect(xhr.url).toBe("https://bucket.s3.test/");
    const form = xhr.body as FormData;
    expect([...form.keys()]).toEqual(["key", "policy", "Content-Type", "file"]);
    expect(form.get("file")).toBe(file);

    xhr.finish(204);
    await expect(pending).resolves.toBeUndefined();
  });

  it("PUTs the raw bytes with the given headers for the local route", async () => {
    const pending = uploadToTarget(
      {
        url: "http://localhost:8080/api/attachments/local/upload/a-1?expires=1&signature=s",
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        expiresAt: "2026-09-05T10:05:00.000Z",
      },
      file
    );
    const xhr = FakeXhr.instances[0]!;
    expect(xhr.method).toBe("PUT");
    expect(xhr.headers).toEqual({ "Content-Type": "image/png" });
    expect(xhr.body).toBe(file);

    xhr.finish(200);
    await expect(pending).resolves.toBeUndefined();
  });

  it("reports progress as a fraction and ends at 1", async () => {
    const onProgress = vi.fn();
    const pending = uploadToTarget(
      { url: "u", method: "PUT", headers: {}, expiresAt: "x" },
      file,
      onProgress
    );
    const xhr = FakeXhr.instances[0]!;
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 25, total: 100 } as ProgressEvent);
    expect(onProgress).toHaveBeenLastCalledWith(0.25);

    xhr.finish(200);
    await pending;
    expect(onProgress).toHaveBeenLastCalledWith(1);
  });

  it("rejects with the status when the store refuses the bytes", async () => {
    const pending = uploadToTarget({ url: "u", method: "PUT", headers: {}, expiresAt: "x" }, file);
    FakeXhr.instances[0]!.finish(413);
    await expect(pending).rejects.toBeInstanceOf(UploadError);
    await expect(pending).rejects.toMatchObject({ status: 413 });
  });

  it("rejects on a network error", async () => {
    const pending = uploadToTarget({ url: "u", method: "PUT", headers: {}, expiresAt: "x" }, file);
    FakeXhr.instances[0]!.onerror?.();
    await expect(pending).rejects.toMatchObject({ status: 0 });
  });
});
