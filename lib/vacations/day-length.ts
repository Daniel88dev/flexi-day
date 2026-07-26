/** The subset of a vacation row that determines how long the day is. */
export interface DayLengthSource {
  halfDay: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface DayLengthLabels {
  halfDay: string;
  fullDay: string;
}

/**
 * Renders how much of the day a request covers.
 *
 * `halfDay` is the only thing that decides this — the times are free-form
 * decoration that a full day often carries too, so they are shown alongside
 * the label rather than standing in for it.
 */
export function dayLengthLabel(entry: DayLengthSource, labels: DayLengthLabels): string {
  if (entry.startTime && entry.endTime) {
    const range = `${entry.startTime.slice(0, 5)} – ${entry.endTime.slice(0, 5)}`;
    return entry.halfDay ? `${labels.halfDay} · ${range}` : range;
  }
  return entry.halfDay ? labels.halfDay : labels.fullDay;
}
