import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type { DirectoryOrganization, DirectoryProfile } from "@/lib/api/directory";
import { InviteAction } from "../invite-action";

const sendInvite = vi.fn();
const toasts: string[] = [];
let organizations: DirectoryOrganization[] = [];
const organizationCalls: (string | null | undefined)[] = [];

vi.mock("@/components/toast", () => ({
  pushToast: (message: string) => toasts.push(message),
}));

vi.mock("@/lib/api/queries", () => ({
  useSendDirectoryInvite: () => ({ mutateAsync: sendInvite, isPending: false }),
  useDirectoryOrganizations: () => ({ data: organizations }),
  useOrganization: (organizationId?: string | null) => {
    organizationCalls.push(organizationId);
    return {
      data: organizationId
        ? {
            groups: [
              { id: "g-support", groupName: "Support", members: 3, createdAt: "" },
              { id: "g-sales", groupName: "Sales", members: 2, createdAt: "" },
            ],
          }
        : undefined,
    };
  },
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

const profile = (overrides: Partial<DirectoryProfile> = {}): DirectoryProfile => ({
  employmentId: "emp-petra",
  organizationId: "org-1",
  name: "Petra Nová",
  jobTitle: null,
  image: null,
  photoUrl: null,
  user: { id: "emp-petra", name: "Petra Nová", initials: "PN", avatarColor: "hsl(1, 65%, 50%)" },
  markers: ["NO_ACCOUNT"],
  self: false,
  ended: false,
  canReadHistory: true,
  sections: {},
  account: { status: "NO_ACCOUNT", signInEmail: "petra@example.test", directoryRoles: [] },
  actions: { end: true, export: true, erase: true, invite: true },
  ...overrides,
});

const openDialog = async (name: RegExp = /^send invite$/i) => {
  await userEvent.click(screen.getByRole("button", { name }));
  return screen.getByRole("dialog");
};

describe("InviteAction", () => {
  beforeEach(() => {
    sendInvite.mockReset();
    sendInvite.mockResolvedValue({ invite: { email: "petra@example.test" }, emailDelivered: true });
    toasts.length = 0;
    organizations = [organization()];
    organizationCalls.length = 0;
  });

  it("sends the invite to the profile's email, with no group by default", async () => {
    renderWithClient(<InviteAction profile={profile()} />);
    const dialog = await openDialog();

    expect(within(dialog).getByText(/petra@example\.test/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: /^send invite$/i }));

    expect(sendInvite).toHaveBeenCalledWith(null);
    expect(toasts).toEqual(["Invite sent to petra@example.test"]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("lets an admin add the person to a group as well", async () => {
    renderWithClient(<InviteAction profile={profile()} />);
    const dialog = await openDialog();

    await userEvent.selectOptions(within(dialog).getByLabelText(/also add to a group/i), "Sales");
    await userEvent.click(within(dialog).getByRole("button", { name: /^send invite$/i }));

    expect(sendInvite).toHaveBeenCalledWith("g-sales");
  });

  it("offers no group to a sender who doesn't administer the organization", async () => {
    organizations = [organization({ role: "MEMBER" })];
    renderWithClient(<InviteAction profile={profile()} />);
    const dialog = await openDialog();

    expect(within(dialog).queryByLabelText(/also add to a group/i)).toBeNull();
    expect(organizationCalls.every((id) => !id)).toBe(true);
  });

  it("asks for an email first when the profile has none", async () => {
    renderWithClient(
      <InviteAction
        profile={profile({
          account: { status: "NO_ACCOUNT", signInEmail: null, directoryRoles: [] },
        })}
      />
    );
    const dialog = await openDialog();

    expect(
      within(dialog).getByText("Add an email to the profile before sending an invite.")
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Add email" })).toHaveAttribute(
      "href",
      "/directory/person/edit?organizationId=org-1&employmentId=emp-petra#record"
    );
    expect(within(dialog).queryByRole("button", { name: /^send invite$/i })).toBeNull();
  });

  it("is disabled on a lapsed plan and says why", () => {
    organizations = [organization({ writable: false })];
    renderWithClient(<InviteAction profile={profile()} />);

    expect(screen.getByRole("button", { name: /^send invite$/i })).toBeDisabled();
    expect(screen.getByText("Sending invites needs the Enterprise plan.")).toBeInTheDocument();
  });

  it("reads Send invite again once an invite is out, and warns the earlier one stops", async () => {
    renderWithClient(
      <InviteAction profile={profile({ markers: ["NO_ACCOUNT", "INVITE_SENT"] })} />
    );
    const dialog = await openDialog(/send invite again/i);

    expect(
      within(dialog).getByText("Sending again withdraws the earlier invite.")
    ).toBeInTheDocument();
  });

  it("says so when the email didn't go out", async () => {
    sendInvite.mockResolvedValue({
      invite: { email: "petra@example.test" },
      emailDelivered: false,
    });
    renderWithClient(<InviteAction profile={profile()} />);
    const dialog = await openDialog();

    await userEvent.click(within(dialog).getByRole("button", { name: /^send invite$/i }));

    expect(toasts).toEqual(["The invite was created, but the email didn't go out. Send it again."]);
  });

  it("shows the server's refusal and stays open", async () => {
    sendInvite.mockRejectedValue(
      new ApiError(422, "No email", {}, [{ message: "No email", context: { code: "NO_EMAIL" } }])
    );
    renderWithClient(<InviteAction profile={profile()} />);
    const dialog = await openDialog();

    await userEvent.click(within(dialog).getByRole("button", { name: /^send invite$/i }));

    expect(within(dialog).getByText("Add an email to the profile first.")).toBeInTheDocument();
  });
});
