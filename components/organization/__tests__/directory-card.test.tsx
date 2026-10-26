import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type { DirectoryState } from "@/lib/api/directory";
import type { EmploymentListItem } from "@/lib/api/employment";
import { DirectoryCard } from "../directory-card";

let state: DirectoryState | undefined;
let employments: EmploymentListItem[] = [];
const enable = vi.fn();
const disable = vi.fn();
const deleteAll = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api/queries", () => ({
  useDirectoryState: () => ({ data: state, isLoading: false }),
  useEnableDirectory: () => ({ mutateAsync: enable, isPending: false }),
  useDisableDirectory: () => ({ mutateAsync: disable, isPending: false }),
  useDeleteAllDirectoryData: () => ({ mutateAsync: deleteAll, isPending: false }),
  useEmployments: () => ({ data: employments, isPending: false, error: null }),
}));

const employment = (
  name: string,
  overrides: Partial<EmploymentListItem> = {}
): EmploymentListItem => ({
  id: `emp-${name}`,
  userId: `user-${name}`,
  email: `${name.toLowerCase()}@example.test`,
  startedAt: "2026-01-05T08:00:00Z",
  endedAt: null,
  ended: false,
  requiredMinutesPerDay: null,
  accountDeletedAt: null,
  accountDeleted: false,
  user: { id: `user-${name}`, name, initials: name.slice(0, 2), avatarColor: "#000" },
  ...overrides,
});

const directory = (overrides: Partial<DirectoryState> = {}): DirectoryState => ({
  organizationId: "org-1",
  isOwner: true,
  enabled: false,
  enabledAt: null,
  disabledAt: null,
  writable: true,
  agreement: {
    currentVersion: 1,
    acceptedVersion: null,
    acceptedAt: null,
    acceptedByName: null,
    newVersionReady: false,
  },
  people: { open: 15, former: 2 },
  ...overrides,
});

