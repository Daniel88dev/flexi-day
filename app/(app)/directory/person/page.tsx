import { Suspense } from "react";
import { ProfileScreen } from "@/components/directory/profile-screen";

export default function DirectoryProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileScreen />
    </Suspense>
  );
}
