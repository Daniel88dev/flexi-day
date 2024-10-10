import { Company, WorkingGroup } from "@/drizzle/schema";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";

export type WorkingGroupType = typeof WorkingGroup.$inferInsert;

export const insertWorkingGroup = async (group: WorkingGroupType) => {
  return db
    .insert(WorkingGroup)
    .values(group)
    .returning({ insertedId: WorkingGroup.id })
    .onConflictDoNothing();
};

export const getGroupsForCompany = async (companyId: number) => {
  const groups = await db
    .select({
      groupId: WorkingGroup.id,
      groupName: WorkingGroup.groupName,
      groupSlug: WorkingGroup.groupSlug,
      vacationDefault: WorkingGroup.vacationDefault,
      homeOfficeDefault: WorkingGroup.homeOfficeDefault,
    })
    .from(WorkingGroup)
    .where(eq(WorkingGroup.companyId, companyId));

  return groups;
};

export const getGroupDataForDashboard = async (groupId: number) => {
  const groupData = await db
    .select({
      vacationDefault: WorkingGroup.vacationDefault,
      homeOfficeDefault: WorkingGroup.homeOfficeDefault,
      companyName: Company.name,
      companyId: WorkingGroup.companyId,
    })
    .from(WorkingGroup)
    .leftJoin(Company, eq(Company.id, WorkingGroup.companyId))
    .where(eq(WorkingGroup.id, groupId));

  return groupData[0];
};
