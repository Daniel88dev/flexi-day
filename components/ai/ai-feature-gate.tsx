"use client";

import type { ReactNode } from "react";
import { isAiFeatureAvailable, type AiFeature } from "@/lib/api/ai-features";
import { useAiAvailability } from "@/lib/api/queries";

/**
 * Renders an Assistant or AI connections entry point only while the feature is
 * available (any of them, given several): in `organizationId`, or in any of the
 * caller's organizations when none is named. Nothing while loading or on error.
 */
export function AiFeatureGate({
  feature,
  organizationId,
  children,
}: {
  feature: AiFeature | AiFeature[];
  organizationId?: string;
  children: ReactNode;
}) {
  const { data } = useAiAvailability();
  const features = Array.isArray(feature) ? feature : [feature];
  return features.some((f) => isAiFeatureAvailable(data, f, organizationId)) ? children : null;
}
