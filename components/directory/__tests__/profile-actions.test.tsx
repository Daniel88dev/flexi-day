import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import type { DirectoryProfile, EndPreview } from "@/lib/api/directory";
import type { PersonExport } from "@/lib/api/person-export";
import { ProfileActions } from "../profile-actions";

let preview: { data?: EndPreview; error: unknown; isLoading: boolean };
const previewCalls: boolean[] = [];
const endEmployment = vi.fn();
const push = vi.fn();
let requestedExports: PersonExport[] = [];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/api/queries", () => ({
  useEndPreview: (_organizationId: string, _employmentId: string, enabled: boolean) => {
    previewCalls.push(enabled);
    return enabled ? preview : { data: undefined, error: null, isLoading: false };
  },
  useEndEmployment: () => ({ mutateAsync: endEmployment, isPending: false }),
  useEraseEmployment: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRequestedExports: () => ({ data: requestedExports }),
  useRequestPersonExport: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
  useChangeWorkerType: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const profile = (overrides: Partial<DirectoryProfile> = {}): DirectoryProfile => ({
  employmentId: "emp-jana",
  organizationId: "org-1",
  name: "Jana Member",
  jobTitle: null,
  image: null,
  photoUrl: null,
  user: { id: "u-jana", name: "Jana Member", initials: "JM", avatarColor: "hsl(10, 65%, 50%)" },
  markers: [],
  self: false,
  ended: false,
  canReadHistory: true,
  sections: {},
  actions: { end: true, export: false, erase: false },
  ...overrides,
});

const endPreview = (overrides: Partial<EndPreview> = {}): EndPreview => ({
  employmentId: "emp-jana",
  today: "2026-10-26",
  startedOn: "2024-01-01",
  suggestedEndedOn: "2026-10-20",
  reportees: [
    { employmentId: "emp-bob", name: "Bob Plain" },
    { employmentId: "emp-mia", name: "Mia Sales" },
  ],
  groups: [
    { id: "g-1", name: "Support" },
    { id: "g-2", name: "Sales" },
  ],
  managedGroups: [],
  cancelledBookings: 3,
  organizationAdmin: true,
  directoryRoles: ["HR"],
  ...overrides,
});

const openEnd = async (name = /end employment/i) => {
  await userEvent.click(screen.getByRole("button", { name }));
  return screen.getByRole("dialog");
};

