import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BirthdayCard } from "../birthday-card";
import { ToastHost } from "@/components/toast";
import { ApiError } from "@/lib/api/client";
import type { BirthdaySettings, MyBirthday } from "@/lib/api/birthday";
import { renderWithClient } from "@/lib/test-utils";

const getMock = vi.fn<() => Promise<BirthdaySettings>>();
const putMock = vi.fn<(input: MyBirthday) => Promise<BirthdaySettings>>();
const deleteMock = vi.fn<() => Promise<void>>();

vi.mock("@/lib/api/birthday", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/birthday")>()),
  getMyBirthday: () => getMock(),
  putMyBirthday: (input: MyBirthday) => putMock(input),
  deleteMyBirthday: () => deleteMock(),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { name: "Olivia Owner", email: "owner@dev.local" } } }),
}));

const PLATFORM = { groupId: "g1", groupName: "Platform" };
const SUPPORT = { groupId: "g2", groupName: "Support Prague" };

function settings(patch: Partial<BirthdaySettings> = {}): BirthdaySettings {
  return {
    birthday: { month: 10, day: 25, year: 1987, shared: false },
    canShare: true,
    shareGroups: [PLATFORM, SUPPORT],
    ...patch,
  };
}

/** Answers every PUT as the backend does: the stored body plus the plan fields. */
function echoPut(base: BirthdaySettings) {
  putMock.mockImplementation((input) => Promise.resolve({ ...base, birthday: input }));
}

function panel() {
  return within(screen.getByRole("complementary", { name: "What others see" }));
}

function section(name: string) {
  return within(panel().getByText(name).closest("div") as HTMLElement);
}

async function pick(label: string, option: string) {
  await userEvent.click(screen.getByRole("combobox", { name: label }));
  await userEvent.click(await screen.findByRole("option", { name: option }));
}

