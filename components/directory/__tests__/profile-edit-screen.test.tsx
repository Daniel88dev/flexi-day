import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
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
const fireDate = (input: HTMLElement, value: string) =>
  fireEvent.change(input, { target: { value } });
let organization: DirectoryOrganization;
let updateError: unknown = null;
const mutate = vi.fn();
const push = vi.fn();
const uploadPhoto = vi.fn();
const removePhoto = vi.fn();
let uploadState: { data?: unknown; error?: unknown } = {};
const search = new URLSearchParams("organizationId=org-1&employmentId=emp-jana");

const showMock = vi.fn();
vi.mock("@/lib/api/directory", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/directory")>()),
  showSensitiveSection: (...args: unknown[]) => showMock(...args),
}));

const cz = { code: "CZ", name: "Czechia" };
const shownContact = {
  section: "CONTACT",
  level: "WRITE",
  recorded: true,
  privatePhone: { e164: "+420777123456", display: "+420 777 123 456", country: cz },
  privateEmail: "jana@home.test",
  emergencyContact1: null,
  emergencyContact2: null,
};

vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
  useRouter: () => ({ push }),
}));

const person = (name: string, employmentId: string): DirectoryPerson => ({
  employmentId,
  name,
  jobTitle: null,
  image: null,
  photoUrl: null,
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
  useUploadProfilePhoto: () => ({
    mutate: uploadPhoto,
    isPending: false,
    data: uploadState.data,
    error: uploadState.error ?? null,
    reset: vi.fn(),
  }),
  useRemoveProfilePhoto: () => ({ mutate: removePhoto, isPending: false, error: null }),
  useDirectoryList: (_organizationId: string, kind: "departments" | "locations") => ({
    data: { editable: false, writable: true, entries: lists[kind] },
  }),
}));

