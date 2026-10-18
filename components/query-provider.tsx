"use client";

import { Fragment, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { reportQueryError } from "@/lib/observability/report-query-error";
import { shouldRetryQuery } from "@/lib/api/retry";

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => reportQueryError(error, "query", query.queryKey),
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) =>
        reportQueryError(error, "mutation", mutation.options.mutationKey),
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
      },
    },
  });
}

type UserCache = {
  userId: string | null;
  generation: number;
  client: QueryClient;
  retired: QueryClient | null;
};

// The cache belongs to one signed-in user. When the session's user changes or ends, the subtree
// remounts on a fresh client in the same render, so no screen ever paints the previous user's data.
// A first sign-in keeps the client: nothing cached while signed out belongs to anyone.
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const userId = session?.user.id ?? null;

  const [cache, setCache] = useState<UserCache>(() => ({
    userId,
    generation: 0,
    client: createQueryClient(),
    retired: null,
  }));

  if (!isPending && userId !== cache.userId) {
    setCache(
      cache.userId === null
        ? { ...cache, userId }
        : {
            userId,
            generation: cache.generation + 1,
            client: createQueryClient(),
            retired: cache.client,
          }
    );
  }

  useEffect(() => {
    cache.retired?.clear();
  }, [cache.retired]);

  return (
    <QueryClientProvider client={cache.client}>
      <Fragment key={cache.generation}>{children}</Fragment>
    </QueryClientProvider>
  );
}
