import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import type { EmploymentListItem } from "@/lib/api/employment";
import { ApiError } from "@/lib/api/client";
import { EndEmploymentDialog } from "../end-employment-dialog";

const endEmployment = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  useEndEmployment: () => ({ mutateAsync: endEmployment, isPending: false }),
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
    <EndEmploymentDialog
      open
      onOpenChange={() => undefined}
      employment={deleted}
      organizationId="org-1"
      timeZone="Europe/Prague"
    />
  );
  return screen.getByRole("dialog");
};

const refusal = (code: string | undefined, message: string) =>
  new ApiError(409, message, undefined, [{ message, context: code ? { code } : {} }]);

describe("EndEmploymentDialog", () => {
  beforeEach(() => {
    endEmployment.mockReset();
    endEmployment.mockResolvedValue({ ...deleted, ended: true, cancelledBookings: 1 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ends the Employment on today's date in the organization's zone by default", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-25T23:30:00Z"));
    const dialog = renderDialog();

    expect(within(dialog).getByLabelText("Last day")).toHaveValue("2026-10-26");
    await userEvent.click(within(dialog).getByRole("button", { name: "End employment" }));

    expect(endEmployment).toHaveBeenCalledWith({ employmentId: "emp-del", endedOn: "2026-10-26" });
  });

  it("refuses a last day after today without asking the server", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-25T10:00:00Z"));
    const dialog = renderDialog();

    const date = within(dialog).getByLabelText("Last day");
    await userEvent.clear(date);
    await userEvent.type(date, "2026-10-26");
    await userEvent.click(within(dialog).getByRole("button", { name: "End employment" }));

    expect(endEmployment).not.toHaveBeenCalled();
    expect(within(dialog).getByText("The last day can't be after today.")).toBeInTheDocument();
  });

  it("says why when the person still manages a group", async () => {
    endEmployment.mockRejectedValue(refusal("MANAGES_GROUP", "This person manages a group"));
    const dialog = renderDialog();

    await userEvent.click(within(dialog).getByRole("button", { name: "End employment" }));

    expect(
      await within(dialog).findByText(
        "This person manages a group. Give the group another manager first."
      )
    ).toBeInTheDocument();
  });

  it("shows its own copy for an unknown refusal, never the server's message", async () => {
    endEmployment.mockRejectedValue(refusal(undefined, "Internal detail"));
    const dialog = renderDialog();

    await userEvent.click(within(dialog).getByRole("button", { name: "End employment" }));

    expect(await within(dialog).findByText("Could not end the employment")).toBeInTheDocument();
    expect(within(dialog).queryByText("Internal detail")).toBeNull();
  });
});
