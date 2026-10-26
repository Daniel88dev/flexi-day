import { formatIsoDate } from "@/lib/calendar/month-grid";

/** A `YYYY-MM-DD` as the calendar day it names, whatever the viewer's zone. */
export const formatDay = (value: string, locale: string) => formatIsoDate(value, locale, {});

export const formatDate = (value: string, locale: string) =>
  new Date(value).toLocaleDateString(locale);

export const formatDateTime = (value: string, locale: string) =>
  new Date(value).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" });
