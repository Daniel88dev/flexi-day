import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import * as Sentry from "@sentry/nextjs";
import { QueryProvider } from "@/components/query-provider";
import { ApiError } from "@/lib/api/client";

function FailingQuery({ error }: { error: Error }) {
  const { isError } = useQuery({
    queryKey: ["vacations", "2026"],
    queryFn: () => Promise.reject(error),
    retry: false,
  });
  return <span>{isError ? "failed" : "loading"}</span>;
}

describe("QueryProvider error reporting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards an unexpected failure to Sentry", async () => {
    const error = new ApiError(500, "Internal Server Error");
    const { findByText } = render(
      <QueryProvider>
        <FailingQuery error={error} />
      </QueryProvider>
    );

    await findByText("failed");
    await waitFor(() => expect(Sentry.captureException).toHaveBeenCalledTimes(1));
    expect(vi.mocked(Sentry.captureException).mock.calls[0][0]).toBe(error);
  });

  it("stays quiet on a 401, which the AuthGuard already handles", async () => {
    const { findByText } = render(
      <QueryProvider>
        <FailingQuery error={new ApiError(401, "Unauthorized")} />
      </QueryProvider>
    );

    await findByText("failed");
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
