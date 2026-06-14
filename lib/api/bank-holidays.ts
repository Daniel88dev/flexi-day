import { api } from "./client";
import type { BankHoliday } from "./types";

export type ListBankHolidaysParams = {
  year?: number;
  country: string;
  region?: string;
};

export function listBankHolidays(params: ListBankHolidaysParams): Promise<BankHoliday[]> {
  const q = new URLSearchParams();
  q.set("country", params.country);
  if (params.year !== undefined) q.set("year", String(params.year));
  if (params.region) q.set("region", params.region);
  return api<BankHoliday[]>(`/api/bank-holidays?${q.toString()}`);
}
