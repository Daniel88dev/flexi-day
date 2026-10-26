import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type {
  DirectoryCardView,
  DirectoryJobView,
  DirectoryOrganization,
  DirectoryPerson,
  DirectoryProfile,
} from "@/lib/api/directory";
import { ProfileEditScreen } from "../profile-edit-screen";

let profile: DirectoryProfile;
let organization: DirectoryOrganization;
let updateError: unknown = null;
const mutate = vi.fn();
const push = vi.fn();
const search = new URLSearchParams("organizationId=org-1&employmentId=emp-jana");

vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
  useRouter: () => ({ push }),
}));

const person = (name: string, employmentId: string): DirectoryPerson => ({
  employmentId,
  name,
  jobTitle: null,
  image: null,
  user: { id: employmentId, name, initials: name.slice(0, 2), avatarColor: "hsl(1, 1%, 1%)" },
  markers: [],
});

vi.mock("@/lib/api/queries", () => ({
  useDirectoryOrganizations: () => ({ data: [organization], isLoading: false, error: null }),
  useDirectoryProfile: () => ({ data: profile, isLoading: false, error: null }),
  useDirectoryPeople: () => ({
    data: {
      people: [person("Jana Member", "emp-jana"), person("Marketa Boss", "emp-boss")],
      formerList: true,
    },
  }),
  useUpdateDirectoryProfile: () => ({ mutate, error: updateError, isPending: false }),
}));

const card = (overrides: Partial<DirectoryCardView> = {}): DirectoryCardView => ({
  level: "WRITE",
  jobTitle: "Support specialist",
  reportsTo: null,
  nameFromAccount: true,
  ...overrides,
});

const job = (overrides: Partial<DirectoryJobView> = {}): DirectoryJobView => ({
  level: "WRITE",
  spell: { startedAt: "2025-02-03T08:00:00.000Z", endedAt: null },
  legalName: null,
  employeeNumber: "A-0044",
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
  jobTitle: "Support specialist",
  image: null,
  user: { id: "u-jana", name: "Jana Member", initials: "JM", avatarColor: "hsl(10, 65%, 50%)" },
  markers: [],
  self: false,
  ended: false,
  canReadHistory: true,
  sections: { card: card(), job: job() },
  account: { status: "ACTIVE", signInEmail: "jana@acme.test", directoryRoles: [] },
  ...overrides,
});

describe("ProfileEditScreen", () => {
  beforeEach(() => {
    mutate.mockReset();
    push.mockReset();
    updateError = null;
    profile = jana();
    organization = {
      organizationId: "org-1",
      name: "Acme",
      role: "ORGANIZATION_ADMIN",
      enabled: true,
      writable: true,
      newAgreementVersionReady: false,
    };
  });

  it("links an anchor per Section, greys a read-only one and leaves out one the viewer can't read", () => {
    profile = jana({ sections: { card: card({ level: "READ" }) } });
    renderWithClient(<ProfileEditScreen />);

    const nav = screen.getByRole("navigation", { name: "Sections" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href"))
    ).toEqual(["#record", "#card"]);
    const cardRegion = screen.getByRole("region", { name: /Card/ });
    expect(within(cardRegion).getByText("Read-only")).toBeInTheDocument();
    expect(within(cardRegion).getByLabelText("Job title")).toBeDisabled();
    expect(within(cardRegion).getByLabelText("Job title")).toHaveValue("Support specialist");
    expect(screen.queryByRole("region", { name: /Job/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Employee number")).not.toBeInTheDocument();
  });

  it("never fills in the start date, and shows the spell start as the hint", () => {
    renderWithClient(<ProfileEditScreen />);

    expect(screen.getByLabelText("Start date")).toHaveValue("");
    expect(screen.getByText("In Flexi Day since 03/02/2025")).toBeInTheDocument();
  });

  it("locks a bound person's name and sign-in email to the account", () => {
    renderWithClient(<ProfileEditScreen />);

    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(screen.getByLabelText("Sign-in email")).toBeDisabled();
    expect(screen.getAllByText("From the account.")).toHaveLength(2);
  });

  it("lets a Card writer rename a person without an account", async () => {
    const user = userEvent.setup();
    profile = jana({
      sections: { card: card({ nameFromAccount: false }), job: job() },
      account: { status: "NO_ACCOUNT", signInEmail: "ada@example.test", directoryRoles: [] },
    });
    renderWithClient(<ProfileEditScreen />);

    const name = screen.getByLabelText("Name");
    expect(name).toBeEnabled();
    await user.clear(name);
    await user.type(name, "Ada Lovelace");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(mutate).toHaveBeenCalledWith({ card: { name: "Ada Lovelace" } }, expect.anything());
  });

  it("saves only the fields that changed and goes back to the profile", async () => {
    const user = userEvent.setup();
    mutate.mockImplementation((_patch, options: { onSuccess: () => void }) => options.onSuccess());
    renderWithClient(<ProfileEditScreen />);

    await user.clear(screen.getByLabelText("Job title"));
    await user.type(screen.getByLabelText("Job title"), "Team lead");
    await user.selectOptions(screen.getByLabelText("Reports to"), "Marketa Boss");
    await user.selectOptions(screen.getByLabelText("Contract type"), "Permanent");
    await user.clear(screen.getByLabelText("Employee number"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(mutate).toHaveBeenCalledWith(
      {
        card: { jobTitle: "Team lead", reportsToEmploymentId: "emp-boss" },
        job: { employeeNumber: null, contractType: "PERMANENT" },
      },
      expect.anything()
    );
    expect(push).toHaveBeenCalledWith(
      "/directory/person?organizationId=org-1&employmentId=emp-jana"
    );
  });

  it("leaves Reports to without the person themself", () => {
    renderWithClient(<ProfileEditScreen />);

    const options = within(screen.getByLabelText("Reports to"))
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toEqual(["Nobody", "Marketa Boss"]);
  });

  it("hides the employee-only fields on an External worker", () => {
    profile = jana({ markers: ["EXTERNAL_WORKER"] });
    renderWithClient(<ProfileEditScreen />);

    expect(screen.getByLabelText("Legal name")).toBeInTheDocument();
    expect(screen.queryByLabelText("Contract type")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Working time")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Probation end date")).not.toBeInTheDocument();
  });

  it("disables every field on a lapsed plan and offers Clear beside the filled ones", async () => {
    const user = userEvent.setup();
    organization = { ...organization, writable: false };
    renderWithClient(<ProfileEditScreen />);

    expect(screen.getByLabelText("Job title")).toBeDisabled();
    expect(screen.getByLabelText("Employee number")).toBeDisabled();
    expect(
      screen.getAllByText("On this plan you can clear values but not set new ones.")
    ).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Clear: Legal name" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear: Job title" }));
    await user.click(screen.getByRole("button", { name: "Clear: Employee number" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(mutate).toHaveBeenCalledWith(
      { card: { jobTitle: null }, job: { employeeNumber: null } },
      expect.anything()
    );
  });

  it("explains a refusal from the server", () => {
    updateError = new ApiError(409, "taken", undefined, [
      { message: "taken", context: { code: "EMPLOYEE_NUMBER_TAKEN" } },
    ]);
    renderWithClient(<ProfileEditScreen />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Another current employee already has this employee number."
    );
  });
});
