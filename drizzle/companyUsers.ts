import { CompanyUsers } from "@/drizzle/schema";
import { db } from "@/drizzle/db";

export type CompanyUsersType = typeof CompanyUsers.$inferInsert;

export const insertCompanyUser = async (companyUser: CompanyUsersType) => {
  return db
    .insert(CompanyUsers)
    .values(companyUser)
    .returning({ insertedId: CompanyUsers.id })
    .onConflictDoNothing();
};
