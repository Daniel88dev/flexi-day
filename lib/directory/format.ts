import { businessDateIn } from "@/lib/attendance/self-service";
import { formatIsoDate } from "@/lib/calendar/month-grid";

/** A `YYYY-MM-DD` as the calendar day it names, whatever the viewer's zone. */
export const formatDay = (value: string, locale: string) => formatIsoDate(value, locale, {});

/** An Employment start or end as the day it falls on in the organization's zone, where the backend wrote it. */
export const formatEmploymentDay = (value: string, locale: string, timeZone: string | undefined) =>
  formatDay(businessDateIn(new Date(value), timeZone ?? "UTC"), locale);

export const formatDate = (value: string, locale: string) =>
  new Date(value).toLocaleDateString(locale);

export const formatDateTime = (value: string, locale: string) =>
  new Date(value).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" });