function renderCard() {
  return renderWithClient(
    <>
      <BirthdayCard />
      <ToastHost />
    </>
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 18, 12));
  getMock.mockReset();
  putMock.mockReset();
  deleteMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("BirthdayCard", () => {
  it("shows the stored birthday and what each audience sees", async () => {
    getMock.mockResolvedValue(settings());
    renderCard();

    expect(await panel().findByText("You turn 39")).toBeInTheDocument();
    for (const group of ["Group calendar: Platform", "Group calendar: Support Prague"]) {
      expect(section(group).getByText("Olivia turns 39").closest("del")).not.toBeNull();
    }
    expect(
      section("Team calendar feeds").getByText("Olivia's birthday").closest("del")
    ).not.toBeNull();
    expect(panel().getByText("Never")).toBeInTheDocument();
  });

  it("follows the form before saving, then saves once", async () => {
    const base = settings();
    getMock.mockResolvedValue(base);
    echoPut(base);
    renderCard();

    const share = await screen.findByRole("switch", { name: "Share my birthday with my groups" });
    await userEvent.click(share);

    const group = section("Group calendar: Platform");
    expect(group.getByText("Olivia turns 39").closest("del")).toBeNull();
    expect(
      section("Group calendar: Support Prague").getByText("Olivia turns 39").closest("del")
    ).toBeNull();
    expect(section("Team calendar feeds").getByText("Olivia's birthday").closest("del")).toBeNull();

    await pick("Day", "3");
    expect(panel().getByText("You turn 40")).toBeInTheDocument();
    expect(group.getByText("Olivia turns 40")).toBeInTheDocument();
    expect(putMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(putMock).toHaveBeenCalledTimes(1));
    expect(putMock).toHaveBeenCalledWith({ month: 10, day: 3, year: 1987, shared: true });
    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("replaces the switch with the notice when no group is paid or lapsed, and still saves", async () => {
    const base = settings({ birthday: null, canShare: false, shareGroups: [] });
    getMock.mockResolvedValue(base);
    echoPut(base);
    renderCard();

    expect(await screen.findByText(/None of your groups is on a paid plan/)).toBeInTheDocument();
    expect(screen.queryByRole("switch")).toBeNull();
    expect(panel().getByText("Nothing yet")).toBeInTheDocument();

    await pick("Month", "February");
    await pick("Day", "29");
    expect(
      screen.getByText("In years without 29 February, it shows on 28 February.")
    ).toBeInTheDocument();
    expect(panel().getByText("Your birthday")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(putMock).toHaveBeenCalledWith({ month: 2, day: 29, year: null, shared: false })
    );
  });

  it("shows the notice to someone who never shared once every group lapsed", async () => {
    getMock.mockResolvedValue(settings({ canShare: false, shareGroups: [PLATFORM] }));
    renderCard();

    await panel().findByText("You turn 39");
    expect(screen.getByText(/None of your groups is on a paid plan/)).toBeInTheDocument();
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.queryByText(/Your groups are no longer on Pro or Enterprise/)).toBeNull();
    expect(
      section("Group calendar: Platform").getByText("Olivia turns 39").closest("del")
    ).not.toBeNull();
  });

  it("lets a share outlive a lapse only until it is turned off", async () => {
    const base = settings({
      birthday: { month: 10, day: 25, year: 1987, shared: true },
      canShare: false,
      shareGroups: [PLATFORM],
    });
    getMock.mockResolvedValue(base);
    echoPut(base);
    renderCard();

    const share = await screen.findByRole("switch", { name: "Share my birthday with my groups" });
    expect(share).toBeChecked();
    expect(share).toBeEnabled();
    expect(screen.getByText(/Your groups are no longer on Pro or Enterprise/)).toBeInTheDocument();
    expect(
      section("Group calendar: Platform").getByText("Olivia turns 39").closest("del")
    ).toBeNull();

    await userEvent.click(share);

    expect(share).not.toBeChecked();
    expect(share).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(putMock).toHaveBeenCalledWith({ month: 10, day: 25, year: 1987, shared: false })
    );
    expect(await screen.findByText(/None of your groups is on a paid plan/)).toBeInTheDocument();
    expect(screen.queryByRole("switch")).toBeNull();
  });

  it("drops the age from the panel and the save when the year is removed", async () => {
    const base = settings({ birthday: { month: 10, day: 25, year: 1987, shared: true } });
    getMock.mockResolvedValue(base);
    echoPut(base);
    renderCard();

    await panel().findByText("You turn 39");
    await userEvent.clear(screen.getByLabelText(/Year/));

    expect(panel().queryByText(/39/)).toBeNull();
    expect(panel().getByText("Your birthday")).toBeInTheDocument();
    expect(section("Group calendar: Platform").getByText("Olivia's birthday")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(putMock).toHaveBeenCalledWith({ month: 10, day: 25, year: null, shared: true })
    );
    await screen.findByText("Saved");
    expect(panel().queryByText(/39/)).toBeNull();
    expect(screen.getByLabelText(/Year/)).toHaveValue("");
  });

  it("refuses a year outside 1900 to this year", async () => {
    getMock.mockResolvedValue(settings());
    renderCard();

    await panel().findByText("You turn 39");
    const year = screen.getByLabelText(/Year/);
    await userEvent.clear(year);
    await userEvent.type(year, "2030");

    expect(screen.getByText("Enter a year from 1900 to 2026.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("explains a 402 with the lapsed line", async () => {
    getMock.mockResolvedValue(settings());
    const refused = new ApiError(402, "Plan required", undefined, [
      {
        message: "Plan required",
        context: { reason: "PLAN_LIMIT", code: "BIRTHDAY_SHARE_PLAN_REQUIRED" },
      },
    ]);
    putMock.mockImplementation(() => Promise.reject(refused));
    renderCard();

    await userEvent.click(
      await screen.findByRole("switch", { name: "Share my birthday with my groups" })
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(/Your groups are no longer on Pro or Enterprise/)
    ).toBeInTheDocument();
    expect(putMock).toHaveBeenCalledTimes(1);
  });

  it("removes the birthday", async () => {
    getMock.mockResolvedValue(settings());
    deleteMock.mockResolvedValue(undefined);
    renderCard();

    await userEvent.click(await screen.findByRole("button", { name: "Remove birthday" }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledTimes(1));
  });
});
