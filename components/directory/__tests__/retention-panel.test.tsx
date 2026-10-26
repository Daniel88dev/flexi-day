import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithClient } from "@/lib/test-utils";
import type { RetentionPreview, RetentionSettings } from "@/lib/api/directory";
import { RetentionPanel } from "../retention-panel";

const updatePeriod = vi.fn();
let settings: RetentionSettings;
let preview: RetentionPreview | undefined;
const previewAsked: unknown[] = [];

vi.mock("@/lib/api/queries", () => ({
  useRetentionSettings: () => ({ data: settings, isLoading: false, error: null }),
  useUpdateRetentionPeriod: () => ({ mutate: updatePeriod, isPending: false, error: null }),
  useRetentionPreview: (_organizationId: string, input: unknown) => {
    previewAsked.push(input);
    return { data: input ? preview : undefined, isLoading: false, error: null };
  },
}));

const DEFAULTS: RetentionSettings["periods"] = {
  CARD: "UNTIL_ERASED",
  PHOTO: "YEAR_1",
  WORK_CONTACT: "DAYS_30",
  JOB: "UNTIL_ERASED",
  CONTACT: "DAYS_30",
  PERSONAL: "YEARS_3",
};

describe("RetentionPanel", () => {
  beforeEach(() => {
    updatePeriod.mockReset();
    previewAsked.length = 0;
    settings = { editable: true, periods: { ...DEFAULTS }, defaults: DEFAULTS };
    preview = { section: "PERSONAL", period: "DAYS_30", affected: 3 };
  });

  it("shows one period per Section with its default", () => {
    renderWithClient(<RetentionPanel organizationId="org-1" />);

    expect(screen.getByRole("combobox", { name: "Retention period for Personal" })).toHaveValue(
      "YEARS_3"
    );
    expect(screen.getByRole("combobox", { name: "Retention period for Photo" })).toHaveValue(
      "YEAR_1"
    );
    expect(screen.getAllByRole("combobox")).toHaveLength(6);
    expect(screen.getAllByText("Default: 30 days")).toHaveLength(2);
  });

  it("saves a longer period at once", async () => {
    const user = userEvent.setup();
    renderWithClient(<RetentionPanel organizationId="org-1" />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Retention period for Contact" }),
      "YEARS_5"
    );

    expect(updatePeriod).toHaveBeenCalledWith({ section: "CONTACT", period: "YEARS_5" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks before a shortening, naming how many people it removes, and saves only on confirm", async () => {
    const user = userEvent.setup();
    renderWithClient(<RetentionPanel organizationId="org-1" />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Retention period for Personal" }),
      "DAYS_30"
    );

    const dialog = await screen.findByRole("dialog");
    expect(previewAsked).toContainEqual({ section: "PERSONAL", period: "DAYS_30" });
    expect(within(dialog).getByText(/3 people/)).toBeInTheDocument();
    expect(updatePeriod).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Shorten" }));
    expect(updatePeriod).toHaveBeenCalledWith({ section: "PERSONAL", period: "DAYS_30" });
  });

  it("changes nothing when the shortening is cancelled", async () => {
    const user = userEvent.setup();
    renderWithClient(<RetentionPanel organizationId="org-1" />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Retention period for Personal" }),
      "AT_END"
    );
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancel" })
    );

    expect(updatePeriod).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox", { name: "Retention period for Personal" })).toHaveValue(
      "YEARS_3"
    );
  });

  it("shows HR the periods without a way to change them", () => {
    settings = { ...settings, editable: false };
    renderWithClient(<RetentionPanel organizationId="org-1" />);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText("Only the owner and org admins change retention.")).toBeInTheDocument();
    expect(screen.getAllByText("3 years").length).toBeGreaterThan(0);
  });
});
