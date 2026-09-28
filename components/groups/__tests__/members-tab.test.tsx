import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { MembersTab } from "../members-tab";
import { renderWithClient } from "@/lib/test-utils";
import { I18nContext } from "@/lib/i18n/i18n-provider";
import { dictionaries } from "@/lib/i18n";

const member = (userId: string, name: string, adminAccess: boolean) => ({
  id: `gu-${userId}`,
  userId,
  groupId: "g-1",
  viewAccess: true,
  adminAccess,
  approverAccess: false,
  controlledUser: true,
  email: `${userId}@example.com`,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  user: { id: userId, name, initials: name.slice(0, 2), avatarColor: "hsl(1 65% 50%)" },
});

let groupData: { managerUserId: string; organizationId: string } | undefined;

vi.mock("@/lib/api/queries", () => ({
  useGroupUsers: () => ({
    data: [member("u-owner", "Olga Owner", false), member("u-dana", "Dana Holt", true)],
    isLoading: false,
    error: null,
  }),
  useGroup: () => ({ data: groupData }),
  useSubscription: () => ({ data: undefined }),
  useUpdateGroupUsers: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveGroupUser: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const rowOf = (name: string) => screen.getByText(name).closest("tr")!;

describe("MembersTab", () => {
  beforeEach(() => {
    groupData = { managerUserId: "u-owner", organizationId: "org-1" };
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
});
