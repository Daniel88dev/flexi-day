import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { useReportScope } from "@/lib/api/queries";
import { yearsInWindow, type MonthSlot } from "@/lib/report/series";

export type ReportWindowState = "pending" | "incomplete" | "ready";

export type ReportWindow<T> = {
  state: ReportWindowState;
  priorYear: number;
  prior: T | undefined;
};

// The report endpoints are year-scoped, so a window reaching into last year
// needs a second fetch. Drawn before it lands, last year's months read as zeros.
export function useReportWindow<T, TKey extends QueryKey>(
  slots: MonthSlot[],
  year: number,
  optionsForYear: (year: number) => UseQueryOptions<T, Error, T, TKey>
): ReportWindow<T> {
  const scopeQuery = useReportScope();

  const years = yearsInWindow(slots);
  const priorYear = years[0];
  const spansYears = years.length > 1;
  const needsPriorYear = priorYear !== year && (scopeQuery.data?.years ?? []).includes(priorYear);

  const options = optionsForYear(priorYear);
  const priorQuery = useQuery({
    ...options,
    enabled: needsPriorYear && options.enabled !== false,
  });

  // Not `priorQuery.data`: a disabled query still hands back whatever the cache
  // holds for its key, which is the very year the page already shows.
  const prior = needsPriorYear ? priorQuery.data : undefined;

  // A failed refetch keeps the cached scope, which still says which years to
  // fetch. Only a scope that never loaded leaves last year unknown.
  const scopeUnknown = scopeQuery.isError && !scopeQuery.data;

  let state: ReportWindowState = "ready";
  if (spansYears && (scopeQuery.isPending || (needsPriorYear && priorQuery.isPending))) {
    state = "pending";
  } else if ((needsPriorYear && priorQuery.isError) || (spansYears && scopeUnknown)) {
    state = "incomplete";
  }

  return { state, priorYear, prior };
}
