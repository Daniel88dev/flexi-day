import { Suspense } from "react";
import { DirectoryScreen } from "@/components/directory/directory-screen";

export default function DirectoryPage() {
  return (
    <Suspense fallback={null}>
      <DirectoryScreen />
    </Suspense>
  );
}
