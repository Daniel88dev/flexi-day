"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAiUsage, getAiUsageWeek, revokeAiConnection } from "./ai-usage";
import { qk } from "./queries";

export const aiUsageKeys = {
  usage: (organizationId: string | null) => ["ai-usage", organizationId] as const,
  week: (organizationId: string, weekStart: string) =>
    ["ai-usage", organizationId, "week", weekStart] as const,
};

export function useAiUsage(organizationId: string | null) {
  return useQuery({
    queryKey: aiUsageKeys.usage(organizationId),
    queryFn: () => getAiUsage(organizationId!),
    enabled: !!organizationId,
  });
}

export function useAiUsageWeek(organizationId: string, weekStart: string, enabled: boolean) {
  return useQuery({
    queryKey: aiUsageKeys.week(organizationId, weekStart),
    queryFn: () => getAiUsageWeek(organizationId, weekStart),
    enabled,
  });
}

export function useRevokeAiConnection(organizationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (grantId: string) => revokeAiConnection(organizationId, grantId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: aiUsageKeys.usage(organizationId) });
      void qc.invalidateQueries({ queryKey: qk.aiSettings(organizationId) });
      void qc.invalidateQueries({ queryKey: qk.myAiConnections() });
    },
  });
}
