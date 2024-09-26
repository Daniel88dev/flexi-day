import { CompanyUsers, GroupUsers, UsersTable } from "@/drizzle/schema";
import { db } from "@/drizzle/db";
import { and, eq } from "drizzle-orm";

export type GroupUsersType = typeof GroupUsers.$inferInsert;

export const insertGroupUser = async (userData: GroupUsersType) => {
  return db
    .insert(GroupUsers)
    .values(userData)
    .returning({ insertedId: GroupUsers.id })
    .onConflictDoNothing();
};

export const getUsersForGroup = async (groupId: number) => {
  const users = await db
    .select({
      userId: UsersTable.id,
      userName: UsersTable.name,
      userEmail: UsersTable.email,
      companyAdmin: CompanyUsers.isAdmin,
      isActive: GroupUsers.isActive,
      groupAdmin: GroupUsers.isAdmin,
      canView: GroupUsers.canView,
      canApprove: GroupUsers.canApprove,
    })
    .from(GroupUsers)
    .leftJoin(UsersTable, eq(GroupUsers.userId, UsersTable.id))
    .leftJoin(CompanyUsers, eq(CompanyUsers.userId, UsersTable.id))
    .where(eq(GroupUsers.groupId, groupId));

  return users;
};

export const checkUserGroupAdmin = async (groupId: number, userId: number) => {
  const admin = await db
    .select({ isAdmin: GroupUsers.isAdmin })
    .from(GroupUsers)
    .where(and(eq(GroupUsers.userId, userId), eq(GroupUsers.groupId, groupId)));

  return admin[0];
};
