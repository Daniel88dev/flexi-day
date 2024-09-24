import { WorkingGroup } from "@/drizzle/schema";
import { db } from "@/drizzle/db";

export type WorkingGroupType = typeof WorkingGroup.$inferInsert;

export const insertWorkingGroup = async (group: WorkingGroupType) => {
  return db
    .insert(WorkingGroup)
    .values(group)
    .returning({ insertedId: WorkingGroup.id })
    .onConflictDoNothing();
};
