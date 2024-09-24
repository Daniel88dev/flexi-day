import { GroupUsers } from "@/drizzle/schema";
import { db } from "@/drizzle/db";

export type GroupUsersType = typeof GroupUsers.$inferInsert;

export const insertGroupUser = async (userData: GroupUsersType) => {
  return db
    .insert(GroupUsers)
    .values(userData)
    .returning({ insertedId: GroupUsers.id })
    .onConflictDoNothing();
};
