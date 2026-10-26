import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithClient } from "@/lib/test-utils";
import type { DirectoryOrganization } from "@/lib/api/directory";
import { DirectoryScreen } from "../directory-screen";

let organizations: DirectoryOrganization[] = [];

vi.mock("@/lib/api/queries", () => ({
  useDirectoryOrganizations: () => ({ data: organizations, isLoading: false, error: null }),
  useDirectoryState: () => ({ data: undefined }),
  useAcceptDirectoryAgreement: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const org = (overrides: Partial<DirectoryOrganization>): DirectoryOrganization => ({
  organizationId: "org-1",
  name: "Acme",
  role: "MEMBER",
  enabled: false,
  writable: false,
  newAgreementVersionReady: false,
  ...overrides,
});

describe("DirectoryScreen", () => {
  it("opens the empty directory of a Directory organization", () => {
    organizations = [org({ enabled: true, writable: true })];
    renderWithClient(<DirectoryScreen />);

    expect(screen.getByRole("heading", { name: "Directory" })).toBeInTheDocument();
    expect(screen.getByText("No profiles yet")).toBeInTheDocument();
  });

  it("shows the owner on Pro the Enterprise upsell", () => {
    organizations = [org({ role: "OWNER" })];
    renderWithClient(<DirectoryScreen />);

    expect(screen.getByText("Enterprise")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/billing");
  });

  it("points an org admin on Enterprise at the owner", () => {
    organizations = [org({ role: "ORGANIZATION_ADMIN", writable: true })];
    renderWithClient(<DirectoryScreen />);

    expect(screen.getByText(/Only its owner can turn it on/)).toBeInTheDocument();
  });

  it("tells a member without a Directory organization there is none", () => {
    organizations = [org({})];
    renderWithClient(<DirectoryScreen />);

    expect(
      screen.getByText("The directory isn't on in any of your organizations.")
    ).toBeInTheDocument();
  });
});
