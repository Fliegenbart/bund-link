import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["federal", "state", "local"] }).notNull().default("local"),
  agency: varchar("agency"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Shortened links table
export const links = pgTable("links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shortCode: varchar("short_code", { length: 50 }).notNull().unique(),
  destinationUrl: text("destination_url").notNull(),
  customAlias: varchar("custom_alias", { length: 100 }),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  agency: varchar("agency"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  clickCount: integer("click_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const linksRelations = relations(links, ({ one, many }) => ({
  creator: one(users, {
    fields: [links.createdBy],
    references: [users.id],
  }),
  routingRules: many(routingRules),
  analytics: many(analytics),
}));

export const insertLinkSchema = createInsertSchema(links).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  clickCount: true,
});

export type InsertLink = z.infer<typeof insertLinkSchema>;
export type Link = typeof links.$inferSelect;

// Routing rules for smart routing (geographic, language, device, time-based)
export const routingRules = pgTable("routing_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  linkId: varchar("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  ruleType: varchar("rule_type", { enum: ["geographic", "language", "device", "time"] }).notNull(),
  condition: jsonb("condition").notNull(), // e.g., { country: "DE", state: "NRW" } or { language: "de" }
  targetUrl: text("target_url").notNull(),
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const routingRulesRelations = relations(routingRules, ({ one }) => ({
  link: one(links, {
    fields: [routingRules.linkId],
    references: [links.id],
  }),
}));

export const insertRoutingRuleSchema = createInsertSchema(routingRules).omit({
  id: true,
  createdAt: true,
});

export type InsertRoutingRule = z.infer<typeof insertRoutingRuleSchema>;
export type RoutingRule = typeof routingRules.$inferSelect;

// Analytics tracking (GDPR-compliant, anonymized)
export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  linkId: varchar("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  clickedAt: timestamp("clicked_at").defaultNow(),
  country: varchar("country", { length: 2 }), // ISO country code
  region: varchar("region", { length: 100 }),
  language: varchar("language", { length: 10 }),
  deviceType: varchar("device_type", { enum: ["desktop", "mobile", "tablet", "other"] }),
  referrer: text("referrer"),
});

export const analyticsRelations = relations(analytics, ({ one }) => ({
  link: one(links, {
    fields: [analytics.linkId],
    references: [links.id],
  }),
}));

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  clickedAt: true,
});

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;

// Reports for broken/suspicious links from citizens
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  linkId: varchar("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  reportType: varchar("report_type", { enum: ["broken", "suspicious", "other"] }).notNull(),
  description: text("description"),
  reporterEmail: varchar("reporter_email"),
  status: varchar("status", { enum: ["pending", "reviewed", "resolved"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reportsRelations = relations(reports, ({ one }) => ({
  link: one(links, {
    fields: [reports.linkId],
    references: [links.id],
  }),
}));

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
