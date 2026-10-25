import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import type { PersonExport } from "@/lib/api/person-export";
import { OrganizationExportCard } from "../organization-export-card";

let latest: PersonExport | null | undefined;
const requestExport = vi.fn();
const signDownload = vi.fn();
const followLink = vi.fn();
const enabledFor = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  useOrganizationExport: (organizationId: string | null, enabled: boolean) => {
    enabledFor(organizationId, enabled);
    return { data: latest };
  },
  useRequestOrganizationExport: () => ({ mutateAsync: requestExport, isPending: false }),
}));

vi.mock("@/lib/api/person-export", () => ({
  signPersonExportDownload: (...args: unknown[]) => signDownload(...args),
  followDownloadLink: (...args: unknown[]) => followLink(...args),
}));

const exported = (overrides: Partial<PersonExport> = {}): PersonExport => ({
  id: "exp-1",
  organizationId: "org-1",
  scope: "ORGANIZATION",
  subjectUserId: null,
  status: "PENDING",
  createdAt: "2026-10-25T10:00:00Z",
  readyAt: null,
  expiresAt: null,
  ...overrides,
});

describe("OrganizationExportCard", () => {
  beforeEach(() => {
    latest = null;
    requestExport.mockReset();
    requestExport.mockResolvedValue({});
    signDownload.mockReset();
    followLink.mockReset();
    enabledFor.mockReset();
  });

  it("lets the owner request the export, then shows Preparing and Download", async () => {
    const { rerender } = renderWithClient(
      <OrganizationExportCard organizationId="org-1" isOwner />
    );
    expect(screen.getByRole("region", { name: "Organization export" })).toHaveAttribute(
      "id",
      "organization-export"
    );

    await userEvent.click(screen.getByRole("button", { name: "Export the organization's data" }));
    expect(requestExport).toHaveBeenCalled();

    latest = exported();
    rerender(<OrganizationExportCard organizationId="org-1" isOwner />);
    expect(screen.getByRole("button", { name: "Export the organization's data" })).toBeDisabled();

    latest = exported({
      status: "READY",
      readyAt: "2026-10-25T10:01:00Z",
      expiresAt: "2026-11-01T10:01:00Z",
    });
    rerender(<OrganizationExportCard organizationId="org-1" isOwner />);
    signDownload.mockResolvedValue({ url: "https://bucket/org.zip", expiresAt: "x" });
    await userEvent.click(screen.getByRole("button", { name: "Download the organization export" }));
    expect(signDownload).toHaveBeenCalledWith("exp-1");
    expect(followLink).toHaveBeenCalledWith("https://bucket/org.zip");
  });

  it("renders nothing for a delegated admin, and asks nothing", () => {
    const { container } = renderWithClient(
      <OrganizationExportCard organizationId="org-1" isOwner={false} />
    );
    expect(container).toBeEmptyDOMElement();
    expect(enabledFor).toHaveBeenCalledWith("org-1", false);
  });
});
