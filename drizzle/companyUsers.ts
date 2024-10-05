import { Company, CompanyUsers } from "@/drizzle/schema";
import { db } from "@/drizzle/db";
import { and, eq } from "drizzle-orm";

export type CompanyUsersType = typeof CompanyUsers.$inferInsert;

export const insertCompanyUser = async (companyUser: CompanyUsersType) => {
  return db
    .insert(CompanyUsers)
    .values(companyUser)
    .returning({ insertedId: CompanyUsers.id })
    .onConflictDoNothing();
};

export const getCompaniesForUser = async (userId: number) => {
  return db
    .select({
      companyId: CompanyUsers.companyId,
      isAdmin: CompanyUsers.isAdmin,
    })
    .from(CompanyUsers)
    .where(eq(CompanyUsers.userId, userId));
};

export const checkUserCompanyPermission = async (
  companyId: number,
  userId: number
) => {
  const permission = await db
    .select({
      permission: CompanyUsers.isAdmin,
    })
    .from(CompanyUsers)
    .where(
      and(
        eq(CompanyUsers.userId, userId),
        eq(CompanyUsers.companyId, companyId)
      )
    );
  return permission[0];
};

export const getCompaniesIdForUser = async (userId: number) => {
  const companies = await db
    .select({
      companyId: Company.id,
      companyName: Company.name,
      companySlug: Company.companySlug,
      vacationDefault: Company.vacationDefault,
      homeOfficeDefault: Company.homeOfficeDefault,
      isUserAdmin: CompanyUsers.isAdmin,
    })
    .from(CompanyUsers)
    .leftJoin(Company, eq(CompanyUsers.companyId, Company.id))
    .where(eq(CompanyUsers.userId, userId));

  return companies;
};

export type UpdateCompanyUserPermissionType = {
  companyId: number;
  userId: number;
  isAdmin: boolean;
};

export const updateCompanyUserPermission = async (
  updateData: UpdateCompanyUserPermissionType
) => {
  const result = await db
    .update(CompanyUsers)
    .set({
      isAdmin: updateData.isAdmin,
    })
    .where(
      and(
        eq(CompanyUsers.userId, updateData.userId),
        eq(CompanyUsers.companyId, updateData.companyId)
      )
    )
    .returning({ updateId: CompanyUsers.id });

  return result;
};

export const deleteCompanyUser = async (userId: number, companyId: number) => {
  const result = await db
    .delete(CompanyUsers)
    .where(
      and(
        eq(CompanyUsers.userId, userId),
        eq(CompanyUsers.companyId, companyId)
      )
    )
    .returning({ deletedId: CompanyUsers.userId });

  return result[0].deletedId;
};
