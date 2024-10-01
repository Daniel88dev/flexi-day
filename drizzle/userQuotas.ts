import { UserQuotas } from "@/drizzle/schema";
import { db } from "@/drizzle/db";

export type UserQuotasType = typeof UserQuotas.$inferInsert;

export const createUserQuotasRecord = async (userQuotas: UserQuotasType) => {
  return db
    .insert(UserQuotas)
    .values(userQuotas)
    .returning({ insertedId: UserQuotas.id })
    .onConflictDoNothing();
};
