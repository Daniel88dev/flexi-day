import type { Metadata } from "next";
import { Suspense } from "react";
import { JoinInvite } from "./join-invite";

// The URL carries the invite link secret, so no request or link from this page
// may send it on as a Referer.
export const metadata: Metadata = { referrer: "no-referrer" };

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinInvite />
    </Suspense>
  );
}
