import { Suspense } from "react";
import { ProfileEditScreen } from "@/components/directory/profile-edit-screen";

export default function DirectoryProfileEditPage() {
  return (
    <Suspense fallback={null}>
      <ProfileEditScreen />
    </Suspense>
  );
}