describe("DirectoryCard", () => {
  beforeEach(() => {
    state = directory();
    enable.mockReset();
    enable.mockResolvedValue(directory({ enabled: true }));
    push.mockReset();
    disable.mockReset();
    disable.mockResolvedValue(directory());
    deleteAll.mockReset();
    deleteAll.mockResolvedValue(directory());
    employments = [];
  });

  it("lets the owner turn it on only after accepting the agreement", async () => {
    renderWithClient(<DirectoryCard organizationId="org-1" organizationName="Acme" />);

    await userEvent.click(screen.getByRole("button", { name: "Turn on" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/15 people will appear in the directory/)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Read the directory agreement" })
    ).toHaveAttribute("href", "/directory-agreement");

    const confirm = within(dialog).getByRole("button", { name: "Accept and turn on" });
    expect(confirm).toBeDisabled();
    await userEvent.click(within(dialog).getByLabelText("I accept this agreement for Acme"));
    await userEvent.click(confirm);

    expect(enable).toHaveBeenCalledWith(1);
    expect(push).toHaveBeenCalledWith("/directory");
  });

  it("explains a changed agreement instead of the raw error", async () => {
    enable.mockRejectedValue(
      new ApiError(409, "stale", {}, [
        { message: "stale", context: { code: "AGREEMENT_VERSION_STALE" } },
      ])
    );
    renderWithClient(<DirectoryCard organizationId="org-1" organizationName="Acme" />);

    await userEvent.click(screen.getByRole("button", { name: "Turn on" }));
    await userEvent.click(screen.getByLabelText("I accept this agreement for Acme"));
    await userEvent.click(screen.getByRole("button", { name: "Accept and turn on" }));

    expect(await screen.findByText(/The agreement has changed/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("offers the owner on Pro the plans instead of a working switch", () => {
    state = directory({ writable: false });
    renderWithClient(<DirectoryCard organizationId="org-1" organizationName="Acme" />);

    expect(screen.getByRole("button", { name: "Turn on" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/billing");
  });

  it("tells an org admin the owner has to turn it on", () => {
    state = directory({ isOwner: false });
    renderWithClient(<DirectoryCard organizationId="org-1" organizationName="Acme" />);

    expect(screen.queryByRole("button", { name: "Turn on" })).not.toBeInTheDocument();
    expect(screen.getByText("Only the owner can turn the directory on.")).toBeInTheDocument();
  });

  it("shows when it went on and who accepted which version", () => {
    state = directory({
      enabled: true,
      enabledAt: "2026-09-02T10:00:00Z",
      agreement: {
        currentVersion: 1,
        acceptedVersion: 1,
        acceptedAt: "2026-09-02T10:00:00Z",
        acceptedByName: "Richard Kolář",
        newVersionReady: false,
      },
    });
    renderWithClient(<DirectoryCard organizationId="org-1" organizationName="Acme" />);

    expect(screen.getByText("On")).toBeInTheDocument();
    expect(screen.getByText(/Agreement version 1, accepted by Richard Kolář/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the directory" })).toHaveAttribute(
      "href",
      "/directory"
    );
  });

  describe("turning it off", () => {
    const on = (overrides: Partial<DirectoryState> = {}) =>
      directory({ enabled: true, enabledAt: "2026-09-02T10:00:00Z", ...overrides });

    it("lists who no link holds and turns off without ending anyone", async () => {
      state = on();
      employments = [
        employment("Bob"),
        employment("Ivan", { noLink: true }),
        employment("Petra", { userId: null, noLink: true }),
        employment("Eva", { userId: null, noLink: true, type: "external" }),
        employment("Olga", { noLink: true, ended: true, endedAt: "2026-10-01T10:00:00Z" }),
      ];
      renderWithClient(<DirectoryCard organizationId="org-1" organizationName="Acme" />);

      await userEvent.click(screen.getByRole("button", { name: "Turn off" }));
      const dialog = screen.getByRole("dialog");
      expect(
        within(dialog).getByText(
          "3 people belong to no group and stay employed until you end them."
        )
      ).toBeInTheDocument();
      const listed = within(
        within(dialog).getByRole("list", { name: /belong to no group/ })
      ).getAllByRole("listitem");
      expect(listed.map((item) => item.textContent)).toEqual([
        "Ivan",
        "PetraNo account",
        "EvaNo accountExternal worker",
      ]);
      expect(
        within(dialog).getByRole("link", { name: "Review them on the People card" })
      ).toHaveAttribute("href", "#people");
      expect(within(dialog).getByText(/Directory invites that name no group/)).toBeInTheDocument();

      await userEvent.click(within(dialog).getByRole("button", { name: "Turn off" }));
      expect(disable).toHaveBeenCalled();
    });

    it("leaves the list out when every open Employment has a link", async () => {
      state = on();
      employments = [employment("Bob")];
      renderWithClient(<DirectoryCard organizationId="org-1" organizationName="Acme" />);

      await userEvent.click(screen.getByRole("button", { name: "Turn off" }));
      expect(
        within(screen.getByRole("dialog")).queryByRole("list", { name: /no group/ })
      ).toBeNull();
    });

    it("is the owner's alone", () => {
      state = on({ isOwner: false });
      renderWithClient(<DirectoryCard organizationId="org-1" organizationName="Acme" />);

      expect(screen.queryByRole("button", { name: "Turn off" })).toBeNull();
    });
  });

  describe("Delete all directory data", () => {
    const off = (overrides: Partial<DirectoryState> = {}) =>
      directory({
        enabledAt: "2026-09-02T10:00:00Z",
        disabledAt: "2026-10-20T10:00:00Z",
        ...overrides,
      });

    it("asks for the organization's name before deleting", async () => {
      state = off();
      renderWithClient(<DirectoryCard organizationId="org-1" organizationName="Acme s.r.o." />);

      await userEvent.click(screen.getByRole("button", { name: "Delete all directory data" }));
      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText(/every person without an account/)).toBeInTheDocument();
      expect(
        within(dialog).getByText(/People with an account keep their employment/)
      ).toBeInTheDocument();
      const confirm = within(dialog).getByRole("button", { name: "Delete all directory data" });
      expect(confirm).toBeDisabled();

      const input = within(dialog).getByLabelText("Type Acme s.r.o. to confirm");
      await userEvent.type(input, "Acme");
      await userEvent.click(confirm);
      expect(within(dialog).getByText("That is not the organization's name.")).toBeInTheDocument();
      expect(deleteAll).not.toHaveBeenCalled();

      await userEvent.clear(input);
      await userEvent.type(input, "acme S.R.O.");
      await userEvent.click(confirm);
      expect(deleteAll).toHaveBeenCalledWith("acme S.R.O.");
    });

    it("explains a refusal in words", async () => {
      state = off();
      deleteAll.mockRejectedValue(
        new ApiError(409, "on", {}, [{ message: "on", context: { code: "DIRECTORY_ON" } }])
      );
      renderWithClient(<DirectoryCard organizationId="org-1" organizationName="Acme" />);

      await userEvent.click(screen.getByRole("button", { name: "Delete all directory data" }));
      await userEvent.type(screen.getByLabelText("Type Acme to confirm"), "Acme");
      await userEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "Delete all directory data",
        })
      );

      expect(await screen.findByText("Turn the directory off first.")).toBeInTheDocument();
    });

    it("says when the data was deleted instead of offering it again", () => {
      state = off({ dataDeletedAt: "2026-10-21T10:00:00Z" });
      renderWithClient(<DirectoryCard organizationId="org-1" organizationName="Acme" />);

      expect(screen.queryByRole("button", { name: "Delete all directory data" })).toBeNull();
      expect(screen.getByText(/Directory data deleted on/)).toBeInTheDocument();
    });

    it("is not offered where the directory was never on, or to an org admin", () => {
      state = directory();
      const { unmount } = renderWithClient(
        <DirectoryCard organizationId="org-1" organizationName="Acme" />
      );
      expect(screen.queryByRole("button", { name: "Delete all directory data" })).toBeNull();
      unmount();

      state = off({ isOwner: false });
      renderWithClient(<DirectoryCard organizationId="org-1" organizationName="Acme" />);
      expect(screen.queryByRole("button", { name: "Delete all directory data" })).toBeNull();
    });
  });
});
