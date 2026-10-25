import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { MembersTab } from "../members-tab";
import { renderWithClient } from "@/lib/test-utils";
import { I18nContext } from "@/lib/i18n/i18n-provider";
import { dictionaries } from "@/lib/i18n";
import { ApiError } from "@/lib/api/client";

const member = (userId: string, name: string, adminAccess: boolean) => ({
  id: `gu-${userId}`,
  userId,
  groupId: "g-1",
  viewAccess: true,
  adminAccess,
  approverAccess: false,
  controlledUser: true,
  email: `${userId}@example.com`,
  accountDeleted: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  user: { id: userId, name, initials: name.slice(0, 2), avatarColor: "hsl(1 65% 50%)" },
});

let groupData: { managerUserId: string; organizationId: string } | undefined;
let membersData: ReturnType<typeof member>[];
const refetchMembers = vi.fn();
const updateMembers = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  useGroupUsers: () => ({
    data: membersData,
    isLoading: false,
    error: null,
    refetch: refetchMembers,
  }),
  useGroup: () => ({ data: groupData }),
  useSubscription: () => ({ data: undefined }),
  useUpdateGroupUsers: () => ({ mutateAsync: updateMembers, isPending: false }),
  useRemoveGroupUser: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const rowOf = (name: string) => screen.getByText(name).closest("tr")!;

const cellOf = (name: string, column: number) =>
  within(rowOf(name)).getAllByRole("cell")[column] as HTMLElement;
const VIEW = 1;
const APPROVER = 3;
const toggleCell = (name: string, column: number) =>
  fireEvent.click(within(cellOf(name, column)).getByRole("button"));

