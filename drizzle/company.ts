import { Company } from "@/drizzle/schema";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";

export type CompanyType = typeof Company.$inferInsert;

export const insertCompany = async (company: CompanyType) => {
  return db
    .insert(Company)
    .values(company)
    .returning({ insertedId: Company.id })
    .onConflictDoNothing();
};

export const getCompanyDetailsById = async (companyId: number) => {
  const company = await db
    .select({
      id: Company.id,
      name: Company.name,
      vacationDefault: Company.vacationDefault,
      homeOfficeDefault: Company.homeOfficeDefault,
    })
    .from(Company)
    .where(eq(Company.id, companyId))
    .limit(1);

  return company[0];
};
