import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type { DirectoryOrganization, DirectoryPerson } from "@/lib/api/directory";
import { AddPersonAction } from "../add-person-dialog";

const push = vi.fn();
const create = vi.fn();
const checkEmail = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/api/queries", () => ({
  useCreateDirectoryPerson: () => ({ mutateAsync: create, isPending: false }),
  useCheckDirectoryEmail: () => ({ mutateAsync: checkEmail }),
  useDirectoryList: (_organizationId: string, kind: string) => ({
    data: {
      editable: false,
      writable: true,
      entries:
        kind === "departments"
          ? [
              { id: "d-sales", name: "Sales", archived: false },
              { id: "d-old", name: "Old", archived: true },
            ]
          : [{ id: "l-brno", name: "Brno", archived: false, country: null }],
    },
  }),
}));

const organization = (overrides: Partial<DirectoryOrganization> = {}): DirectoryOrganization => ({
  organizationId: "org-1",
  name: "Acme",
  role: "OWNER",
  enabled: true,
  writable: true,
  newAgreementVersionReady: false,
  ...overrides,
});

const bob: DirectoryPerson = {
  employmentId: "emp-bob",
  name: "Bob Plain",
  jobTitle: null,
  image: null,
  photoUrl: null,
  user: { id: "u-bob", name: "Bob Plain", initials: "BP", avatarColor: "hsl(10, 65%, 50%)" },
  markers: [],
};

const conflict = (code: string) =>
  new ApiError(409, "Conflict", undefined, [{ message: "Conflict", context: { code } }]);

const openDialog = async () => {
  renderWithClient(<AddPersonAction organization={organization()} people={[bob]} />);
  await userEvent.click(screen.getByRole("button", { name: "Add person" }));
  return screen.getByRole("dialog");
};

describe("AddPersonAction", () => {
  beforeEach(() => {
    push.mockReset();
    create.mockReset();
    checkEmail.mockReset();
    checkEmail.mockResolvedValue({ available: true });
  });

  it("disables Add person on a lapsed plan and says why", () => {
    renderWithClient(
      <AddPersonAction organization={organization({ writable: false })} people={[]} />
    );

    expect(screen.getByRole("button", { name: "Add person" })).toBeDisabled();
    expect(screen.getByText("Adding people needs the Enterprise plan.")).toBeInTheDocument();
  });

  it("groups the fields into Person, Card and Account, and leaves archived entries out", async () => {
    const dialog = await openDialog();

    for (const legend of ["Person", "Card", "Account"]) {
      expect(within(dialog).getByRole("group", { name: legend })).toBeInTheDocument();
    }
    expect(within(dialog).getByRole("radio", { name: /Employee/ })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    const departments = within(dialog).getByLabelText("Department");
    expect([...departments.querySelectorAll("option")].map((option) => option.textContent)).toEqual(
      ["None", "Sales"]
    );
    expect(within(dialog).getByRole("option", { name: "Bob Plain" })).toBeInTheDocument();
  });

  it("checks the name and the email on blur", async () => {
    const dialog = await openDialog();

    await userEvent.click(within(dialog).getByLabelText("Name"));
    await userEvent.tab();
    expect(within(dialog).getByText("Enter a name.")).toBeInTheDocument();

    await userEvent.type(within(dialog).getByLabelText("Email"), "petra@");
    await userEvent.tab();
    expect(within(dialog).getByText("That isn't an email address.")).toBeInTheDocument();
    expect(checkEmail).not.toHaveBeenCalled();
  });

  it("says on blur that an open Employment already uses the email", async () => {
    checkEmail.mockResolvedValue({ available: false });
    const dialog = await openDialog();

    await userEvent.type(within(dialog).getByLabelText("Email"), "Bob@Example.test");
    await userEvent.tab();

    expect(checkEmail).toHaveBeenCalledWith("bob@example.test");
    expect(
      await within(dialog).findByText("Someone in the organization already uses this email.")
    ).toBeInTheDocument();
  });

  it("refuses to submit without a name, and sends nothing", async () => {
    const dialog = await openDialog();

    await userEvent.click(within(dialog).getByRole("button", { name: "Add person" }));

    expect(within(dialog).getByText("Enter a name.")).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it("adds the person and opens their profile", async () => {
    create.mockResolvedValue({ employmentId: "emp-new", name: "Petra Nová" });
    const dialog = await openDialog();

    await userEvent.type(within(dialog).getByLabelText("Name"), " Petra Nová ");
    await userEvent.click(within(dialog).getByRole("radio", { name: /External worker/ }));
    await userEvent.type(within(dialog).getByLabelText("Job title"), "Cleaner");
    await userEvent.selectOptions(within(dialog).getByLabelText("Department"), "d-sales");
    await userEvent.selectOptions(within(dialog).getByLabelText("Reports to"), "emp-bob");
    await userEvent.type(within(dialog).getByLabelText("Email"), "petra@example.test");
    await userEvent.click(within(dialog).getByRole("button", { name: "Add person" }));

    expect(create).toHaveBeenCalledWith({
      name: "Petra Nová",
      type: "external",
      email: "petra@example.test",
      card: { jobTitle: "Cleaner", departmentId: "d-sales", reportsToEmploymentId: "emp-bob" },
    });
    expect(push).toHaveBeenCalledWith(
      "/directory/person?organizationId=org-1&employmentId=emp-new"
    );
  });

  it("shows the server's duplicate email inline and stays open", async () => {
    create.mockRejectedValue(conflict("EMPLOYMENT_EMAIL_TAKEN"));
    const dialog = await openDialog();

    await userEvent.type(within(dialog).getByLabelText("Name"), "Petra");
    await userEvent.type(within(dialog).getByLabelText("Email"), "petra@example.test");
    await userEvent.click(within(dialog).getByRole("button", { name: "Add person" }));

    expect(
      await within(dialog).findByText("Someone in the organization already uses this email.")
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
