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

// =============================================
// TABLE DEFINITIONS
// =============================================

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

// Tenants table - represents organizations/authorities (e.g., BMI, Stadt München)
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Bundesministerium des Innern"
  slug: varchar("slug", { length: 100 }).notNull().unique(), // e.g., "bmi" for URLs

  // Branding
  logoUrl: varchar("logo_url", { length: 500 }),
  primaryColor: varchar("primary_color", { length: 7 }), // e.g., "#104277"
  faviconUrl: varchar("favicon_url", { length: 500 }),

  // Domain whitelist settings (JSONB array of allowed domain patterns)
  // e.g., ["*.gov.de", "*.bund.de", "*.bmi.bund.de", "example.org"]
  domainWhitelist: jsonb("domain_whitelist").$type<string[]>().default([]),

  // Whitelist mode: "warn" (show warning for external), "block" (prevent creation), "allow" (no restrictions)
  whitelistMode: varchar("whitelist_mode", { enum: ["warn", "block", "allow"] }).notNull().default("warn"),

  // Privacy settings
  privacySettings: jsonb("privacy_settings").$type<{
    // IP anonymization level: "none", "partial" (last octet zeroed), "full" (no IP stored)
    ipAnonymization: "none" | "partial" | "full";
    // Analytics retention in days (0 = indefinite, but not recommended)
    analyticsRetentionDays: number;
    // Audit log retention in days
    auditLogRetentionDays: number;
    // Whether to collect referrer data
    collectReferrer: boolean;
    // Whether to collect device type
    collectDeviceType: boolean;
    // Whether to collect geographic data
    collectGeoData: boolean;
  }>().default({
    ipAnonymization: "full",
    analyticsRetentionDays: 90,
    auditLogRetentionDays: 365,
    collectReferrer: false,
    collectDeviceType: true,
    collectGeoData: true,
  }),

  // Contact information
  contactEmail: varchar("contact_email", { length: 255 }),
  dataProtectionOfficerEmail: varchar("dpo_email", { length: 255 }),
  imprintUrl: varchar("imprint_url", { length: 500 }),
  privacyPolicyUrl: varchar("privacy_policy_url", { length: 500 }),

  // Status
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["federal", "state", "local"] }).notNull().default("local"),
  agency: varchar("agency"),
  // Multi-tenant support: optional tenant association
  tenantId: varchar("tenant_id").references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  // Multi-tenant support: optional tenant association
  tenantId: varchar("tenant_id").references(() => tenants.id),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  clickCount: integer("click_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_links_tenant").on(table.tenantId),
  index("IDX_links_short_code").on(table.shortCode),
]);

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
  // Anonymized IP for rate limiting (optional, based on tenant settings)
  anonymizedIp: varchar("anonymized_ip", { length: 45 }),
});

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

// Audit log table for GDPR compliance and security monitoring
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  action: varchar("action", { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // link, user, report, routing_rule
  resourceId: varchar("resource_id"),
  ipAddress: varchar("ip_address", { length: 45 }), // IPv6 compatible (may be anonymized)
  userAgent: text("user_agent"),
  details: jsonb("details"), // Additional context (old/new values for updates)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_audit_user").on(table.userId),
  index("IDX_audit_tenant").on(table.tenantId),
  index("IDX_audit_created").on(table.createdAt),
]);

// Custom domains table - maps domains to tenants for white-label
export const customDomains = pgTable("custom_domains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

  // The custom domain (e.g., "go.bmi.gov.de", "kurz.muenchen.de")
  domain: varchar("domain", { length: 255 }).notNull().unique(),

  // Whether this is the primary domain for the tenant
  isPrimary: boolean("is_primary").notNull().default(false),

  // SSL/verification status
  sslStatus: varchar("ssl_status", { enum: ["pending", "active", "failed"] }).notNull().default("pending"),
  verificationToken: varchar("verification_token", { length: 64 }),
  verifiedAt: timestamp("verified_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_custom_domain_tenant").on(table.tenantId),
  index("IDX_custom_domain_domain").on(table.domain),
]);

// =============================================
// RELATIONS
// =============================================

