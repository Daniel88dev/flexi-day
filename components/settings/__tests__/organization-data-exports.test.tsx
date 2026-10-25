import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import type { OwnExportOrganization } from "@/lib/api/person-export";
import { OrganizationDataExports } from "../organization-data-exports";

let organizations: OwnExportOrganization[] | undefined;
let pending: boolean;
let error: Error | null;
const requestOwn = vi.fn();
const signDownload = vi.fn();
const followLink = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  useOwnExportOrganizations: () => ({ data: organizations, isPending: pending, error }),
  useRequestOwnPersonExport: () => ({
    mutateAsync: requestOwn,
    isPending: false,
    variables: undefined,
  }),
}));

vi.mock("@/lib/api/person-export", () => ({
  signPersonExportDownload: (...args: unknown[]) => signDownload(...args),
  followDownloadLink: (...args: unknown[]) => followLink(...args),
}));

const organization = (overrides: Partial<OwnExportOrganization> = {}): OwnExportOrganization => ({
  organizationId: "org-1",
  organizationName: "Acme",
  employmentId: "emp-1",
  startedAt: "2026-01-05T08:00:00Z",
  endedAt: null,
  export: null,
  ...overrides,
});

describe("OrganizationDataExports", () => {
  beforeEach(() => {
    organizations = [organization()];
    pending = false;
    error = null;
    requestOwn.mockReset();
    requestOwn.mockResolvedValue({});
    signDownload.mockReset();
    followLink.mockReset();
  });

  it("lists each organization, ended ones included, and requests the person's own export", async () => {
    organizations = [
      organization(),
      organization({
        organizationId: "org-2",
        organizationName: "Old Co",
        endedAt: "2025-12-31T12:00:00Z",
      }),
    ];
    renderWithClient(<OrganizationDataExports />);

    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Ended 31/12/2025")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Export your data from Old Co" }));
    expect(requestOwn).toHaveBeenCalledWith("org-2");
  });

  it("shows Preparing, then Download behind a signed link", async () => {
    organizations = [
      organization({
        export: {
          id: "exp-1",
          organizationId: "org-1",
          scope: "PERSON",
          subjectUserId: "me",
          status: "PENDING",
          createdAt: "2026-10-25T10:00:00Z",
          readyAt: null,
          expiresAt: null,
        },
      }),
    ];
    const { rerender } = renderWithClient(<OrganizationDataExports />);
    expect(screen.getByRole("button", { name: "Export your data from Acme" })).toBeDisabled();

    organizations = [
      organization({
        export: {
          id: "exp-1",
          organizationId: "org-1",
          scope: "PERSON",
          subjectUserId: "me",
          status: "READY",
          createdAt: "2026-10-25T10:00:00Z",
          readyAt: "2026-10-25T10:01:00Z",
          expiresAt: "2026-11-01T10:01:00Z",
        },
      }),
    ];
    rerender(<OrganizationDataExports />);
    signDownload.mockResolvedValue({ url: "https://bucket/me.zip", expiresAt: "x" });
    await userEvent.click(screen.getByRole("button", { name: "Download your data from Acme" }));
    expect(followLink).toHaveBeenCalledWith("https://bucket/me.zip");
  });

  it("says when no organization holds data about the person", () => {
    organizations = [];
    renderWithClient(<OrganizationDataExports />);
    expect(screen.getByText("No organization holds data about you.")).toBeInTheDocument();
  });

  it("says when the list could not load", () => {
    organizations = undefined;
    error = new Error("boom");
    renderWithClient(<OrganizationDataExports />);
    expect(screen.getByText("Could not load your organizations.")).toBeInTheDocument();
  });
});
