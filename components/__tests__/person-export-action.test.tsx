import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api/person-export", () => ({
  signPersonExportDownload: vi.fn(),
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
});
