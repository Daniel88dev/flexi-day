import { db } from "./db";
import { UsersTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

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

export const deleteUser = async (clerkId: string) => {
  return db.delete(UsersTable).where(eq(UsersTable.clerkId, clerkId));
};

export const getUserId = async () => {
  const clerkUser = await currentUser();
  if (!clerkUser || !clerkUser.id) {
    throw new Error("Clerk user not found or missing ID");
  }

  const user = await db.query.UsersTable.findFirst({
    where: eq(UsersTable.clerkId, clerkUser?.id!),
    columns: { id: true },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user.id;
};
