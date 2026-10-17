import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { BirthdaySettings } from "../birthday";
import { ApiError } from "../client";

const getMock = vi.fn();
const putMock = vi.fn();
const deleteMock = vi.fn();
vi.mock("../birthday", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../birthday")>()),
  getMyBirthday: () => getMock(),
  putMyBirthday: (input: unknown) => putMock(input),
  deleteMyBirthday: () => deleteMock(),
}));

import { qk, useMyBirthday, useRemoveMyBirthday, useSaveMyBirthday } from "../queries";

const SETTINGS: BirthdaySettings = {
  birthday: { month: 10, day: 25, year: 1987, shared: false },
  canShare: true,
  shareGroups: [{ groupId: "g1", groupName: "Platform" }],
};

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe("useMyBirthday", () => {
  beforeEach(() => getMock.mockReset());

  it("caches the birthday settings under their own key", async () => {
    getMock.mockResolvedValue(SETTINGS);
    const { client, wrapper } = setup();

    const { result } = renderHook(() => useMyBirthday(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(SETTINGS));
    expect(client.getQueryData(qk.myBirthday())).toEqual(SETTINGS);
  });
});

describe("useSaveMyBirthday", () => {
  beforeEach(() => putMock.mockReset());

  it("stores the answer and refreshes the birthdays on the calendar", async () => {
    const saved = { ...SETTINGS, birthday: { ...SETTINGS.birthday!, shared: true } };
    putMock.mockResolvedValue(saved);
    const { client, wrapper } = setup();
    client.setQueryData(["birthdays", 2026, 10, "mine"], []);

    const { result } = renderHook(() => useSaveMyBirthday(), { wrapper });
    await result.current.mutateAsync({ month: 10, day: 25, year: 1987, shared: true });

    expect(putMock).toHaveBeenCalledWith({ month: 10, day: 25, year: 1987, shared: true });
    expect(client.getQueryData(qk.myBirthday())).toEqual(saved);
    expect(client.getQueryState(["birthdays", 2026, 10, "mine"])?.isInvalidated).toBe(true);
  });
});

describe("useSaveMyBirthday on a 402", () => {
  it("reads the plan state again when sharing needs a paid group", async () => {
    const refused = new ApiError(402, "Plan required", undefined, [
      {
        message: "Plan required",
        context: { reason: "PLAN_LIMIT", code: "BIRTHDAY_SHARE_PLAN_REQUIRED" },
      },
    ]);
    putMock.mockImplementation(() => Promise.reject(refused));
    const { client, wrapper } = setup();
    client.setQueryData(qk.myBirthday(), SETTINGS);

    const { result } = renderHook(() => useSaveMyBirthday(), { wrapper });
    result.current.mutate({ month: 10, day: 25, year: 1987, shared: true });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(client.getQueryState(qk.myBirthday())?.isInvalidated).toBe(true);
  });
});

describe("useRemoveMyBirthday", () => {
  beforeEach(() => deleteMock.mockReset());

  it("refreshes the settings and the birthdays on the calendar", async () => {
    deleteMock.mockResolvedValue(undefined);
    const { client, wrapper } = setup();
    client.setQueryData(qk.myBirthday(), SETTINGS);
    client.setQueryData(["birthdays", 2026, 10, "g1"], []);

    const { result } = renderHook(() => useRemoveMyBirthday(), { wrapper });
    await result.current.mutateAsync();

    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(client.getQueryState(qk.myBirthday())?.isInvalidated).toBe(true);
    expect(client.getQueryState(["birthdays", 2026, 10, "g1"])?.isInvalidated).toBe(true);
  });
});
