import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { BirthdayCalendarRow } from "../birthdays";

const listMock = vi.fn();
vi.mock("../birthdays", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../birthdays")>()),
  listBirthdays: (...args: unknown[]) => listMock(...args),
}));

import { qk, useBirthdays } from "../queries";

const ROW: BirthdayCalendarRow = {
  userId: "u-petra",
  user: { id: "u-petra", name: "Petra Nová", initials: "PN", avatarColor: "hsl(0 0% 50%)" },
  date: "2026-10-12",
  month: 10,
  day: 12,
  year: 1992,
  age: 34,
};

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe("useBirthdays", () => {
  beforeEach(() => listMock.mockReset().mockResolvedValue([ROW]));

  it("reads the month's birthdays for the group under the birthdays prefix", async () => {
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useBirthdays({ year: 2026, month: 10, groupId: "g-1" }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listMock).toHaveBeenCalledWith({ year: 2026, month: 10, groupId: "g-1" });
    expect(client.getQueryData(["birthdays", 2026, 10, "g-1"])).toEqual([ROW]);
  });

  it("keys Mine scope apart from every group", () => {
    expect(qk.birthdays(2026, 10, null)).toEqual(["birthdays", 2026, 10, "mine"]);
    expect(qk.birthdays(2026, 10, "g-1")).not.toEqual(qk.birthdays(2026, 10, null));
  });
});
