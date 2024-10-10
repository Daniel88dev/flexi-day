import { UserDefaultGroup, WorkingGroup } from "@/drizzle/schema";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";

export type UserDefaultGroupType = typeof UserDefaultGroup.$inferInsert;

export const insertUserDefaultGroup = async (record: UserDefaultGroupType) => {
  const checkExistingRecord = await db
    .select({
      id: UserDefaultGroup.id,
    })
    .from(UserDefaultGroup)
    .where(eq(UserDefaultGroup.userId, record.userId!));

  if (checkExistingRecord[0]) {
    const updateResult = await db
      .update(UserDefaultGroup)
      .set({ groupId: record.groupId })
      .where(eq(UserDefaultGroup.id, checkExistingRecord[0].id))
      .returning({ id: UserDefaultGroup.id });

    return updateResult[0].id;
  } else {
    const insertResult = await db
      .insert(UserDefaultGroup)
      .values(record)
      .returning({ id: UserDefaultGroup.id })
      .onConflictDoNothing();

    return insertResult[0].id;
  }
};

export const getDefaultGroupId = async (userId: number) => {
  const user = await db
    .select({
      groupId: UserDefaultGroup.groupId,
    })
    .from(UserDefaultGroup)
    .leftJoin(WorkingGroup, eq(WorkingGroup.id, UserDefaultGroup.groupId))
    .where(eq(UserDefaultGroup.userId, userId));

  return user[0] ? user[0].groupId : null;
};
