"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MyAttendanceScreen } from "@/components/attendance/my-attendance-screen";
import { LINKED_DATE_PARAM } from "@/lib/attendance/linked-day";

function MyAttendanceFromUrl() {
  const date = useSearchParams().get(LINKED_DATE_PARAM);
  // Keyed so a second link followed from this same page (the bell) opens its day.
  return <MyAttendanceScreen key={date ?? ""} linkedDate={date} />;
}

export default function MyAttendancePage() {
  return (
    <Suspense fallback={null}>
      <MyAttendanceFromUrl />
    </Suspense>
  );
}
