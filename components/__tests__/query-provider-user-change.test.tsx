import { useEffect } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render } from "@testing-library/react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

type Session = { user: { id: string; email: string } } | null;

let session: Session = null;

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: session, isPending: false }),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { QueryProvider } from "@/components/query-provider";

const fetchOrganizations = vi.fn(async () => `organization of ${session?.user.id}`);

function Organizations() {
  const { data } = useQuery({ queryKey: ["organizations"], queryFn: fetchOrganizations });
  return <span>{data ?? "loading"}</span>;
}

const clients = new Set<QueryClient>();
function CaptureClient() {
  const client = useQueryClient();
  useEffect(() => {
    clients.add(client);
  }, [client]);
  return null;
}

function signIn(id: string) {
  session = { user: { id, email: `${id}@dev.local` } };
}

function App() {
  return (
    <QueryProvider>
      <CaptureClient />
      {session ? <Organizations /> : null}
    </QueryProvider>
  );
}

describe("QueryProvider", () => {
  beforeEach(() => {
    session = null;
    clients.clear();
    fetchOrganizations.mockClear();
  });

  it("does not serve the previous user's cached data after another user signs in", async () => {
    signIn("admin");
    const { findByText, queryByText, rerender } = render(<App />);
    await findByText("organization of admin");

    signIn("carol");
    rerender(<App />);

    expect(queryByText("organization of admin")).toBeNull();
    await findByText("organization of carol");
    expect(fetchOrganizations).toHaveBeenCalledTimes(2);
  });

  it("drops a response the previous user's request returns after the switch", async () => {
    let resolveAdmin: (value: string) => void = () => {};
    fetchOrganizations.mockImplementationOnce(
      () => new Promise<string>((resolve) => (resolveAdmin = resolve))
    );
    signIn("admin");
    const { findByText, queryByText, rerender } = render(<App />);

    signIn("carol");
    rerender(<App />);
    await findByText("organization of carol");

    await act(async () => resolveAdmin("organization of admin"));

    expect(queryByText("organization of admin")).toBeNull();
    for (const client of clients) {
      expect(client.getQueryData(["organizations"])).not.toBe("organization of admin");
    }
  });

  it("empties the query cache when the session ends", async () => {
    signIn("admin");
    const { findByText, rerender } = render(<App />);
    await findByText("organization of admin");

    session = null;
    rerender(<App />);

    expect(clients.size).toBeGreaterThan(0);
    for (const client of clients) {
      expect(client.getQueryCache().getAll()).toHaveLength(0);
    }
  });

  it("keeps the cache when the same user's session refreshes", async () => {
    signIn("admin");
    const { findByText, rerender } = render(<App />);
    await findByText("organization of admin");

    signIn("admin");
    rerender(<App />);

    await findByText("organization of admin");
    expect(fetchOrganizations).toHaveBeenCalledTimes(1);
  });
});