describe("ProfileActions", () => {
  beforeEach(() => {
    preview = { data: endPreview(), error: null, isLoading: false };
    previewCalls.length = 0;
    endEmployment.mockReset();
    requestedExports = [];
    endEmployment.mockResolvedValue({});
  });

  it("finds a person without an account's export by their Employment", () => {
    requestedExports = [
      {
        id: "x-other",
        organizationId: "org-1",
        scope: "PERSON",
        subjectUserId: "u-someone",
        subjectEmploymentId: null,
        status: "READY",
        createdAt: "2026-10-26T08:00:00.000Z",
        readyAt: "2026-10-26T08:01:00.000Z",
        expiresAt: "2026-11-02T08:01:00.000Z",
      },
      {
        id: "x-petra",
        organizationId: "org-1",
        scope: "PERSON",
        subjectUserId: null,
        subjectEmploymentId: "emp-petra",
        status: "READY",
        createdAt: "2026-10-26T08:00:00.000Z",
        readyAt: "2026-10-26T08:01:00.000Z",
        expiresAt: "2026-11-02T08:01:00.000Z",
      },
    ];
    renderWithClient(
      <ProfileActions
        profile={profile({
          employmentId: "emp-petra",
          name: "Petra Nová",
          user: {
            id: "emp-petra",
            name: "Petra Nová",
            initials: "PN",
            avatarColor: "hsl(1, 65%, 50%)",
          },
          markers: ["NO_ACCOUNT"],
          actions: { end: true, export: true, erase: true },
        })}
      />
    );

    expect(
      screen.getByRole("button", { name: "Download Petra Nová's export" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /erase/i })).toBeInTheDocument();
  });

  it("offers only the actions the profile allows", () => {
    renderWithClient(
      <ProfileActions profile={profile({ actions: { end: false, export: true, erase: true } })} />
    );

    expect(screen.queryByRole("button", { name: /end employment/i })).toBeNull();
    expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /erase/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /change worker type/i })).toBeNull();
  });

  it("offers Change worker type when the act allows it", () => {
    renderWithClient(
      <ProfileActions
        profile={profile({
          actions: { end: false, export: false, erase: false, changeType: true },
        })}
      />
    );

    expect(screen.getByRole("button", { name: /change worker type/i })).toBeInTheDocument();
  });

  it("asks for the End preview only once the dialog opens", async () => {
    renderWithClient(<ProfileActions profile={profile()} />);
    expect(previewCalls.every((enabled) => !enabled)).toBe(true);

    await openEnd();

    expect(previewCalls.at(-1)).toBe(true);
  });

  it("fills the date from the Leaving date and lists who loses Reports to and what happens", async () => {
    renderWithClient(<ProfileActions profile={profile()} />);
    const dialog = await openEnd();

    expect(within(dialog).getByLabelText(/last day/i)).toHaveValue("2026-10-20");
    expect(within(dialog).getByLabelText(/last day/i)).toHaveAttribute("max", "2026-10-26");
    const reportees = within(dialog).getByRole("list", { name: /reports to is cleared/i });
    expect(
      within(reportees)
        .getAllByRole("listitem")
        .map((item) => item.textContent)
    ).toEqual(["Bob Plain", "Mia Sales"]);
    const effects = within(dialog).getByRole("list", { name: /what happens/i });
    expect(
      within(effects)
        .getAllByRole("listitem")
        .map((item) => item.textContent)
    ).toEqual([
      "Leaves Support, Sales",
      "3 booked days are cancelled",
      "Their org admin access ends",
      "Their directory roles end: HR",
    ]);
  });

  it("names the Sections End removes because their retention is at end", async () => {
    preview = {
      data: endPreview({ atEndSections: ["PHOTO", "CONTACT"] }),
      error: null,
      isLoading: false,
    };
    renderWithClient(<ProfileActions profile={profile()} />);
    const dialog = await openEnd();

    const effects = within(dialog).getByRole("list", { name: /what happens/i });
    expect(
      within(effects).getByText("Removed now, as their retention is at end: Photo, Contact")
    ).toBeInTheDocument();
  });

  it("refuses a last day after today without asking the server", async () => {
    renderWithClient(<ProfileActions profile={profile()} />);
    const dialog = await openEnd();
    const date = within(dialog).getByLabelText(/last day/i);
    await userEvent.clear(date);
    await userEvent.type(date, "2026-10-27");

    await userEvent.click(within(dialog).getByRole("button", { name: /^end employment$/i }));

    expect(within(dialog).getByText("The last day can't be after today.")).toBeInTheDocument();
    expect(endEmployment).not.toHaveBeenCalled();
  });

  it("blocks while the person manages a group", async () => {
    preview = {
      data: endPreview({ managedGroups: [{ id: "g-1", name: "Support" }] }),
      error: null,
      isLoading: false,
    };
    renderWithClient(<ProfileActions profile={profile()} />);
    const dialog = await openEnd();

    expect(
      within(dialog).getByText("They manage Support. Give each group another manager first.")
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /^end employment$/i })).toBeDisabled();
  });

  it("ends on the chosen day", async () => {
    renderWithClient(<ProfileActions profile={profile()} />);
    const dialog = await openEnd();

    await userEvent.click(within(dialog).getByRole("button", { name: /^end employment$/i }));

    expect(endEmployment).toHaveBeenCalledWith({ employmentId: "emp-jana", endedOn: "2026-10-20" });
  });

  it("reads End engagement for an External worker", async () => {
    renderWithClient(<ProfileActions profile={profile({ markers: ["EXTERNAL_WORKER"] })} />);
    const dialog = await openEnd(/end engagement/i);

    expect(within(dialog).getByRole("heading")).toHaveTextContent("End Jana Member's engagement");
    expect(within(dialog).getByRole("button", { name: /^end engagement$/i })).toBeInTheDocument();
  });
});