export const tenantsRelations = relations(tenants, ({ many }) => ({
  customDomains: many(customDomains),
  users: many(users),
  links: many(links),
  auditLogs: many(auditLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  links: many(links),
  auditLogs: many(auditLogs),
}));

export const linksRelations = relations(links, ({ one, many }) => ({
  creator: one(users, {
    fields: [links.createdBy],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [links.tenantId],
    references: [tenants.id],
  }),
  routingRules: many(routingRules),
  analytics: many(analytics),
  reports: many(reports),
}));

export const routingRulesRelations = relations(routingRules, ({ one }) => ({
  link: one(links, {
    fields: [routingRules.linkId],
    references: [links.id],
  }),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  link: one(links, {
    fields: [analytics.linkId],
    references: [links.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  link: one(links, {
    fields: [reports.linkId],
    references: [links.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
}));

export const customDomainsRelations = relations(customDomains, ({ one }) => ({
  tenant: one(tenants, {
    fields: [customDomains.tenantId],
    references: [tenants.id],
  }),
}));

// =============================================
// ZOD SCHEMAS & TYPES
// =============================================

// User types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Link schemas
export const insertLinkSchema = createInsertSchema(links).omit({
  id: true,
  shortCode: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  clickCount: true,
});

export const updateLinkSchema = z.object({
  destinationUrl: z.string().url().optional(),
  customAlias: z.string().regex(/^[a-zA-Z0-9-_]*$/).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  agency: z.string().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export type InsertLink = z.infer<typeof insertLinkSchema>;
export type UpdateLink = z.infer<typeof updateLinkSchema>;
export type Link = typeof links.$inferSelect;

// Bulk link creation schema
export const bulkLinkSchema = z.object({
  destinationUrl: z.string().url(),
  customAlias: z.string().regex(/^[a-zA-Z0-9-_]*$/).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  agency: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const bulkLinksSchema = z.array(bulkLinkSchema);
export type BulkLink = z.infer<typeof bulkLinkSchema>;
export type BulkLinkResult = {
  row: number;
  success: boolean;
  shortCode?: string;
  error?: string;
  link?: Link;
};

// Routing rule schemas
export const insertRoutingRuleSchema = createInsertSchema(routingRules).omit({
  id: true,
  createdAt: true,
});

export type InsertRoutingRule = z.infer<typeof insertRoutingRuleSchema>;
export type RoutingRule = typeof routingRules.$inferSelect;

// Analytics schemas
export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  clickedAt: true,
});

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;

// Report schemas
export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// Audit log types
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Tenant schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  faviconUrl: z.string().url().nullable().optional(),
  domainWhitelist: z.array(z.string()).optional(),
  whitelistMode: z.enum(["warn", "block", "allow"]).optional(),
  privacySettings: z.object({
    ipAnonymization: z.enum(["none", "partial", "full"]),
    analyticsRetentionDays: z.number().min(0).max(3650),
    auditLogRetentionDays: z.number().min(0).max(3650),
    collectReferrer: z.boolean(),
    collectDeviceType: z.boolean(),
    collectGeoData: z.boolean(),
  }).optional(),
  contactEmail: z.string().email().nullable().optional(),
  dataProtectionOfficerEmail: z.string().email().nullable().optional(),
  imprintUrl: z.string().url().nullable().optional(),
  privacyPolicyUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type UpdateTenant = z.infer<typeof updateTenantSchema>;
export type PrivacySettings = NonNullable<Tenant["privacySettings"]>;

// Custom domain schemas
export const insertCustomDomainSchema = createInsertSchema(customDomains).omit({
  id: true,
  sslStatus: true,
  verificationToken: true,
  verifiedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type CustomDomain = typeof customDomains.$inferSelect;
export type InsertCustomDomain = z.infer<typeof insertCustomDomainSchema>;

// =============================================
// CONSTANTS
// =============================================

// Default trusted domain patterns for German government
export const DEFAULT_TRUSTED_DOMAINS = [
  "*.gov.de",
  "*.bund.de",
  "*.bayern.de",
  "*.nrw.de",
  "*.sachsen.de",
  "*.hessen.de",
  "*.niedersachsen.de",
  "*.baden-wuerttemberg.de",
  "*.berlin.de",
  "*.hamburg.de",
  "*.bremen.de",
  "*.saarland.de",
  "*.sachsen-anhalt.de",
  "*.schleswig-holstein.de",
  "*.thueringen.de",
  "*.brandenburg.de",
  "*.mecklenburg-vorpommern.de",
  "*.rheinland-pfalz.de",
  "*.europa.eu",
  "*.ec.europa.eu",
] as const;

// Default privacy settings for new tenants (GDPR-compliant defaults)
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  ipAnonymization: "full",
  analyticsRetentionDays: 90,
  auditLogRetentionDays: 365,
  collectReferrer: false,
  collectDeviceType: true,
  collectGeoData: true,
};
