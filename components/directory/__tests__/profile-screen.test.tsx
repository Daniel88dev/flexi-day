import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type { DirectoryOrganization, DirectoryProfile } from "@/lib/api/directory";
import { ProfileScreen } from "../profile-screen";

let profile: { data?: DirectoryProfile; error: unknown } = { error: null };
let organizations: DirectoryOrganization[] = [];
const search = new URLSearchParams("organizationId=org-1&employmentId=emp-jana");

vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
}));

vi.mock("@/lib/api/queries", () => ({
  useDirectoryOrganizations: () => ({ data: organizations, isLoading: false, error: null }),
  useDirectoryProfile: () => ({ ...profile, isLoading: false }),
}));

const jana = (overrides: Partial<DirectoryProfile> = {}): DirectoryProfile => ({
  employmentId: "emp-jana",
  organizationId: "org-1",
  name: "Jana Member",
  image: null,
  user: { id: "u-jana", name: "Jana Member", initials: "JM", avatarColor: "hsl(10, 65%, 50%)" },
  markers: [],
  self: false,
  ended: false,
  sections: {
    card: { level: "READ" },
    photo: { level: "READ" },
    workContact: { level: "READ" },
  },
  ...overrides,
});

const organization: DirectoryOrganization = {
  organizationId: "org-1",
  name: "Acme",
  role: "MEMBER",
  enabled: true,
  writable: true,
  newAgreementVersionReady: false,
};

describe("ProfileScreen", () => {
  beforeEach(() => {
    organizations = [organization];
    profile = { data: jana(), error: null };
  });

  it("shows a colleague the header and the Overview tab, and nothing for Sections they can't read", () => {
    renderWithClient(<ProfileScreen />);

    expect(screen.getByRole("heading", { level: 1, name: "Jana Member" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Record" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Card" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Work contact" })).toBeInTheDocument();
    expect(screen.queryByText(/Started|Sign-in email|Contact$|Personal|Job/)).toBeNull();
    expect(screen.getByRole("link", { name: "Directory" })).toHaveAttribute(
      "href",
      "/directory?organizationId=org-1"
    );
  });

  it("leaves out Work contact when the viewer can't read it", () => {
    profile = { data: jana({ sections: { card: { level: "READ" } } }), error: null };
    renderWithClient(<ProfileScreen />);

    expect(screen.queryByRole("region", { name: "Work contact" })).not.toBeInTheDocument();
  });

  it("shows the person their spell and their account facts on the Record tab", async () => {
    const user = userEvent.setup();
    profile = {
      data: jana({
        self: true,
        sections: {
          card: { level: "READ" },
          job: {
            level: "READ",
            spell: { startedAt: "2025-02-03T08:00:00.000Z", endedAt: null },
          },
        },
        account: { status: "ACTIVE", signInEmail: "jana@acme.test", directoryRoles: [] },
      }),
      error: null,
    };
    renderWithClient(<ProfileScreen />);

    await user.click(screen.getByRole("tab", { name: "Record" }));

    const record = screen.getByRole("tabpanel");
    expect(
      within(record).getByText(new Date("2025-02-03T08:00:00.000Z").toLocaleDateString("en-GB"))
    ).toBeInTheDocument();
    expect(within(record).getByText("Current")).toBeInTheDocument();
    expect(within(record).getByText("Active")).toBeInTheDocument();
    expect(within(record).getByText("jana@acme.test")).toBeInTheDocument();
    expect(within(record).getByText("None")).toBeInTheDocument();
  });

  it("shows a Job reader the spell without the account facts", async () => {
    const user = userEvent.setup();
    profile = {
      data: jana({
        sections: {
          card: { level: "READ" },
          job: {
            level: "READ",
            spell: { startedAt: "2025-02-03T08:00:00.000Z", endedAt: null },
          },
        },
      }),
      error: null,
    };
    renderWithClient(<ProfileScreen />);

    await user.click(screen.getByRole("tab", { name: "Record" }));

    expect(screen.getByRole("region", { name: "Employment" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Account" })).not.toBeInTheDocument();
  });

  it("falls back from the Account picture to initials", () => {
    const { unmount } = renderWithClient(<ProfileScreen />);
    expect(screen.getByTitle("Jana Member")).toHaveTextContent("JM");
    unmount();

    profile = { data: jana({ image: "https://cdn.test/jana.png" }), error: null };
    const { container } = renderWithClient(<ProfileScreen />);
    expect(container.querySelector("img")).toHaveAttribute("src", "https://cdn.test/jana.png");
  });

  it("shows the markers the API sends", () => {
    profile = { data: jana({ markers: ["EXTERNAL_WORKER", "NO_ACCOUNT"] }), error: null };
    renderWithClient(<ProfileScreen />);

    expect(screen.getByText("External worker")).toBeInTheDocument();
    expect(screen.getByText("No account")).toBeInTheDocument();
  });

  it("keeps the profile readable under the lapsed banner", () => {
    organizations = [{ ...organization, writable: false }];
    renderWithClient(<ProfileScreen />);

    expect(screen.getByTestId("directory-lapsed")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Jana Member" })).toBeInTheDocument();
  });

  it("says the profile isn't available on a 404", () => {
    profile = { error: new ApiError(404, "Person not found") };
    renderWithClient(<ProfileScreen />);

    expect(screen.getByText("This profile isn't available to you.")).toBeInTheDocument();
  });
});
