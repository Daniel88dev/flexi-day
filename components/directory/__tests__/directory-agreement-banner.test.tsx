import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import type { DirectoryState } from "@/lib/api/directory";
import { DirectoryAgreementBanner } from "../directory-agreement-banner";

let state: DirectoryState | undefined;
const accept = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  useDirectoryState: () => ({ data: state }),
  useAcceptDirectoryAgreement: () => ({ mutateAsync: accept, isPending: false }),
}));

const directory = (isOwner: boolean, newVersionReady: boolean): DirectoryState => ({
  organizationId: "org-1",
  isOwner,
  enabled: true,
  enabledAt: "2026-09-02T10:00:00Z",
  disabledAt: null,
  writable: true,
  agreement: {
    currentVersion: 2,
    acceptedVersion: 1,
    acceptedAt: "2026-09-02T10:00:00Z",
    acceptedByName: "Olga Owner",
    newVersionReady,
  },
  people: { open: 3, former: 0 },
});

describe("DirectoryAgreementBanner", () => {
  beforeEach(() => {
    accept.mockReset();
    accept.mockResolvedValue({});
  });

  it("asks the owner to accept the new version", async () => {
    state = directory(true, true);
    renderWithClient(<DirectoryAgreementBanner organizationId="org-1" />);

    expect(screen.getByText("Version 2 of the directory agreement is ready")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Accept version 2" }));
    expect(accept).toHaveBeenCalledWith(2);
  });

  it("shows nothing to an org admin", () => {
    state = directory(false, true);
    const { container } = renderWithClient(<DirectoryAgreementBanner organizationId="org-1" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows nothing once the owner is up to date", () => {
    state = directory(true, false);
    const { container } = renderWithClient(<DirectoryAgreementBanner organizationId="org-1" />);
    expect(container).toBeEmptyDOMElement();
  });
});
