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

export type UpdateUserGroupPermissionsType = {
  userId: number;
  groupId: number;
  isActive: boolean;
  isAdmin: boolean;
  canView: boolean;
  canApprove: boolean;
};

export const updateUserGroupPermissions = async (
  updateData: UpdateUserGroupPermissionsType
) => {
  const result = await db
    .update(GroupUsers)
    .set({
      isActive: updateData.isActive,
      isAdmin: updateData.isAdmin,
      canView: updateData.canView,
      canApprove: updateData.canApprove,
    })
    .where(
      and(
        eq(GroupUsers.userId, updateData.userId),
        eq(GroupUsers.groupId, updateData.groupId)
      )
    )
    .returning({ updatedId: GroupUsers.id });

  return result;
};

export const deleteGroupUser = async (userId: number, groupId: number) => {
  const result = await db
    .delete(GroupUsers)
    .where(and(eq(GroupUsers.userId, userId), eq(GroupUsers.groupId, groupId)))
    .returning({ deletedId: GroupUsers.userId });

  return result[0].deletedId;
};
