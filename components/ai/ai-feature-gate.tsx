"use client";

import type { ReactNode } from "react";
import { isAiFeatureAvailable, type AiFeature } from "@/lib/api/ai-features";
import { useAiAvailability } from "@/lib/api/queries";

/**
 * Renders an Assistant or AI connections entry point only while the feature is
 * available: in `organizationId`, or in any of the caller's organizations when
 * none is named. Nothing while loading or on error.
 */
export function AiFeatureGate({
  feature,
  organizationId,
  children,
}: {
  feature: AiFeature;
  organizationId?: string;
  children: ReactNode;
}) {
  const { data } = useAiAvailability();
  return isAiFeatureAvailable(data, feature, organizationId) ? children : null;
}
