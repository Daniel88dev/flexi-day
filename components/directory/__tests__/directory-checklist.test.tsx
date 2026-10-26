import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import type { DirectoryChecklist as Checklist } from "@/lib/api/directory";
import { DirectoryChecklist } from "../directory-checklist";

let checklist: Checklist | undefined;
const hide = vi.fn();

vi.mock("@/lib/api/queries", () => ({
  useDirectoryChecklist: () => ({ data: checklist }),
  useHideDirectoryChecklist: () => ({ mutate: hide, isPending: false }),
}));

const ownerChecklist = (overrides: Partial<Checklist> = {}): Checklist => ({
  hidden: false,
  items: [
    { key: "departments", done: true },
    { key: "locations", done: false },
    { key: "hr", done: false },
    { key: "jobTitles", done: false },
  ],
  reviewPermissions: true,
  ...overrides,
});

describe("DirectoryChecklist", () => {
  const openSettings = vi.fn();

  beforeEach(() => {
    checklist = ownerChecklist();
    hide.mockReset();
    openSettings.mockReset();
  });

  const renderChecklist = () =>
    renderWithClient(<DirectoryChecklist organizationId="org-1" onOpenSettings={openSettings} />);

  it("ticks each item as the data says", () => {
    renderChecklist();

    const list = screen.getByRole("region", { name: "Set up the directory" });
    expect(within(list).getByTestId("checklist-item-departments")).toHaveAttribute(
      "data-done",
      "true"
    );
    expect(within(list).getByTestId("checklist-item-locations")).toHaveAttribute(
      "data-done",
      "false"
    );
    expect(within(list).getByText("Assign HR")).toBeInTheDocument();
    expect(within(list).getAllByText("Done")).toHaveLength(1);
  });

  it("shows no HR item and no review link to anyone but the owner", () => {
    checklist = ownerChecklist({
      items: [
        { key: "departments", done: false },
        { key: "locations", done: false },
        { key: "jobTitles", done: false },
      ],
      reviewPermissions: false,
    });
    renderChecklist();

    expect(screen.queryByText("Assign HR")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Review who sees what" })).not.toBeInTheDocument();
  });

  it("opens the matching settings panel", async () => {
    renderChecklist();

    await userEvent.click(screen.getByRole("button", { name: "Add locations" }));
    await userEvent.click(screen.getByRole("button", { name: "Assign HR" }));
    await userEvent.click(screen.getByRole("button", { name: "Review who sees what" }));

    expect(openSettings.mock.calls).toEqual([["lists"], ["roles"], ["permissions"]]);
  });

  it("hides for the organization on Hide", async () => {
    renderChecklist();

    await userEvent.click(screen.getByRole("button", { name: "Hide" }));

    expect(hide).toHaveBeenCalled();
  });

  it("renders nothing once hidden", () => {
    checklist = ownerChecklist({ hidden: true });
    const { container } = renderChecklist();

    expect(container).toBeEmptyDOMElement();
  });
});
