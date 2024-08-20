import { db } from "./db";
import { UsersTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export type User = typeof UsersTable.$inferInsert;

export const insertUser = async (user: User) => {
  return db.insert(UsersTable).values(user);
};

export const updatedUser = async (user: User) => {
  return db
    .update(UsersTable)
    .set({ name: user.name, email: user.email })
    .where(eq(UsersTable.clerkId, user.clerkId));
};
