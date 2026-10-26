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
  DirectoryWorkContactView,
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

const workContact = (
  overrides: Partial<DirectoryWorkContactView> = {}
): DirectoryWorkContactView => ({
  level: "WRITE",
  workEmail: null,
  workPhone: null,
  phoneCountryDefault: null,
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

  describe("Work contact", () => {
    it("starts the phone country on the server's default and saves the number in E.164", async () => {
      const user = userEvent.setup();
      profile = jana({
        sections: {
          card: card(),
          workContact: workContact({ phoneCountryDefault: { code: "CZ", name: "Czechia" } }),
        },
      });
      renderWithClient(<ProfileEditScreen />);

      const region = screen.getByRole("region", { name: /Work contact/ });
      expect(within(region).getByLabelText("Phone country")).toHaveValue("CZ");
      await user.type(within(region).getByLabelText("Work phone"), "601 123 456");
      await user.type(within(region).getByLabelText("Work email"), "jana.work@acme.test");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(mutate).toHaveBeenCalledWith(
        { workContact: { workEmail: "jana.work@acme.test", workPhone: "+420601123456" } },
        expect.anything()
      );
    });

    it("shows a stored phone as its country and national number, and saves a change", async () => {
      const user = userEvent.setup();
      profile = jana({
        sections: {
          workContact: workContact({
            workEmail: "jana.work@acme.test",
            workPhone: {
              e164: "+420601123456",
              display: "+420 601 123 456",
              country: { code: "CZ", name: "Czechia" },
            },
          }),
        },
      });
      renderWithClient(<ProfileEditScreen />);

      expect(screen.getByLabelText("Phone country")).toHaveValue("CZ");
      expect(screen.getByLabelText("Work phone")).toHaveValue("601 123 456");
      await user.selectOptions(screen.getByLabelText("Phone country"), "SK");
      await user.clear(screen.getByLabelText("Work phone"));
      await user.type(screen.getByLabelText("Work phone"), "912 123 456");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(mutate).toHaveBeenCalledWith(
        { workContact: { workPhone: "+421912123456" } },
        expect.anything()
      );
    });

    it("fills the work email from the sign-in email in one click", async () => {
      const user = userEvent.setup();
      profile = jana({ sections: { workContact: workContact() } });
      renderWithClient(<ProfileEditScreen />);

      await user.click(screen.getByRole("button", { name: "Use sign-in email" }));

      expect(screen.getByLabelText("Work email")).toHaveValue("jana@acme.test");
    });

    it("offers no sign-in email to a viewer who doesn't see it", () => {
      profile = jana({ sections: { workContact: workContact() }, account: undefined });
      renderWithClient(<ProfileEditScreen />);

      expect(screen.queryByRole("button", { name: "Use sign-in email" })).not.toBeInTheDocument();
    });

    it("refuses an invalid phone number before saving", async () => {
      const user = userEvent.setup();
      profile = jana({
        sections: {
          workContact: workContact({ phoneCountryDefault: { code: "CZ", name: "Czechia" } }),
        },
      });
      renderWithClient(<ProfileEditScreen />);

      await user.type(screen.getByLabelText("Work phone"), "601 12");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(
        screen.getByText("Enter a valid phone number for the country you picked.")
      ).toBeInTheDocument();
      expect(mutate).not.toHaveBeenCalled();
    });

    it("greys Work contact for a reader, and offers Clear on a lapsed plan", async () => {
      const user = userEvent.setup();
      const stored = workContact({
        workEmail: "jana.work@acme.test",
        workPhone: {
          e164: "+420601123456",
          display: "+420 601 123 456",
          country: { code: "CZ", name: "Czechia" },
        },
      });
      profile = jana({ sections: { workContact: { ...stored, level: "READ" } } });
      const { unmount } = renderWithClient(<ProfileEditScreen />);
      expect(screen.getByLabelText("Work phone")).toBeDisabled();
      expect(screen.queryByRole("button", { name: "Use sign-in email" })).not.toBeInTheDocument();
      unmount();

      organization = { ...organization, writable: false };
      profile = jana({ sections: { workContact: stored } });
      renderWithClient(<ProfileEditScreen />);
      expect(screen.getByLabelText("Work email")).toBeDisabled();
      await user.click(screen.getByRole("button", { name: "Clear: Work phone" }));
      await user.click(screen.getByRole("button", { name: "Clear: Work email" }));
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(mutate).toHaveBeenCalledWith(
        { workContact: { workEmail: null, workPhone: null } },
        expect.anything()
      );
    });

    it("explains a phone the server refuses", () => {
      profile = jana({ sections: { workContact: workContact() } });
      updateError = new ApiError(422, "bad", undefined, [
        { message: "bad", context: { code: "INVALID_PHONE" } },
      ]);
      renderWithClient(<ProfileEditScreen />);

      expect(screen.getByRole("alert")).toHaveTextContent("That isn't a valid phone number.");
    });
  });
});
