import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ChangeManager } from "../change-manager";
import { ApiError } from "@/lib/api/client";
import type { GroupDetail } from "@/lib/api/types";

const member = (userId: string, name: string, accountDeleted = false) => ({
  id: `gu-${userId}`,
  userId,
  groupId: "g-1",
  viewAccess: false,
  adminAccess: false,
  approverAccess: false,
  controlledUser: true,
  email: `${userId}@example.com`,
  accountDeleted,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  user: { id: userId, name, initials: name.slice(0, 2), avatarColor: "hsl(1 65% 50%)" },
});

const changeManager = vi.fn();
let membersData: ReturnType<typeof member>[];

vi.mock("@/lib/api/queries", () => ({
  useGroupUsers: () => ({ data: membersData, isLoading: false, error: null }),
  useUpdateGroupManager: () => ({ mutateAsync: changeManager, isPending: false }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u-dana" } }, isPending: false }),
}));

vi.mock("@/components/toast", () => ({ pushToast: vi.fn() }));

const group = (canChangeManager: boolean | undefined): GroupDetail =>
  ({
    id: "g-1",
    organizationId: "org-1",
    organization: null,
    groupName: "Support",
    managerUserId: "u-olga",
    managerName: "Olga Owner",
    access: { canView: true, canAdmin: true, viaOrgAdmin: true, isMember: true, canChangeManager },
  }) as GroupDetail;

describe("ChangeManager", () => {
  beforeEach(() => {
    changeManager.mockReset();
    changeManager.mockResolvedValue({});
    membersData = [
      member("u-olga", "Olga Owner"),
      member("u-dana", "Dana Delegate"),
      member("u-petra", "Petra Member"),
      member("u-martin", "Martin Manager", true),
    ];
  });

  it("renders nothing for someone who is not an org admin", () => {
    const { container } = render(<ChangeManager group={group(false)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing against a backend that does not send the flag", () => {
    const { container } = render(<ChangeManager group={group(undefined)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("offers live members other than the manager and the caller", () => {
    render(<ChangeManager group={group(true)} />);
    fireEvent.click(screen.getByRole("button", { name: "Change manager" }));

    expect(screen.getByText(/Olga Owner manages Support/)).toBeInTheDocument();
    const options = screen.getAllByRole("radio").map((radio) => radio.getAttribute("value"));
    expect(options).toEqual(["u-petra"]);
  });

  it("sends the pick", async () => {
    render(<ChangeManager group={group(true)} />);
    fireEvent.click(screen.getByRole("button", { name: "Change manager" }));
    fireEvent.click(screen.getByRole("radio", { name: /Petra Member/ }));
    fireEvent.click(screen.getByRole("button", { name: "Make manager" }));

    await waitFor(() =>
      expect(changeManager).toHaveBeenCalledWith({ groupId: "g-1", managerUserId: "u-petra" })
    );
  });

  it("says why the backend refused", async () => {
    changeManager.mockRejectedValue(
      new ApiError(422, "The new manager must be a member of the group", null, [
        { message: "x", context: { code: "NOT_A_MEMBER" } },
      ])
    );
    render(<ChangeManager group={group(true)} />);
    fireEvent.click(screen.getByRole("button", { name: "Change manager" }));
    fireEvent.click(screen.getByRole("radio", { name: /Petra Member/ }));
    fireEvent.click(screen.getByRole("button", { name: "Make manager" }));

    expect(await screen.findByText("That person is no longer in the group.")).toBeInTheDocument();
  });

  it("explains when nobody can take over", () => {
    membersData = [member("u-olga", "Olga Owner"), member("u-dana", "Dana Delegate")];
    render(<ChangeManager group={group(true)} />);
    fireEvent.click(screen.getByRole("button", { name: "Change manager" }));

    expect(screen.getByText(/Nobody else in the group can take over/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make manager" })).toBeDisabled();
  });
});
