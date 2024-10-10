import { UserQuotas } from "@/drizzle/schema";
import { db } from "@/drizzle/db";
import { and, eq } from "drizzle-orm";

export type UserQuotasType = typeof UserQuotas.$inferInsert;

export const createUserQuotasRecord = async (userQuotas: UserQuotasType) => {
  return db
    .insert(UserQuotas)
    .values(userQuotas)
    .returning({ insertedId: UserQuotas.id })
    .onConflictDoNothing();
};

export const getUserQuotasForSelectedYear = async (
  userId: number,
  year: string,
  companyId: number
) => {
  const record = await db
    .select({
      vacationQuota: UserQuotas.vacationQuota,
      vacationSpend: UserQuotas.vacationSpend,
      homeOfficeQuota: UserQuotas.homeOfficeQuota,
      homeOfficeSpend: UserQuotas.homeOfficeSpend,
    })
    .from(UserQuotas)
    .where(
      and(
        eq(UserQuotas.userId, userId),
        eq(UserQuotas.activeYear, year),
        eq(UserQuotas.companyId, companyId)
      )
    );
  return record[0];
};
