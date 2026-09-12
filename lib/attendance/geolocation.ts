import {
  updateSessionLocation,
  type AttendanceSessionEnd,
  type AttendanceLocationFix,
} from "@/lib/api/attendance";

// Two passes, and both timeouts together have to stay under the two minutes the
// backend will still accept a fix within — a GPS lock that lands after that is
// thrown away on arrival.
const COARSE: PositionOptions = { enableHighAccuracy: false, timeout: 8_000, maximumAge: 60_000 };
const PRECISE: PositionOptions = { enableHighAccuracy: true, timeout: 30_000, maximumAge: 0 };

type Attempt = { fix: GeolocationPosition } | { fix: null; denied: boolean };

/** One reading, as a promise that never rejects. The browser's own prompt is the only one. */
const readPosition = (options: PositionOptions): Promise<Attempt> =>
  new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ fix: null, denied: true });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (fix) => resolve({ fix }),
      (error) => resolve({ fix: null, denied: error.code === error.PERMISSION_DENIED }),
      options
    );
  });

const fixFrom = (
  position: GeolocationPosition,
  end: AttendanceSessionEnd
): AttendanceLocationFix | null => {
  const { latitude, longitude, accuracy } = position.coords;
  // A reading the backend would only 422 on. Nothing is gained by sending it.
  if (![latitude, longitude, accuracy].every(Number.isFinite) || accuracy <= 0) return null;
  return { end, latitude, longitude, accuracy };
};

/**
 * Two readings after one clock, coarse then precise, each sent on as it
 * arrives. The backend keeps whichever is sharper, so the order is a
 * convenience rather than a contract.
 *
 * Nothing here throws and nothing here reports. A person who declines, a device
 * with no fix, a request that times out and a network that drops the update all
 * end the same way: the session keeps its null columns and the widget says
 * nothing about it. Declining is not a state the product has an opinion about.
 *
 * Call it only when the organization's `locationEnabled` is true — a browser
 * that is never asked is the whole point of the switch.
 */
export async function captureSessionLocation(
  sessionId: string,
  end: AttendanceSessionEnd
): Promise<void> {
  for (const options of [COARSE, PRECISE]) {
    const attempt = await readPosition(options);

    if (!attempt.fix) {
      // A refusal holds for the precise pass too, so asking again would only
      // be a second denial. A timeout might not, so that one carries on.
      if (attempt.denied) return;
      continue;
    }

    const fix = fixFrom(attempt.fix, end);
    if (!fix) continue;

    try {
      await updateSessionLocation(sessionId, fix);
    } catch {
      // The clock itself already succeeded. A dropped fix is not worth a word.
    }
  }
}
