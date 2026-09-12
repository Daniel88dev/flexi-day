"use client";

import type { AttendanceSession, AttendanceSessionEnd } from "@/lib/api/attendance";
import { formatAccuracy, formatCoordinates, locationOf } from "@/lib/attendance/location";
import { useTranslation } from "@/lib/i18n/use-translation";

function Cell({
  label,
  session,
  end,
}: {
  label: string;
  session: AttendanceSession;
  end: AttendanceSessionEnd;
}) {
  const { t } = useTranslation();
  const location = locationOf(session, end);
  const coordinates = formatCoordinates(location);
  const accuracy = formatAccuracy(location.accuracy);

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-[11px] font-bold tracking-[0.06em] uppercase"
        style={{ color: "var(--text-faint)" }}
      >
        {label}
      </span>
      {/* A missing fix is the same empty cell as any other missing value. A
          person who declined the prompt is not marked out for it. */}
      <span className="text-sm tabular-nums" style={{ color: "var(--text-muted)" }}>
        {coordinates ?? t.clock.locationMissing}
        {coordinates && accuracy !== null ? ` ${t.clock.locationAccuracy(accuracy)}` : ""}
      </span>
    </div>
  );
}

/**
 * Where one session's two clocks were pressed. The caller decides whether the
 * strip belongs on the page at all — an organization that never switched
 * location on never sees it.
 */
export function SessionLocation({ session }: { session: AttendanceSession }) {
  const { t } = useTranslation();

  return (
    <div
      className="grid grid-cols-2 gap-3 border-t pt-2"
      style={{ borderColor: "var(--border)" }}
      data-testid="session-location"
    >
      <Cell label={t.clock.locationIn} session={session} end="IN" />
      <Cell label={t.clock.locationOut} session={session} end="OUT" />
    </div>
  );
}
