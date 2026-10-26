import { Suspense } from "react";
import { OrganizationScreen } from "@/components/organization/organization-screen";

export default function OrganizationPage() {
  return (
    <Suspense fallback={null}>
      <OrganizationScreen />
    </Suspense>
  );
}
