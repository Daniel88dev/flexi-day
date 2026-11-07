"use client";

// PROTOTYPE (T-680): variant C's AI usage page. Never merged.

import { Suspense } from "react";
import { AiPrototypeSwitcher, AiUsagePageC } from "@/components/ai-settings/prototype/variants";

export default function AiUsagePrototypePage() {
  return (
    <Suspense fallback={null}>
      <AiUsagePageC />
      <AiPrototypeSwitcher />
    </Suspense>
  );
}