describe("MembersTab", () => {
  beforeEach(() => {
    groupData = { managerUserId: "u-owner", organizationId: "org-1" };
    membersData = [member("u-owner", "Olga Owner", false), member("u-dana", "Dana Holt", true)];
  });

  it("explains each permission and the manager's implicit rights to non-admins", () => {
    renderWithClient(<MembersTab groupId="g-1" isAdmin={false} />);

    const legend = within(screen.getByRole("region", { name: "What the permissions mean" }));
    expect(legend.getByText("View")).toBeInTheDocument();
    expect(legend.getByText(/sees everyone's time off in this group/i)).toBeInTheDocument();
    expect(legend.getByText("Admin")).toBeInTheDocument();
    expect(legend.getByText(/manages members and permissions/i)).toBeInTheDocument();
    expect(legend.getByText("Approver")).toBeInTheDocument();
    expect(legend.getByText(/approves or rejects members' leave requests/i)).toBeInTheDocument();
    expect(legend.getByText("Tracked")).toBeInTheDocument();
    expect(legend.getByText(/can book leave in this group/i)).toBeInTheDocument();
    expect(
      legend.getByText(/group manager always has admin and approver rights/i)
    ).toBeInTheDocument();
  });

  it("labels a member who deleted their account and hides the placeholder address", () => {
    membersData = [
      member("u-owner", "Olga Owner", false),
      {
        ...member("u-jana", "Jana Nováková", false),
        email: "u-jana@deleted.invalid",
        accountDeleted: true,
      },
    ];
    renderWithClient(<MembersTab groupId="g-1" isAdmin />);

    const row = within(rowOf("Jana Nováková"));
    expect(row.getByText("Account deleted")).toBeInTheDocument();
    expect(row.queryByText("u-jana@deleted.invalid")).not.toBeInTheDocument();
    expect(within(rowOf("Olga Owner")).queryByText("Account deleted")).not.toBeInTheDocument();
  });

  it("offers no permission toggles for a Deleted account while editing", () => {
    membersData = [
      member("u-owner", "Olga Owner", false),
      { ...member("u-jana", "Jana Nováková", false), accountDeleted: true },
    ];
    renderWithClient(<MembersTab groupId="g-1" isAdmin />);

    fireEvent.click(screen.getByRole("button", { name: "Edit permissions" }));

    expect(within(rowOf("Jana Nováková")).queryAllByRole("button")).toHaveLength(0);
    expect(within(rowOf("Olga Owner")).getAllByRole("button")).toHaveLength(4);
  });

  it("places the legend below the members table", () => {
    renderWithClient(<MembersTab groupId="g-1" isAdmin={false} />);

    const table = screen.getByRole("table");
    const legend = screen.getByRole("region", { name: "What the permissions mean" });
    expect(table.compareDocumentPosition(legend) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps the legend visible while an admin edits permissions", () => {
    renderWithClient(<MembersTab groupId="g-1" isAdmin />);

    fireEvent.click(screen.getByRole("button", { name: "Edit permissions" }));

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "What the permissions mean" })).toBeInTheDocument();
  });

  it("marks only the manager's row", () => {
    renderWithClient(<MembersTab groupId="g-1" isAdmin={false} />);

    expect(within(rowOf("Olga Owner")).getByText("Manager")).toBeInTheDocument();
    expect(within(rowOf("Dana Holt")).queryByText("Manager")).toBeNull();
  });

  it("marks no row while the group is still loading", () => {
    groupData = undefined;
    renderWithClient(<MembersTab groupId="g-1" isAdmin={false} />);

    expect(screen.queryByText("Manager")).toBeNull();
  });

  it("renders the legend and marker in Czech", () => {
    renderWithClient(
      <I18nContext
        value={{ locale: "cs", setLocale: () => {}, t: dictionaries.cs, localeReady: true }}
      >
        <MembersTab groupId="g-1" isAdmin={false} />
      </I18nContext>
    );

    const legend = within(screen.getByRole("region", { name: "Co znamenají oprávnění" }));
    expect(legend.getByText("Sledován")).toBeInTheDocument();
    expect(legend.getByText(/může v této skupině zadávat volno/i)).toBeInTheDocument();
    expect(within(rowOf("Olga Owner")).getByText("Manažer")).toBeInTheDocument();
  });

  describe("permission editor", () => {
    const milo = () => ({ ...member("u-milo", "Milo Grant", false), viewAccess: false });
    const nora = () => member("u-nora", "Nora Lind", false);
    const dana = () => member("u-dana", "Dana Holt", true);
    const olga = () => member("u-owner", "Olga Owner", false);
    const leaves = (...userIds: string[]) => {
      membersData = membersData.filter((m) => !userIds.includes(m.userId));
    };
    const noraLeaves = () => leaves("u-nora");

    const openEditor = (name = "Edit permissions") =>
      fireEvent.click(screen.getByRole("button", { name }));
    const clickSave = (name = "Save") => fireEvent.click(screen.getByRole("button", { name }));
    const editorClosed = () =>
      waitFor(() =>
        expect(screen.getByRole("button", { name: "Edit permissions" })).toBeInTheDocument()
      );

    beforeEach(() => {
      membersData = [olga(), dana(), milo(), nora()];
      refetchMembers.mockReset();
      refetchMembers.mockImplementation(async () => ({ data: membersData, error: null }));
      updateMembers.mockReset();
      updateMembers.mockResolvedValue({ message: "ok" });
    });

    it("sends only the toggled member, on top of the current server values", async () => {
      renderWithClient(<MembersTab groupId="g-1" isAdmin />);
      openEditor();

      // A co-admin turns Milo's view and approver on, turns Dana's view off and removes Nora.
      membersData = [
        olga(),
        { ...dana(), viewAccess: false },
        { ...milo(), viewAccess: true, approverAccess: true },
      ];
      toggleCell("Dana Holt", APPROVER);
      clickSave();

      await waitFor(() => expect(updateMembers).toHaveBeenCalledTimes(1));
      expect(updateMembers).toHaveBeenCalledWith({
        groupId: "g-1",
        data: [
          {
            userId: "u-dana",
            viewAccess: false,
            adminAccess: true,
            approverAccess: true,
            controlledUser: true,
          },
        ],
      });
      await editorClosed();
    });

    it("sends nothing and closes the editor when every toggle was undone", async () => {
      renderWithClient(<MembersTab groupId="g-1" isAdmin />);
      openEditor();

      toggleCell("Milo Grant", VIEW);
      toggleCell("Milo Grant", VIEW);
      clickSave();

      await editorClosed();
      expect(updateMembers).not.toHaveBeenCalled();
    });

    it("undoes a toggle against the value it started from, keeping a co-admin's change", async () => {
      renderWithClient(<MembersTab groupId="g-1" isAdmin />);
      openEditor();
      toggleCell("Milo Grant", VIEW);

      // The co-admin sets the same field to the value the admin had picked.
      membersData = [olga(), dana(), { ...milo(), viewAccess: true }, nora()];
      toggleCell("Milo Grant", VIEW);

      expect(within(cellOf("Milo Grant", VIEW)).getByRole("button")).toHaveTextContent("Yes");
      clickSave();

      await editorClosed();
      expect(updateMembers).not.toHaveBeenCalled();
    });

    it("shows the live member list while editing, so a removed member drops out", () => {
      renderWithClient(<MembersTab groupId="g-1" isAdmin />);
      openEditor();
      expect(screen.getByText("4 members")).toBeInTheDocument();

      noraLeaves();
      toggleCell("Milo Grant", VIEW);

      expect(screen.queryByText("Nora Lind")).toBeNull();
      expect(screen.getByText("3 members")).toBeInTheDocument();
      expect(within(cellOf("Milo Grant", VIEW)).getByRole("button")).toHaveTextContent("Yes");
    });

    it("names a changed member who left before saving and keeps the other toggles", async () => {
      renderWithClient(<MembersTab groupId="g-1" isAdmin />);
      openEditor();
      toggleCell("Nora Lind", APPROVER);
      toggleCell("Milo Grant", VIEW);

      noraLeaves();
      clickSave();

      expect(await screen.findByText(/Nora Lind is no longer in this group/)).toBeInTheDocument();
      expect(updateMembers).not.toHaveBeenCalled();
      expect(within(cellOf("Milo Grant", VIEW)).getByRole("button")).toHaveTextContent("Yes");

      clickSave();

      await waitFor(() => expect(updateMembers).toHaveBeenCalledTimes(1));
      expect(updateMembers.mock.calls[0][0].data).toEqual([
        expect.objectContaining({ userId: "u-milo", viewAccess: true }),
      ]);
    });

    it("names every changed member who left", async () => {
      renderWithClient(<MembersTab groupId="g-1" isAdmin />);
      openEditor();
      toggleCell("Nora Lind", APPROVER);
      toggleCell("Milo Grant", VIEW);

      leaves("u-nora", "u-milo");
      clickSave();

      expect(
        await screen.findByText(
          "Nora Lind, Milo Grant are no longer in this group, so their permission changes were not saved."
        )
      ).toBeInTheDocument();
    });

    it("names the member when the save is refused because they left meanwhile", async () => {
      updateMembers.mockImplementationOnce(async () => {
        noraLeaves();
        throw new ApiError(400, "Failed to update group user permissions");
      });
      renderWithClient(<MembersTab groupId="g-1" isAdmin />);
      openEditor();
      toggleCell("Nora Lind", APPROVER);
      toggleCell("Milo Grant", VIEW);
      clickSave();

      expect(await screen.findByText(/Nora Lind is no longer in this group/)).toBeInTheDocument();
      expect(screen.queryByText("Failed to update group user permissions")).toBeNull();
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();

      clickSave();

      await waitFor(() => expect(updateMembers).toHaveBeenCalledTimes(2));
      expect(updateMembers.mock.calls[1][0].data).toEqual([
        expect.objectContaining({ userId: "u-milo", viewAccess: true }),
      ]);
    });

    it("shows the translated failure, not the raw error, when the list cannot be refetched", async () => {
      refetchMembers.mockResolvedValueOnce({ data: undefined, error: new Error("Network down") });
      renderWithClient(<MembersTab groupId="g-1" isAdmin />);
      openEditor();
      toggleCell("Milo Grant", VIEW);
      clickSave();

      expect(await screen.findByText("Save failed")).toBeInTheDocument();
      expect(screen.queryByText("Network down")).toBeNull();
      expect(updateMembers).not.toHaveBeenCalled();
    });

    it("locks the editor while saving and starts one save per click burst", async () => {
      let finishRefetch!: () => void;
      refetchMembers.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishRefetch = () => resolve({ data: membersData, error: null });
          })
      );
      renderWithClient(<MembersTab groupId="g-1" isAdmin />);
      openEditor();
      toggleCell("Milo Grant", VIEW);

      const save = screen.getByRole("button", { name: "Save" });
      fireEvent.click(save);
      fireEvent.click(save);

      await waitFor(() =>
        expect(within(cellOf("Dana Holt", VIEW)).getByRole("button")).toBeDisabled()
      );
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

      finishRefetch();
      await editorClosed();
      expect(refetchMembers).toHaveBeenCalledTimes(1);
      expect(updateMembers).toHaveBeenCalledTimes(1);
    });

    describe("in Czech", () => {
      const renderCs = () =>
        renderWithClient(
          <I18nContext
            value={{ locale: "cs", setLocale: () => {}, t: dictionaries.cs, localeReady: true }}
          >
            <MembersTab groupId="g-1" isAdmin />
          </I18nContext>
        );

      it("names the departed member", async () => {
        renderCs();
        openEditor("Upravit oprávnění");
        toggleCell("Nora Lind", APPROVER);

        noraLeaves();
        clickSave("Uložit");

        expect(
          await screen.findByText("Nora Lind už není členem skupiny, změny oprávnění se neuložily.")
        ).toBeInTheDocument();
      });

      it("names every departed member", async () => {
        renderCs();
        openEditor("Upravit oprávnění");
        toggleCell("Nora Lind", APPROVER);
        toggleCell("Milo Grant", VIEW);

        leaves("u-nora", "u-milo");
        clickSave("Uložit");

        expect(
          await screen.findByText(
            "Nora Lind, Milo Grant už nejsou členy skupiny, změny jejich oprávnění se neuložily."
          )
        ).toBeInTheDocument();
      });
    });
  });
});
