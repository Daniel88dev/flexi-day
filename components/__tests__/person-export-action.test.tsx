import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api/client";

const toast = vi.fn();
vi.mock("@/components/toast", () => ({
  pushToast: (...args: unknown[]) => toast(...args),
}));

const sign = vi.fn();
vi.mock("@/lib/api/person-export", () => ({
  signPersonExportDownload: (...args: unknown[]) => sign(...args),
  followDownloadLink: vi.fn(),
}));

import { PersonExportAction } from "../person-export-action";

const labels = { export: "Export Milo's data", download: "Download Milo's export" };

describe("PersonExportAction", () => {
  it("requests an export when none exists yet", async () => {
    const onRequest = vi.fn().mockResolvedValue({});
    render(
      <PersonExportAction entry={null} labels={labels} requesting={false} onRequest={onRequest} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Export Milo's data" }));
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it("shows Preparing while the request is in flight", () => {
    render(<PersonExportAction entry={null} labels={labels} requesting onRequest={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Export Milo's data" })).toHaveTextContent(
      "Preparing…"
    );
  });

  it("says why a download is refused once the admin lost access", async () => {
    sign.mockRejectedValue(
      new ApiError(403, "You no longer administer the export's organization", undefined, [
        { message: "Forbidden", context: { code: "FORBIDDEN" } },
      ])
    );
    render(
      <PersonExportAction
        entry={{
          id: "exp-1",
          organizationId: "org-1",
          scope: "PERSON",
          subjectUserId: "u-1",
          status: "READY",
          createdAt: "2026-10-25T10:00:00Z",
          readyAt: "2026-10-25T10:01:00Z",
          expiresAt: "2026-11-01T10:01:00Z",
        }}
        labels={labels}
        requesting={false}
        onRequest={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Download Milo's export" }));
    expect(toast).toHaveBeenCalledWith("You no longer have access to this export.", "danger");
  });

  it("shows its own copy when a request fails for an unknown reason", async () => {
    const onRequest = vi.fn().mockRejectedValue(new Error("Internal detail"));
    render(
      <PersonExportAction entry={null} labels={labels} requesting={false} onRequest={onRequest} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Export Milo's data" }));
    expect(toast).toHaveBeenCalledWith("Could not start the export.", "danger");
  });
});
