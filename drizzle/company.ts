import { Company } from "@/drizzle/schema";
import { db } from "@/drizzle/db";

export type CompanyType = typeof Company.$inferInsert;

export const insertCompany = async (company: CompanyType) => {
  return db
    .insert(Company)
    .values(company)
    .returning({ insertedId: Company.id })
    .onConflictDoNothing();
};
