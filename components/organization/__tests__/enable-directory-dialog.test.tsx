import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import type { DirectoryState } from "@/lib/api/directory";
import { EnableDirectoryDialog } from "../enable-directory-dialog";

const enable = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/api/queries", () => ({
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

const renderDialog = (state: DirectoryState) =>
  renderWithClient(
    <EnableDirectoryDialog open onOpenChange={vi.fn()} state={state} organizationName="Acme" />
  );

describe("EnableDirectoryDialog", () => {
  beforeEach(() => {
    enable.mockReset();
    enable.mockResolvedValue(directory({ enabled: true }));
  });

  it("ticks Tell members at the first enable and sends it", async () => {
    renderDialog(directory());

    expect(screen.getByLabelText("Tell members")).toBeChecked();
    await userEvent.click(screen.getByLabelText("I accept this agreement for Acme"));
    await userEvent.click(screen.getByRole("button", { name: "Accept and turn on" }));

    expect(enable).toHaveBeenCalledWith({ agreementVersion: 1, tellMembers: true });
  });

  it("leaves Tell members off at a later enable", async () => {
    renderDialog(
      directory({ enabledAt: "2026-05-01T08:00:00Z", disabledAt: "2026-06-01T08:00:00Z" })
    );

    expect(screen.getByLabelText("Tell members")).not.toBeChecked();
    await userEvent.click(screen.getByLabelText("I accept this agreement for Acme"));
    await userEvent.click(screen.getByRole("button", { name: "Accept and turn on" }));

    expect(enable).toHaveBeenCalledWith({ agreementVersion: 1, tellMembers: false });
  });

  it("sends what the owner chose", async () => {
    renderDialog(directory());

    await userEvent.click(screen.getByLabelText("Tell members"));
    await userEvent.click(screen.getByLabelText("I accept this agreement for Acme"));
    await userEvent.click(screen.getByRole("button", { name: "Accept and turn on" }));

    expect(enable).toHaveBeenCalledWith({ agreementVersion: 1, tellMembers: false });
  });
});
