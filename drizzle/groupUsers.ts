import { GroupUsers } from "@/drizzle/schema";
import { db } from "@/drizzle/db";

export type GroupUsersType = typeof GroupUsers.$inferInsert;
