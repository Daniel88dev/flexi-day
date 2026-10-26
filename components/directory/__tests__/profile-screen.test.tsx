import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type {
  DirectoryCardView,
  DirectoryJobView,
  DirectoryOrganization,
  DirectoryProfile,
} from "@/lib/api/directory";
import { ProfileScreen } from "../profile-screen";

let profile: { data?: DirectoryProfile; error: unknown } = { error: null };
let organizations: DirectoryOrganization[] = [];
const search = new URLSearchParams("organizationId=org-1&employmentId=emp-jana");

vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
}));

let history: { data?: unknown[]; error: unknown } = { data: [], error: null };
const historyCalls: boolean[] = [];

vi.mock("@/lib/api/queries", () => ({
  useDirectoryOrganizations: () => ({ data: organizations, isLoading: false, error: null }),
  useDirectoryProfile: () => ({ ...profile, isLoading: false }),
  useProfileHistory: (_organizationId: string, _employmentId: string, enabled: boolean) => {
    historyCalls.push(enabled);
    return enabled ? { ...history, isLoading: false } : { data: undefined, error: null };
  },
}));

const card = (overrides: Partial<DirectoryCardView> = {}): DirectoryCardView => ({
  level: "READ",
  jobTitle: null,
  reportsTo: null,
  nameFromAccount: true,
  ...overrides,
});

const job = (overrides: Partial<DirectoryJobView> = {}): DirectoryJobView => ({
  level: "READ",
  spell: { startedAt: "2025-02-03T08:00:00.000Z", endedAt: null },
  legalName: null,
  employeeNumber: null,
  startDate: null,
  leavingDate: null,
  probationEndDate: null,
  contractType: null,
  workingTime: null,
  ...overrides,
});

