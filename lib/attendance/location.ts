import type { AttendanceSession, AttendanceSessionEnd } from "@/lib/api/attendance";

export type SessionEndLocation = {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
};

/** The three columns of one end, whichever end that is. */
export function locationOf(
  session: AttendanceSession,
  end: AttendanceSessionEnd
): SessionEndLocation {
  return end === "IN"
    ? {
        latitude: session.startLatitude,
        longitude: session.startLongitude,
        accuracy: session.startAccuracy,
      }
    : {
        latitude: session.endLatitude,
        longitude: session.endLongitude,
        accuracy: session.endAccuracy,
      };
}

export const hasLocation = (location: SessionEndLocation): boolean =>
  location.latitude !== null && location.longitude !== null;

/** True once any end of any session carries coordinates — what decides whether the strip is worth a row. */
export const anySessionLocated = (sessions: AttendanceSession[]): boolean =>
  sessions.some(
    (session) => hasLocation(locationOf(session, "IN")) || hasLocation(locationOf(session, "OUT"))
  );

/**
 * Coordinates as something to read, or null when there are none. Four decimals
 * is about eleven metres, which is finer than any fix the product stores and
 * short enough to sit on a phone.
 */
export function formatCoordinates(location: SessionEndLocation): string | null {
  const { latitude, longitude } = location;
  if (latitude === null || longitude === null) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

/**
 * The browser's radius, rounded to the metre. Sub-metre accuracy does not
 * survive the rounding, and a fix that good does not happen on a phone indoors.
 */
export function formatAccuracy(accuracy: number | null): number | null {
  if (accuracy === null || !Number.isFinite(accuracy) || accuracy <= 0) return null;
  return Math.max(1, Math.round(accuracy));
}
