import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const cancelVacationsMock = vi.fn();
vi.mock("../vacations", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../vacations")>()),
  cancelVacations: (...args: unknown[]) => cancelVacationsMock(...args),
}));

import { useCancelVacations } from "../queries";
import { ApiError } from "../client";

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useCancelVacations(), { wrapper });
  return { invalidate, result };
}

describe("useCancelVacations", () => {
  beforeEach(() => {
    cancelVacationsMock.mockReset();
  });

  it("refetches the vacation views after a successful cancel", async () => {
    cancelVacationsMock.mockResolvedValue({ message: "ok" });
    const { invalidate, result } = setup();

    result.current.mutate({ ids: ["v-1"] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["vacations"] });
  });

  it("refetches anyway when the cancel lost the race — the rows really are cancelled", async () => {
    cancelVacationsMock.mockRejectedValue(
      new ApiError(409, "One or more of these requests has already been cancelled")
    );
    const { invalidate, result } = setup();

    result.current.mutate({ ids: ["v-1"] });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["vacations"] });
  });

  it("leaves the cache alone when the cancel failed for any other reason", async () => {
    cancelVacationsMock.mockRejectedValue(new ApiError(500, "Failed to cancel vacation"));
    const { invalidate, result } = setup();

    result.current.mutate({ ids: ["v-1"] });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidate).not.toHaveBeenCalled();
  });
});
