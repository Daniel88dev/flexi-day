import { db } from "./db";
import { UsersTable } from "@/drizzle/schema";

export type User = typeof UsersTable.$inferInsert;

export const insertUser = async (user: User) => {
  return db.insert(UsersTable).values(user);
};
