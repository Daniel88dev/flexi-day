import { Suspense } from "react";
import { AiUsageScreen } from "@/components/ai-usage/ai-usage-screen";

export default function AiUsagePage() {
  return (
    <Suspense fallback={null}>
      <AiUsageScreen />
    </Suspense>
  );
}
