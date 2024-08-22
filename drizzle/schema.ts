import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import {
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  integer,
} from "drizzle-orm/pg-core";

export const UsersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerkId: varchar("clerk_id").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (users) => {
    return {
      uniqueIdx: uniqueIndex("unique_clerk_idx").on(users.clerkId),
    };
  }
);

export const WorkingGroup = pgTable(
  "working_group",
  {
    id: serial("id").primaryKey(),
    groupSlug: varchar("group_slug", { length: 40 }).notNull(),
    groupNme: varchar("group_name", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    groupAdmin: serial("group_admin")
      .notNull()
      .references(() => UsersTable.id),
    vacationDefault: integer("vacation_default").default(0),
    homeOfficeDefault: integer("home_default").default(0),
  },
  (workingGroups) => {
    return {
      uniqueGroupIndex: uniqueIndex("unique_group_idx").on(
        workingGroups.groupSlug
      ),
    };
  }
);

export const GroupUsers = pgTable("group_users", {
  id: serial("id").primaryKey(),
  userId: serial("user_id")
    .notNull()
    .references(() => UsersTable.id),
  isActive: boolean("is_active").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  canView: boolean("can_view").notNull().default(true),
  canApprove: boolean("can_approve").notNull().default(false),
});