const jana = (overrides: Partial<DirectoryProfile> = {}): DirectoryProfile => ({
  employmentId: "emp-jana",
  organizationId: "org-1",
  name: "Jana Member",
  jobTitle: null,
  image: null,
  photoUrl: null,
  user: { id: "u-jana", name: "Jana Member", initials: "JM", avatarColor: "hsl(10, 65%, 50%)" },
  markers: [],
  self: false,
  ended: false,
  canReadHistory: false,
  sections: {
    card: card(),
    photo: { level: "READ", photo: null },
    workContact: { level: "READ", workEmail: null, workPhone: null },
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
    expect(
      screen.queryByText(/Started|Sign-in email|Contact$|Personal|Employee number/)
    ).toBeNull();
    expect(screen.queryByRole("tab", { name: "Job" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Edit profile/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Profile history/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Directory" })).toHaveAttribute(
      "href",
      "/directory?organizationId=org-1"
    );
  });

  it("shows the work email and the phone's display form as links, and says when both are empty", () => {
    profile = {
      data: jana({
        sections: {
          card: card(),
          workContact: {
            level: "READ",
            workEmail: "jana.work@acme.test",
            workPhone: {
              e164: "+420601123456",
              display: "+420 601 123 456",
              country: { code: "CZ", name: "Czechia" },
            },
          },
        },
      }),
      error: null,
    };
    const { unmount } = renderWithClient(<ProfileScreen />);

    const region = screen.getByRole("region", { name: "Work contact" });
    expect(within(region).getByRole("link", { name: "jana.work@acme.test" })).toHaveAttribute(
      "href",
      "mailto:jana.work@acme.test"
    );
    expect(within(region).getByRole("link", { name: "+420 601 123 456" })).toHaveAttribute(
      "href",
      "tel:+420601123456"
    );
    unmount();

    profile = { data: jana(), error: null };
    renderWithClient(<ProfileScreen />);
    expect(screen.getByText("No work contact yet.")).toBeInTheDocument();
  });

  it("offers Edit profile to a viewer who writes only Work contact", () => {
    profile = {
      data: jana({
        sections: {
          card: card(),
          workContact: { level: "WRITE", workEmail: null, workPhone: null },
        },
      }),
      error: null,
    };
    renderWithClient(<ProfileScreen />);

    expect(screen.getByRole("link", { name: /Edit profile/ })).toBeInTheDocument();
  });

  it("leaves out Work contact when the viewer can't read it", () => {
    profile = { data: jana({ sections: { card: card() } }), error: null };
    renderWithClient(<ProfileScreen />);

    expect(screen.queryByRole("region", { name: "Work contact" })).not.toBeInTheDocument();
  });

  it("shows the person their spell and their account facts on the Record tab", async () => {
    const user = userEvent.setup();
    profile = {
      data: jana({
        self: true,
        sections: {
          card: card(),
          job: job(),
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
          card: card(),
          job: job(),
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

  it("puts the full Profile photo in the header, ahead of the Account picture", () => {
    profile = {
      data: jana({
        image: "https://cdn.test/jana.png",
        photoUrl: "https://store.test/small.jpg",
        sections: {
          card: card(),
          photo: {
            level: "READ",
            photo: {
              smallUrl: "https://store.test/small.jpg",
              fullUrl: "https://store.test/full.jpg",
            },
          },
        },
      }),
      error: null,
    };
    const { container } = renderWithClient(<ProfileScreen />);

    expect(container.querySelector("img")).toHaveAttribute("src", "https://store.test/full.jpg");
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

  it("shows the job title under the name and the Card's Reports to as a link", () => {
    profile = {
      data: jana({
        sections: {
          card: card({
            jobTitle: "Support specialist",
            reportsTo: { employmentId: "emp-boss", name: "Marketa Boss" },
          }),
        },
      }),
      error: null,
    };
    renderWithClient(<ProfileScreen />);

    const region = screen.getByRole("region", { name: "Card" });
    expect(within(region).getByText("Support specialist")).toBeInTheDocument();
    expect(within(region).getByRole("link", { name: "Marketa Boss" })).toHaveAttribute(
      "href",
      "/directory/person?organizationId=org-1&employmentId=emp-boss"
    );
    expect(screen.getAllByText("Support specialist")).toHaveLength(2);
  });

  it("shows a Job reader the Job tab, with legal name only when set and the employee-only fields for employees", async () => {
    const user = userEvent.setup();
    profile = {
      data: jana({
        sections: {
          card: card(),
          job: job({
            employeeNumber: "A-0044",
            startDate: "2024-03-01",
            contractType: "FIXED_TERM",
            workingTime: "PART_TIME",
          }),
        },
      }),
      error: null,
    };
    const { unmount } = renderWithClient(<ProfileScreen />);

    await user.click(screen.getByRole("tab", { name: "Job" }));
    const tab = screen.getByRole("tabpanel");
    expect(within(tab).getByText("A-0044")).toBeInTheDocument();
    expect(within(tab).getByText("01/03/2024")).toBeInTheDocument();
    expect(within(tab).getByText("Fixed-term")).toBeInTheDocument();
    expect(within(tab).getByText("Part-time")).toBeInTheDocument();
    expect(within(tab).queryByText("Legal name")).not.toBeInTheDocument();
    unmount();

    profile = {
      data: jana({
        markers: ["EXTERNAL_WORKER"],
        sections: { card: card(), job: job({ legalName: "Eli E. External" }) },
      }),
      error: null,
    };
    renderWithClient(<ProfileScreen />);
    await user.click(screen.getByRole("tab", { name: "Job" }));
    const external = screen.getByRole("tabpanel");
    expect(within(external).getByText("Eli E. External")).toBeInTheDocument();
    expect(within(external).queryByText("Contract type")).not.toBeInTheDocument();
    expect(within(external).queryByText("Probation end date")).not.toBeInTheDocument();
  });

  it("offers Edit profile to a Card or Job writer", () => {
    profile = {
      data: jana({ sections: { card: card(), job: job({ level: "WRITE" }) } }),
      error: null,
    };
    renderWithClient(<ProfileScreen />);

    expect(screen.getByRole("link", { name: /Edit profile/ })).toHaveAttribute(
      "href",
      "/directory/person/edit?organizationId=org-1&employmentId=emp-jana"
    );
  });

  it("offers Edit profile to someone who writes only the Photo", () => {
    profile = {
      data: jana({
        self: true,
        sections: { card: card(), photo: { level: "WRITE", photo: null } },
      }),
      error: null,
    };
    renderWithClient(<ProfileScreen />);

    expect(screen.getByRole("link", { name: /Edit profile/ })).toBeInTheDocument();
  });

  it("opens the profile history drawer for a viewer who reads it, with fields and no values", async () => {
    const user = userEvent.setup();
    history = {
      data: [
        {
          id: "h1",
          at: "2026-10-01T09:20:00.000Z",
          actorName: "Martin Svoboda",
          section: "CARD",
          fields: ["reportsTo"],
          audience: "ORGANIZATION_ADMIN",
        },
        {
          id: "h2",
          at: "2026-09-05T12:02:00.000Z",
          actorName: null,
          section: "JOB",
          fields: ["employeeNumber", "workingTime"],
          audience: "OWNER",
        },
      ],
      error: null,
    };
    profile = { data: jana({ canReadHistory: true }), error: null };
    renderWithClient(<ProfileScreen />);
    expect(historyCalls.at(-1)).toBe(false);

    await user.click(screen.getByRole("button", { name: /Profile history/ }));

    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("Profile history · Jana Member")).toBeInTheDocument();
    expect(within(drawer).getByText("Martin Svoboda")).toBeInTheDocument();
    expect(within(drawer).getByText("as Org admin")).toBeInTheDocument();
    expect(within(drawer).getByText("Card: Reports to")).toBeInTheDocument();
    expect(within(drawer).getByText("Someone no longer here")).toBeInTheDocument();
    expect(within(drawer).getByText("Job: Employee number, Working time")).toBeInTheDocument();
    expect(historyCalls.at(-1)).toBe(true);
  });
});
