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
    isAdmin: boolean("is_admin").default(false),
    isSuperAdmin: boolean("is_super_admin").default(false),
  },
  (users) => {
    return {
      uniqueIdx: uniqueIndex("unique_clerk_idx").on(users.clerkId),
    };
  }
);

export const Company = pgTable("company", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  companySlug: varchar("company_slug", { length: 40 }).notNull().unique(),
  vacationDefault: integer("vacation_default").notNull(),
  homeOfficeDefault: integer("home_office_default").notNull(),
  managerId: serial("manager_id")
    .notNull()
    .references(() => UsersTable.id),
});

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
    companyId: serial("company_id").references(() => Company.id),
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
  groupId: serial("group_id")
    .notNull()
    .references(() => WorkingGroup.id),
  isActive: boolean("is_active").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  canView: boolean("can_view").notNull().default(true),
  canApprove: boolean("can_approve").notNull().default(false),
});

export const UserQuotas = pgTable("user_quotas", {
  id: serial("id").primaryKey(),
  userId: serial("user_id")
    .notNull()
    .references(() => UsersTable.id),
  companyId: serial("company_id").references(() => Company.id),
  vacationQuota: integer("vacation_quota").notNull().default(0),
  vacationSpend: integer("vacation_spend").default(0),
  homeOfficeQuota: integer("home_office_quota").notNull().default(0),
  homeOfficeSpend: integer("home_office_spend").default(0),
  activeYear: varchar("active_year", { length: 4 }),
});

export const GroupInvitations = pgTable("group_invitations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  userId: serial("user_id").references(() => UsersTable.id),
  groupId: serial("group_id").references(() => WorkingGroup.id),
  invitationLink: varchar("invitation_link", { length: 10 }).notNull(),
});

export const CalendarTable = pgTable("calendar_table", {
  id: serial("id").primaryKey(),
  userId: serial("user_id")
    .notNull()
    .references(() => UsersTable.id),
  companyId: serial("company_id").references(() => Company.id),
  vacationType: varchar("vacation_type").notNull(),
  day: timestamp("day").notNull(),
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const RequestTable = pgTable("request_table", {
  id: serial("id").primaryKey(),
  userId: serial("user_id")
    .notNull()
    .references(() => UsersTable.id),
  calendarConnection: serial("calendar_connection")
    .notNull()
    .references(() => CalendarTable.id),
  isApproved: boolean("is_approved").notNull().default(false),
  isRejected: boolean("is_rejected").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const NotificationTable = pgTable("notification_table", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => UsersTable.id),
  calendarConnection: serial("calendar_connection").references(
    () => CalendarTable.id
  ),
  isDisplayed: boolean("is_displayed").notNull().default(false),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const UserDefaultGroup = pgTable("user_default_group", {
  id: serial("id").primaryKey(),
  userId: serial("user_id")
    .references(() => UsersTable.id)
    .unique(),
  groupId: serial("group_id").references(() => WorkingGroup.id),
});
