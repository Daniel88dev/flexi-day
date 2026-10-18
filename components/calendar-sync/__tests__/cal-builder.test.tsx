import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { newBuilderConfig, type BuilderConfig } from "@/lib/calendar-sync/meta";
import type { CalendarSyncConfig, CalendarSyncInput } from "@/lib/api/calendar-sync";
import { CalBuilder, type MonthContext } from "../cal-builder";

const monthCtx: MonthContext = {
  year: 2026,
  month: 7,
  label: "July 2026",
  days: 31,
  firstWeekdayMondayIdx: 2,
};

function renderBuilder(overrides?: {
  onClose?: () => void;
  onSubmit?: (input: CalendarSyncInput) => Promise<CalendarSyncConfig>;
  initial?: BuilderConfig;
  isNew?: boolean;
}) {
  return render(
    <CalBuilder
      initial={overrides?.initial ?? newBuilderConfig()}
      isNew={overrides?.isNew ?? true}
      groups={[]}
      vacations={[]}
      currentUserId="u1"
      monthCtx={monthCtx}
      onClose={overrides?.onClose ?? vi.fn()}
      onSubmit={overrides?.onSubmit ?? vi.fn()}
    />
  );
}

describe("CalBuilder", () => {
  it("renders the new-calendar form with record types", () => {
    renderBuilder();
    expect(screen.getByText("New calendar")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/My time off/)).toBeInTheDocument();
    expect(screen.getByText("Vacation")).toBeInTheDocument();
  });

  it("blocks submit and shows a name error when the name is empty", () => {
    const onSubmit = vi.fn();
    renderBuilder({ onSubmit });
    fireEvent.click(screen.getByRole("button", { name: /Save & get link/ }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Give your calendar a name.")).toBeInTheDocument();
  });

  it("closes via Cancel", () => {
    const onClose = vi.fn();
    renderBuilder({ onClose });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });

  describe("the Birthdays row", () => {
    const saved = { id: "cfg-1", feedUrl: "https://x/calendars/t.ics" } as CalendarSyncConfig;

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("sits last in the record types, off, saying it carries only your own birthday", () => {
      renderBuilder();
      const birthdays = screen.getByRole("checkbox", { name: "Birthdays" });
      const boxes = screen.getAllByRole("checkbox");

      expect(boxes.at(-1)).toBe(birthdays);
      expect(birthdays).toHaveAttribute("aria-checked", "false");
      expect(screen.getByText("Only your own birthday")).toBeInTheDocument();
    });

    it("says what a team feed carries once the scope is the team", () => {
      renderBuilder();
      fireEvent.click(screen.getByRole("button", { name: /My team's records/ }));

      expect(
        screen.getByText(
          "Birthdays that members of the selected groups chose to share. Never with ages."
        )
      ).toBeInTheDocument();
      expect(screen.queryByText("Only your own birthday")).not.toBeInTheDocument();
    });

    it("saves a new feed that carries only birthdays, in the browser's zone", async () => {
      const real = Intl.DateTimeFormat.prototype.resolvedOptions;
      vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockImplementation(function (
        this: Intl.DateTimeFormat
      ) {
        return { ...real.call(this), timeZone: "Asia/Tokyo" };
      });
      const onSubmit = vi.fn<(input: CalendarSyncInput) => Promise<CalendarSyncConfig>>(() =>
        Promise.resolve(saved)
      );
      renderBuilder({ onSubmit });

      fireEvent.change(screen.getByLabelText("Calendar name"), { target: { value: "Cakes" } });
      for (const type of ["Vacation", "Paid Time Off", "Sick"]) {
        fireEvent.click(screen.getByRole("checkbox", { name: type }));
      }
      const row = screen.getByRole("checkbox", { name: "Birthdays" });
      fireEvent.click(row);
      expect(row).toHaveAttribute("aria-checked", "true");
      fireEvent.click(screen.getByRole("button", { name: /Save & get link/ }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0]![0]).toMatchObject({
        name: "Cakes",
        types: [],
        includeBirthdays: true,
        birthdaysColor: "coral",
        timeZone: "Asia/Tokyo",
      });
    });

    it("keeps the stored zone when an existing feed is saved", async () => {
      const onSubmit = vi.fn<(input: CalendarSyncInput) => Promise<CalendarSyncConfig>>(() =>
        Promise.resolve(saved)
      );
      renderBuilder({
        onSubmit,
        isNew: false,
        initial: { ...newBuilderConfig(), id: "cfg-1", name: "Mine", includeBirthdays: true },
      });

      fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0]![0]).toMatchObject({ includeBirthdays: true });
      expect(onSubmit.mock.calls[0]![0]).not.toHaveProperty("timeZone");
    });

    it("still asks for something to carry when every row is off", () => {
      const onSubmit = vi.fn();
      renderBuilder({ onSubmit });
      fireEvent.change(screen.getByLabelText("Calendar name"), { target: { value: "Empty" } });
      for (const type of ["Vacation", "Paid Time Off", "Sick"]) {
        fireEvent.click(screen.getByRole("checkbox", { name: type }));
      }

      fireEvent.click(screen.getByRole("button", { name: /Save & get link/ }));

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
