import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import { ApiError } from "@/lib/api/client";
import type { DirectoryOrganization, DirectoryProfile, PreviousSpell } from "@/lib/api/directory";
import { CopyPreviousSpellBanner } from "../copy-previous-spell";

const copyFrom = vi.fn();
const toasts: string[] = [];
let previous: { data?: PreviousSpell; error?: unknown } = {};
const previousEnabled: boolean[] = [];

vi.mock("@/components/toast", () => ({
  pushToast: (message: string) => toasts.push(message),
}));

vi.mock("@/lib/api/queries", () => ({
  usePreviousSpell: (_org: string, _emp: string, enabled: boolean) => {
    previousEnabled.push(enabled);
    return previous;
  },
  useCopyFromPreviousSpell: () => ({ mutateAsync: copyFrom, isPending: false }),
}));

const profile = (overrides: Partial<DirectoryProfile> = {}): DirectoryProfile => ({
  employmentId: "emp-jana-2",
  organizationId: "org-1",
  name: "Jana Novak",
  jobTitle: null,
  image: null,
  photoUrl: null,
  user: { id: "u-jana", name: "Jana Novak", initials: "JN", avatarColor: "hsl(1, 65%, 50%)" },
  markers: [],
  self: false,
  ended: false,
  canReadHistory: true,
  sections: {},
  actions: { end: true, export: true, erase: false, copyFromPreviousSpell: true },
  ...overrides,
});

const organization = (writable = true): DirectoryOrganization => ({
  organizationId: "org-1",
  name: "Acme",
  role: "OWNER",
  enabled: true,
  writable,
  newAgreementVersionReady: false,
});

const spell = (sections: PreviousSpell["sections"]): PreviousSpell => ({
  previous: {
    employmentId: "emp-jana-1",
    startedAt: "2024-02-03T08:00:00.000Z",
    endedAt: "2025-06-30T15:00:00.000Z",
  },
  sections,
});

describe("CopyPreviousSpellBanner", () => {
  beforeEach(() => {
    copyFrom.mockReset();
    copyFrom.mockResolvedValue({});
    toasts.length = 0;
    previousEnabled.length = 0;
    previous = {
      data: spell({
        contact: { status: "REMOVED_ON", date: "2025-07-31" },
        personal: { status: "COPYABLE" },
        photo: { status: "COPYABLE" },
      }),
    };
  });

  it("shows nothing without the action", () => {
    renderWithClient(
      <CopyPreviousSpellBanner
        profile={profile({ actions: { end: true, export: true, erase: false } })}
        organization={organization()}
      />
    );
    expect(screen.queryByTestId("copy-previous-spell")).not.toBeInTheDocument();
    expect(previousEnabled).toEqual([]);
  });

  it("offers a checkbox per Section, names what retention removed, and copies only the ticked ones", async () => {
    renderWithClient(<CopyPreviousSpellBanner profile={profile()} organization={organization()} />);
    const banner = screen.getByTestId("copy-previous-spell");
    expect(within(banner).getByText(/worked here before/i)).toBeInTheDocument();

    await userEvent.click(
      within(banner).getByRole("button", { name: /copy from previous spell/i })
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/card, work contact and job never carry over/i)).toBeVisible();

    const contact = within(dialog).getByRole("checkbox", { name: "Contact" });
    expect(contact).toBeDisabled();
    expect(within(dialog).getByText(/removed by retention on/i)).toBeInTheDocument();
    const copyButton = within(dialog).getByRole("button", { name: /^copy$/i });
    expect(copyButton).toBeDisabled();

    await userEvent.click(within(dialog).getByRole("checkbox", { name: "Profile photo" }));
    await userEvent.click(copyButton);

    expect(copyFrom).toHaveBeenCalledWith(["photo"]);
    expect(toasts).toEqual(["Copied to Jana Novak's profile"]);
  });

  it("leaves Personal out for an External worker's spell and shows sections already filled", async () => {
    previous = {
      data: spell({ contact: { status: "FILLED" }, photo: { status: "EMPTY" } }),
    };
    renderWithClient(<CopyPreviousSpellBanner profile={profile()} organization={organization()} />);
    await userEvent.click(screen.getByRole("button", { name: /copy from previous spell/i }));
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).queryByRole("checkbox", { name: "Personal" })).not.toBeInTheDocument();
    expect(within(dialog).getByText("Already filled on this spell")).toBeInTheDocument();
    expect(within(dialog).getByText("Nothing held")).toBeInTheDocument();
    expect(within(dialog).getByRole("checkbox", { name: "Contact" })).toBeDisabled();
  });

  it("disables the copy on a lapsed plan and says why", () => {
    renderWithClient(
      <CopyPreviousSpellBanner profile={profile()} organization={organization(false)} />
    );
    expect(screen.getByRole("button", { name: /copy from previous spell/i })).toBeDisabled();
    expect(screen.getByText(/copying needs the enterprise plan/i)).toBeInTheDocument();
  });

  it("shows the server's refusal in the dialog", async () => {
    copyFrom.mockRejectedValue(
      new ApiError(409, "held", undefined, [
        { message: "held", context: { code: "SECTION_NOT_HELD" } },
      ])
    );
    renderWithClient(<CopyPreviousSpellBanner profile={profile()} organization={organization()} />);
    await userEvent.click(screen.getByRole("button", { name: /copy from previous spell/i }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Personal" }));
    await userEvent.click(screen.getByRole("button", { name: /^copy$/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/no longer holds/i);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
