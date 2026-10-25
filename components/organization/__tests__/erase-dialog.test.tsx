import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import type { EmploymentListItem } from "@/lib/api/employment";
import { ApiError } from "@/lib/api/client";
import { EraseDialog } from "../erase-dialog";

const eraseEmployment = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  useEraseEmployment: () => ({ mutateAsync: eraseEmployment, isPending: false }),
}));

const deleted: EmploymentListItem = {
  id: "emp-del",
  userId: "user-del",
  email: "user-del@deleted.invalid",
  startedAt: "2026-01-05T08:00:00Z",
  endedAt: null,
  ended: false,
  requiredMinutesPerDay: null,
  accountDeletedAt: "2026-10-20T08:00:00Z",
  accountDeleted: true,
  user: { id: "user-del", name: "Jana Nováková", initials: "JN", avatarColor: "hsl(9 9% 9%)" },
};

const renderDialog = () => {
  renderWithClient(
    <EraseDialog open onOpenChange={() => undefined} employment={deleted} organizationId="org-1" />
  );
  return screen.getByRole("dialog");
};

const typeAndConfirm = async (dialog: HTMLElement, name: string) => {
  await userEvent.type(within(dialog).getByLabelText("Type Jana Nováková to confirm"), name);
  await userEvent.click(within(dialog).getByRole("button", { name: "Erase for good" }));
};

const refusal = (code: string | undefined, message: string) =>
  new ApiError(422, message, undefined, [{ message, context: code ? { code } : {} }]);

describe("EraseDialog", () => {
  beforeEach(() => {
    eraseEmployment.mockReset();
    eraseEmployment.mockResolvedValue(undefined);
  });

  it("says an open Employment ends today first", () => {
    const dialog = renderDialog();

    expect(within(dialog).getByText(/ends today first/)).toBeInTheDocument();
  });

  it("refuses a name that isn't the person's without asking the server", async () => {
    const dialog = renderDialog();

    await typeAndConfirm(dialog, "Jana Novak");

    expect(eraseEmployment).not.toHaveBeenCalled();
    expect(within(dialog).getByText("That isn't the name on this row.")).toBeInTheDocument();
  });

  it("erases once the typed name matches, whatever its case", async () => {
    const dialog = renderDialog();

    await typeAndConfirm(dialog, " jana  nováková");

    expect(eraseEmployment).toHaveBeenCalledWith({
      employmentId: "emp-del",
      confirmName: " jana  nováková",
    });
  });

  it("says so when the server finds the name wrong", async () => {
    eraseEmployment.mockRejectedValue(refusal("NAME_MISMATCH", "The typed name does not match"));
    const dialog = renderDialog();

    await typeAndConfirm(dialog, "Jana Nováková");

    expect(await within(dialog).findByText("That isn't the name on this row.")).toBeInTheDocument();
  });

  it("shows its own copy for an unknown refusal, never the server's message", async () => {
    eraseEmployment.mockRejectedValue(refusal(undefined, "Internal detail"));
    const dialog = renderDialog();

    await typeAndConfirm(dialog, "Jana Nováková");

    expect(await within(dialog).findByText("Could not erase the records")).toBeInTheDocument();
    expect(within(dialog).queryByText("Internal detail")).toBeNull();
  });
});
