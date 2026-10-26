import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type { DirectoryState } from "@/lib/api/directory";
import { DirectoryCard } from "../directory-card";

let state: DirectoryState | undefined;
const enable = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api/queries", () => ({
  useDirectoryState: () => ({ data: state, isLoading: false }),
  useEnableDirectory: () => ({ mutateAsync: enable, isPending: false }),
}));

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
});