let lists: Record<"departments" | "locations", { id: string; name: string; archived: boolean }[]>;

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
  photoUrl: null,
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
    uploadPhoto.mockReset();
    removePhoto.mockReset();
    uploadState = {};
    updateError = null;
    lists = { departments: [], locations: [] };
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

  describe("the sign-in email of a person without an account", () => {
    const accountless = (signInEmail: string | null) =>
      jana({
        sections: { card: card({ nameFromAccount: false }), job: job() },
        account: { status: "NO_ACCOUNT", signInEmail, directoryRoles: [] },
        markers: ["NO_ACCOUNT"],
      });

    it("lets a Card writer set it, lowercased", async () => {
      const user = userEvent.setup();
      profile = accountless(null);
      renderWithClient(<ProfileEditScreen />);

      const email = screen.getByLabelText("Sign-in email");
      expect(email).toBeEnabled();
      expect(screen.getByText("A directory invite goes to this address.")).toBeInTheDocument();
      await user.type(email, "Ada@Example.test");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(mutate).toHaveBeenCalledWith(
        { card: { email: "ada@example.test" } },
        expect.anything()
      );
    });

    it("refuses an address that isn't one before saving", async () => {
      const user = userEvent.setup();
      profile = accountless(null);
      renderWithClient(<ProfileEditScreen />);

      await user.type(screen.getByLabelText("Sign-in email"), "not-an-email");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(screen.getByText("That isn't an email address.")).toBeInTheDocument();
      expect(mutate).not.toHaveBeenCalled();
    });

    it("stays read-only for a reader of the Card and once the person left", () => {
      profile = { ...accountless("ada@example.test"), ended: true };
      renderWithClient(<ProfileEditScreen />);
      expect(screen.getByLabelText("Sign-in email")).toBeDisabled();
    });

    it("offers only Clear on a lapsed plan", async () => {
      const user = userEvent.setup();
      organization = { ...organization, writable: false };
      profile = accountless("ada@example.test");
      renderWithClient(<ProfileEditScreen />);

      expect(screen.getByLabelText("Sign-in email")).toBeDisabled();
      await user.click(screen.getByRole("button", { name: "Clear: Sign-in email" }));
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(mutate).toHaveBeenCalledWith({ card: { email: null } }, expect.anything());
    });

    it("says when another open Employment uses the address", () => {
      profile = accountless("ada@example.test");
      updateError = new ApiError(409, "Taken", {}, [
        { message: "Taken", context: { code: "EMPLOYMENT_EMAIL_TAKEN" } },
      ]);
      renderWithClient(<ProfileEditScreen />);

      expect(
        screen.getByText("Someone in the organization already uses this email.")
      ).toBeInTheDocument();
    });
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

  it("picks a Department and a Location, leaving archived entries out unless the record holds one", async () => {
    const user = userEvent.setup();
    mutate.mockImplementation((_patch, options: { onSuccess: () => void }) => options.onSuccess());
    lists = {
      departments: [
        { id: "d-sales", name: "Sales", archived: true },
        { id: "d-support", name: "Support", archived: false },
        { id: "d-legal", name: "Legal", archived: true },
      ],
      locations: [{ id: "l-berlin", name: "Berlin", archived: false }],
    };
    profile = jana({
      sections: {
        ...jana().sections,
        card: card({ department: { id: "d-sales", name: "Sales", archived: true } }),
      },
    });
    renderWithClient(<ProfileEditScreen />);

    const department = screen.getByLabelText("Department");
    expect(
      within(department)
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["None", "Sales (archived)", "Support"]);
    expect(department).toHaveValue("d-sales");
    await user.selectOptions(screen.getByLabelText("Location"), "Berlin");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(mutate).toHaveBeenCalledWith({ card: { locationId: "l-berlin" } }, expect.anything());
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

  describe("the Photo Section", () => {
    const links = { smallUrl: "https://store.test/s.jpg", fullUrl: "https://store.test/f.jpg" };

    it("lets the person upload a photo even when Card and Job only read", async () => {
      const user = userEvent.setup();
      profile = jana({
        self: true,
        sections: {
          card: card({ level: "READ" }),
          job: job({ level: "READ" }),
          photo: { level: "WRITE", photo: null },
        },
      });
      renderWithClient(<ProfileEditScreen />);

      const region = screen.getByRole("region", { name: /Photo/ });
      expect(within(region).getByText("No profile photo.")).toBeInTheDocument();
      expect(
        screen.queryByText("You can't edit anything on this profile.")
      ).not.toBeInTheDocument();
      const file = new File(["bytes"], "me.jpg", { type: "image/jpeg" });
      await user.upload(within(region).getByLabelText("Upload photo"), file);

      expect(uploadPhoto).toHaveBeenCalledWith(file);
      expect(
        within(region).queryByRole("button", { name: "Remove photo" })
      ).not.toBeInTheDocument();
    });

    it("explains a file that can't be a photo without sending it", async () => {
      const user = userEvent.setup({ applyAccept: false });
      profile = jana({ sections: { card: card(), photo: { level: "WRITE", photo: null } } });
      renderWithClient(<ProfileEditScreen />);

      const region = screen.getByRole("region", { name: /Photo/ });
      await user.upload(
        within(region).getByLabelText("Upload photo"),
        new File(["%PDF"], "cv.pdf", { type: "application/pdf" })
      );

      expect(uploadPhoto).not.toHaveBeenCalled();
      expect(within(region).getByRole("alert")).toHaveTextContent(
        "Choose a PNG, JPEG, WebP or HEIC image."
      );
    });

    it("shows the current photo with Replace and Remove", async () => {
      const user = userEvent.setup();
      profile = jana({ sections: { card: card(), photo: { level: "WRITE", photo: links } } });
      const { container } = renderWithClient(<ProfileEditScreen />);

      const region = screen.getByRole("region", { name: /Photo/ });
      expect(container.querySelector("#photo img")).toHaveAttribute("src", links.fullUrl);
      expect(within(region).getByLabelText("Replace photo")).toBeInTheDocument();
      await user.click(within(region).getByRole("button", { name: "Remove photo" }));

      expect(removePhoto).toHaveBeenCalled();
    });

    it("tells why a processed upload was refused", () => {
      uploadState = { data: { id: "p", status: "REJECTED", rejectionReason: "IMAGE_UNREADABLE" } };
      profile = jana({ sections: { card: card(), photo: { level: "WRITE", photo: null } } });
      renderWithClient(<ProfileEditScreen />);

      expect(screen.getByRole("alert")).toHaveTextContent("This image couldn't be read.");
    });

    it("keeps Remove and disables uploading on a lapsed plan", () => {
      organization = { ...organization, writable: false };
      profile = jana({ sections: { card: card(), photo: { level: "WRITE", photo: links } } });
      renderWithClient(<ProfileEditScreen />);

      const region = screen.getByRole("region", { name: /Photo/ });
      expect(within(region).getByLabelText("Replace photo")).toBeDisabled();
      expect(
        within(region).getByText(
          "Setting a photo needs the Enterprise plan. You can still remove it."
        )
      ).toBeInTheDocument();
      expect(within(region).getByRole("button", { name: "Remove photo" })).toBeEnabled();
    });

    it("shows a read-only photo without controls", () => {
      profile = jana({ sections: { card: card(), photo: { level: "READ", photo: links } } });
      renderWithClient(<ProfileEditScreen />);

      const region = screen.getByRole("region", { name: /Photo/ });
      expect(within(region).getByText("Read-only")).toBeInTheDocument();
      expect(within(region).queryByRole("button")).not.toBeInTheDocument();
      expect(within(region).queryByLabelText(/photo/i)).not.toBeInTheDocument();
    });
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

  describe("the Sensitive sections", () => {
    beforeEach(() => {
      showMock.mockReset();
      showMock.mockResolvedValue(shownContact);
    });

    it("keeps Contact closed until Show, then edits it with the notice and sends only what changed", async () => {
      const user = userEvent.setup();
      profile = jana({
        sections: {
          card: card(),
          contact: {
            level: "WRITE",
            notice: "Acme keeps them for 30 days.",
            phoneCountryDefault: cz,
          },
        },
      });
      renderWithClient(<ProfileEditScreen />);

      const region = screen.getByRole("region", { name: /Contact/ });
      expect(within(region).getByText("Hidden until you open it.")).toBeInTheDocument();
      expect(within(region).queryByLabelText("Private email")).not.toBeInTheDocument();
      expect(showMock).not.toHaveBeenCalled();

      await user.click(within(region).getByRole("button", { name: "Show" }));

      expect(showMock).toHaveBeenCalledTimes(1);
      expect(await within(region).findByLabelText("Private email")).toHaveValue("jana@home.test");
      expect(within(region).getByText(/recorded in the read log/)).toBeInTheDocument();
      expect(within(region).getByText("Acme keeps them for 30 days.")).toBeInTheDocument();
      expect(within(region).getByLabelText("Private email")).toHaveValue("jana@home.test");
      await user.type(within(region).getByLabelText("Emergency contact 1: name"), "Karel");
      await user.type(within(region).getByLabelText("Emergency contact 1: phone"), "602 111 222");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(mutate).toHaveBeenCalledWith(
        { contact: { emergencyContact1: { name: "Karel", phone: "+420602111222" } } },
        expect.anything()
      );
    });

    it("refuses a half-filled emergency contact before saving", async () => {
      const user = userEvent.setup();
      profile = jana({ self: true, sections: { contact: { level: "WRITE", notice: "x" } } });
      renderWithClient(<ProfileEditScreen />);

      const region = screen.getByRole("region", { name: /Contact/ });
      await user.type(await within(region).findByLabelText("Emergency contact 2: name"), "Ema");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(
        within(region).getByText("Fill in both the name and the phone, or neither.")
      ).toBeInTheDocument();
      expect(mutate).not.toHaveBeenCalled();
      expect(screen.queryByRole("button", { name: "Show" })).not.toBeInTheDocument();
    });

    it("writes the home address and date of birth, and asks for line 1, city and country", async () => {
      const user = userEvent.setup();
      showMock.mockResolvedValue({
        section: "PERSONAL",
        level: "WRITE",
        recorded: true,
        homeAddress: null,
        dateOfBirth: null,
      });
      profile = jana({ sections: { personal: { level: "WRITE" } } });
      renderWithClient(<ProfileEditScreen />);

      const region = screen.getByRole("region", { name: /Personal/ });
      await user.click(within(region).getByRole("button", { name: "Show" }));
      await user.type(await within(region).findByLabelText("City"), "Praha");
      await user.click(screen.getByRole("button", { name: "Save changes" }));
      expect(within(region).getByText(/Line 1, city and country are needed/)).toBeInTheDocument();
      expect(mutate).not.toHaveBeenCalled();

      await user.type(within(region).getByLabelText("Address line 1"), "Vinohradská 12");
      await user.selectOptions(within(region).getByLabelText("Country"), "CZ");
      fireDate(within(region).getByLabelText("Date of birth"), "1990-04-17");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(mutate).toHaveBeenCalledWith(
        {
          personal: {
            homeAddress: {
              line1: "Vinohradská 12",
              line2: null,
              postalCode: null,
              city: "Praha",
              region: null,
              country: "CZ",
            },
            dateOfBirth: "1990-04-17",
          },
        },
        expect.anything()
      );
    });
  });
});
