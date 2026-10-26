import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type { DirectoryProfile } from "@/lib/api/directory";
import { WorkerTypeAction } from "../worker-type-action";

const changeType = vi.fn();
const toasts: string[] = [];

vi.mock("@/components/toast", () => ({
  pushToast: (message: string) => toasts.push(message),
}));

vi.mock("@/lib/api/queries", () => ({
  useChangeWorkerType: () => ({ mutateAsync: changeType, isPending: false }),
}));

const profile = (overrides: Partial<DirectoryProfile> = {}): DirectoryProfile => ({
  employmentId: "emp-erik",
  organizationId: "org-1",
  name: "Erik Worker",
  jobTitle: null,
  image: null,
  photoUrl: null,
  user: { id: "u-erik", name: "Erik Worker", initials: "EW", avatarColor: "hsl(1, 65%, 50%)" },
  markers: [],
  self: false,
  ended: false,
  canReadHistory: true,
  sections: {},
  actions: { end: true, export: true, erase: false, changeType: true },
  ...overrides,
});

describe("WorkerTypeAction", () => {
  beforeEach(() => {
    changeType.mockReset();
    changeType.mockResolvedValue({});
    toasts.length = 0;
  });

  it("names what turning an employee external clears, then sends the new type", async () => {
    renderWithClient(<WorkerTypeAction profile={profile()} />);
    await userEvent.click(screen.getByRole("button", { name: /change worker type/i }));
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByText(/make erik worker an external worker/i)).toBeInTheDocument();
    for (const field of ["Contract type", "Working time", "Probation end date", "Personal"]) {
      expect(within(dialog).getByText(field)).toBeInTheDocument();
    }
    expect(within(dialog).getByText(/can't clock in/i)).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole("button", { name: /make external worker/i }));

    expect(changeType).toHaveBeenCalledWith("external");
    expect(toasts).toEqual(["Erik Worker is now an external worker"]);
  });

  it("turns an External worker back into an employee and says nothing comes back", async () => {
    renderWithClient(<WorkerTypeAction profile={profile({ markers: ["EXTERNAL_WORKER"] })} />);
    await userEvent.click(screen.getByRole("button", { name: /change worker type/i }));
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByText(/start empty/i)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: /make employee/i }));

    expect(changeType).toHaveBeenCalledWith("employee");
  });

  it("shows the server's refusal in the dialog", async () => {
    changeType.mockRejectedValue(
      new ApiError(403, "denied", undefined, [
        { message: "denied", context: { code: "WORKER_TYPE_DENIED" } },
      ])
    );
    renderWithClient(<WorkerTypeAction profile={profile()} />);
    await userEvent.click(screen.getByRole("button", { name: /change worker type/i }));
    await userEvent.click(screen.getByRole("button", { name: /make external worker/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You can't change this person's worker type."
    );
  });
});
