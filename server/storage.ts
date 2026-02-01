import {
  users,
  links,
  routingRules,
  analytics,
  reports,
  auditLogs,
  tenants,
  customDomains,
  type User,
  type UpsertUser,
  type Link,
  type InsertLink,
  type RoutingRule,
  type InsertRoutingRule,
  type Analytics,
  type InsertAnalytics,
  type Report,
  type InsertReport,
  type Tenant,
  type InsertTenant,
  type UpdateTenant,
  type CustomDomain,
  type InsertCustomDomain,
  type PrivacySettings,
  DEFAULT_PRIVACY_SETTINGS,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, lt, or } from "drizzle-orm";
import { randomBytes } from "crypto";
import { prepareAnalyticsData } from "./lib/privacy";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Link operations
  createLink(link: InsertLink, createdBy: string): Promise<Link>;
  getLink(id: string): Promise<Link | undefined>;
  getLinkByShortCode(shortCode: string): Promise<Link | undefined>;
  getLinks(userId: string): Promise<Link[]>;
  updateLink(id: string, updates: Partial<Link>): Promise<Link>;
  deleteLink(id: string): Promise<void>;
  incrementClickCount(id: string): Promise<void>;
  getLinkStats(userId: string): Promise<{
    totalLinks: number;
    activeLinks: number;
    totalClicks: number;
    clickRate: number;
  }>;

  // Routing rule operations
  createRoutingRule(rule: InsertRoutingRule): Promise<RoutingRule>;
  getRoutingRulesByLink(linkId: string): Promise<RoutingRule[]>;
  getDestinationUrl(
    linkId: string,
    context: { country?: string; language?: string; deviceType?: string }
  ): Promise<string>;

  // Analytics operations
  trackClick(analytics: InsertAnalytics): Promise<Analytics>;
  getAnalyticsByLink(linkId: string): Promise<Analytics[]>;
  getAnalyticsOverview(): Promise<{
    totalClicks: number;
    clicksByCountry: Array<{ country: string; count: number }>;
    clicksByDevice: Array<{ device: string; count: number }>;
    clicksOverTime: Array<{ date: string; clicks: number }>;
  }>;

  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
  updateReportStatus(id: string, status: "pending" | "reviewed" | "resolved"): Promise<Report>;

  // GDPR operations
  exportUserData(userId: string): Promise<{
    user: User | undefined;
    links: Link[];
    analytics: Analytics[];
    auditLogs: any[];
  }>;
  deleteUserData(userId: string): Promise<void>;
  cleanupOldAnalytics(retentionDays: number): Promise<number>;

  // Tenant operations
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  getTenants(): Promise<Tenant[]>;
  updateTenant(id: string, updates: UpdateTenant): Promise<Tenant>;
  deleteTenant(id: string): Promise<void>;

  // Custom domain operations
  createCustomDomain(domain: InsertCustomDomain): Promise<CustomDomain>;
  getCustomDomain(domain: string): Promise<CustomDomain | undefined>;
  getCustomDomainsByTenant(tenantId: string): Promise<CustomDomain[]>;
  verifyCustomDomain(id: string): Promise<CustomDomain>;
  deleteCustomDomain(id: string): Promise<void>;

  // Tenant-scoped operations
  getLinksByTenant(tenantId: string): Promise<Link[]>;
  getAnalyticsByTenant(tenantId: string): Promise<Analytics[]>;
  cleanupTenantAnalytics(tenantId: string, retentionDays: number): Promise<number>;
  cleanupTenantAuditLogs(tenantId: string, retentionDays: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First, check if a user with this email already exists
    const [existingUserByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email!));
    
    // If a user with this email exists but different ID, update that user
    if (existingUserByEmail && existingUserByEmail.id !== userData.id) {
      const [updated] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.email, userData.email!))
        .returning();
      return updated;
    }
    
    // Otherwise, do regular upsert by ID
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Link operations
  private generateShortCode(): string {
    return randomBytes(4).toString("base64url").slice(0, 6);
  }

  async createLink(linkData: InsertLink, createdBy: string): Promise<Link> {
    const shortCode = linkData.customAlias || this.generateShortCode();
    const [link] = await db
      .insert(links)
      .values({
        ...linkData,
        shortCode,
        createdBy,
      })
      .returning();
    return link;
  }

  async getLink(id: string): Promise<Link | undefined> {
    const [link] = await db.select().from(links).where(eq(links.id, id));
    return link;
  }

  async getLinkByShortCode(shortCode: string): Promise<Link | undefined> {
    const [link] = await db.select().from(links).where(eq(links.shortCode, shortCode));
    return link;
  }

  async getLinks(userId: string): Promise<Link[]> {
    return await db
      .select()
      .from(links)
      .where(eq(links.createdBy, userId))
      .orderBy(desc(links.createdAt));
  }

  async updateLink(id: string, updates: Partial<Link>): Promise<Link> {
    const [link] = await db
      .update(links)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(links.id, id))
      .returning();
    return link;
  }

  async deleteLink(id: string): Promise<void> {
    await db.delete(links).where(eq(links.id, id));
  }

  async incrementClickCount(id: string): Promise<void> {
    await db
      .update(links)
      .set({ clickCount: sql`${links.clickCount} + 1` })
      .where(eq(links.id, id));
  }

  async getLinkStats(userId: string): Promise<{
    totalLinks: number;
    activeLinks: number;
    totalClicks: number;
    clickRate: number;
  }> {
    const userLinks = await db
      .select()
      .from(links)
      .where(eq(links.createdBy, userId));

    const totalLinks = userLinks.length;
    const activeLinks = userLinks.filter((l) => l.isActive).length;
    const totalClicks = userLinks.reduce((sum, l) => sum + l.clickCount, 0);
    const clickRate = totalLinks > 0 ? (totalClicks / totalLinks) * 100 : 0;

    return { totalLinks, activeLinks, totalClicks, clickRate };
  }

  // Routing rule operations
  async createRoutingRule(ruleData: InsertRoutingRule): Promise<RoutingRule> {
    const [rule] = await db.insert(routingRules).values(ruleData).returning();
    return rule;
  }

  async getRoutingRulesByLink(linkId: string): Promise<RoutingRule[]> {
    return await db
      .select()
      .from(routingRules)
      .where(eq(routingRules.linkId, linkId))
      .orderBy(desc(routingRules.priority));
  }

  async getDestinationUrl(
    linkId: string,
    context: { country?: string; language?: string; deviceType?: string }
  ): Promise<string> {
    const link = await db.select().from(links).where(eq(links.id, linkId)).limit(1);
    if (!link || link.length === 0) {
      throw new Error("Link not found");
    }

    const rules = await this.getRoutingRulesByLink(linkId);
    
    // Normalize context values
    const normalizedContext = {
      country: context.country?.toUpperCase(),
      language: context.language?.toLowerCase(),
      deviceType: context.deviceType?.toLowerCase(),
    };
    
    for (const rule of rules) {
      const condition = rule.condition as any;
      let matches = false;

      switch (rule.ruleType) {
        case "geographic":
          // Currently only supports country-level routing
          // State/region routing requires GeoIP service with granular location data
          if (condition.country && !condition.state && !condition.region) {
            // Simple country match
            matches = normalizedContext.country === condition.country.toUpperCase();
          } else {
            // Rules with state/region are not supported yet - skip them
            matches = false;
          }
          break;
        
        case "language":
          // Support language and locale conditions
          if (condition.language) {
            const conditionLang = condition.language.toLowerCase();
            matches = normalizedContext.language === conditionLang || 
                     (normalizedContext.language?.startsWith(conditionLang) ?? false);
          }
          if (!matches && condition.locale) {
            matches = normalizedContext.language === condition.locale.toLowerCase();
          }
          break;
        
        case "device":
          // Support deviceType and device conditions
          if (condition.deviceType) {
            matches = normalizedContext.deviceType === condition.deviceType.toLowerCase();
          }
          if (!matches && condition.device) {
            matches = normalizedContext.deviceType === condition.device.toLowerCase();
          }
          break;
        
        default:
          matches = false;
      }

      if (matches) {
        return rule.targetUrl;
      }
    }

    return link[0].destinationUrl;
  }

  // Analytics operations
  async trackClick(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [analytic] = await db.insert(analytics).values(analyticsData).returning();
    return analytic;
  }

  async getAnalyticsByLink(linkId: string): Promise<Analytics[]> {
    return await db
      .select()
      .from(analytics)
      .where(eq(analytics.linkId, linkId))
      .orderBy(desc(analytics.clickedAt));
  }

  async getAnalyticsOverview(): Promise<{
    totalClicks: number;
    clicksByCountry: Array<{ country: string; count: number }>;
    clicksByDevice: Array<{ device: string; count: number }>;
    clicksOverTime: Array<{ date: string; clicks: number }>;
  }> {
    const allAnalytics = await db.select().from(analytics);
    const totalClicks = allAnalytics.length;

    // Group by country
    const countryMap = new Map<string, number>();
    allAnalytics.forEach((a) => {
      const country = a.country || "Unknown";
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });
    const clicksByCountry = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Group by device
    const deviceMap = new Map<string, number>();
    allAnalytics.forEach((a) => {
      const device = a.deviceType || "other";
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });
    const clicksByDevice = Array.from(deviceMap.entries()).map(([device, count]) => ({
      device,
      count,
    }));

    // Group by date (last 30 days)
    const dateMap = new Map<string, number>();
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dateMap.set(dateStr, 0);
    }
    allAnalytics.forEach((a) => {
      const dateStr = new Date(a.clickedAt!).toISOString().split("T")[0];
      if (dateMap.has(dateStr)) {
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
      }
    });
    const clicksOverTime = Array.from(dateMap.entries()).map(([date, clicks]) => ({
      date,
      clicks,
    }));

    return { totalClicks, clicksByCountry, clicksByDevice, clicksOverTime };
  }

  // Report operations
  async createReport(reportData: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(reportData).returning();
    return report;
  }

  async getReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async updateReportStatus(
    id: string,
    status: "pending" | "reviewed" | "resolved"
  ): Promise<Report> {
    const [report] = await db
      .update(reports)
      .set({ status })
      .where(eq(reports.id, id))
      .returning();
    return report;
  }

  // GDPR operations
  async exportUserData(userId: string): Promise<{
    user: User | undefined;
    links: Link[];
    analytics: Analytics[];
    auditLogs: any[];
  }> {
    const user = await this.getUser(userId);
    const userLinks = await this.getLinks(userId);

    // Get analytics for user's links
    const linkIds = userLinks.map(l => l.id);
    let userAnalytics: Analytics[] = [];
    for (const linkId of linkIds) {
      const linkAnalytics = await this.getAnalyticsByLink(linkId);
      userAnalytics = [...userAnalytics, ...linkAnalytics];
    }

    // Get user's audit logs
    const userAuditLogs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt));

    return {
      user,
      links: userLinks,
      analytics: userAnalytics,
      auditLogs: userAuditLogs,
    };
  }

  async deleteUserData(userId: string): Promise<void> {
    // Delete in order to respect foreign key constraints
    // 1. Get all user's links
    const userLinks = await this.getLinks(userId);
    const linkIds = userLinks.map(l => l.id);

    // 2. Delete analytics for user's links (cascade should handle this, but be explicit)
    for (const linkId of linkIds) {
      await db.delete(analytics).where(eq(analytics.linkId, linkId));
    }

    // 3. Delete routing rules for user's links (cascade should handle this)
    for (const linkId of linkIds) {
      await db.delete(routingRules).where(eq(routingRules.linkId, linkId));
    }

    // 4. Delete user's links
    await db.delete(links).where(eq(links.createdBy, userId));

    // 5. Delete user's audit logs
    await db.delete(auditLogs).where(eq(auditLogs.userId, userId));

    // 6. Delete user account
    await db.delete(users).where(eq(users.id, userId));
  }

  async cleanupOldAnalytics(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db
      .delete(analytics)
      .where(lt(analytics.clickedAt, cutoffDate))
      .returning();

    return result.length;
  }

  // =============================================
  // TENANT OPERATIONS
  // =============================================

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    const [tenant] = await db
      .insert(tenants)
      .values({
        ...tenantData,
        privacySettings: tenantData.privacySettings || DEFAULT_PRIVACY_SETTINGS,
      })
      .returning();
    return tenant;
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug.toLowerCase()));
    return tenant;
  }

  async getTenants(): Promise<Tenant[]> {
    return await db
      .select()
      .from(tenants)
      .orderBy(desc(tenants.createdAt));
  }

  async updateTenant(id: string, updates: UpdateTenant): Promise<Tenant> {
    const [tenant] = await db
      .update(tenants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  async deleteTenant(id: string): Promise<void> {
    // Custom domains are cascaded, but we need to handle links and users
    // Links are not cascaded - they become orphaned (tenant = null)
    await db
      .update(links)
      .set({ tenantId: null })
      .where(eq(links.tenantId, id));

    // Users are not cascaded - they become orphaned (tenant = null)
    await db
      .update(users)
      .set({ tenantId: null })
      .where(eq(users.tenantId, id));

    // Delete the tenant (custom domains will cascade)
    await db.delete(tenants).where(eq(tenants.id, id));
  }

  // =============================================
  // CUSTOM DOMAIN OPERATIONS
  // =============================================

  async createCustomDomain(domainData: InsertCustomDomain): Promise<CustomDomain> {
    const verificationToken = randomBytes(32).toString("hex");
    const [domain] = await db
      .insert(customDomains)
      .values({
        ...domainData,
        domain: domainData.domain.toLowerCase(),
        verificationToken,
      })
      .returning();
    return domain;
  }

  async getCustomDomain(domain: string): Promise<CustomDomain | undefined> {
    const [result] = await db
      .select()
      .from(customDomains)
      .where(eq(customDomains.domain, domain.toLowerCase()));
    return result;
  }

  async getCustomDomainsByTenant(tenantId: string): Promise<CustomDomain[]> {
    return await db
      .select()
      .from(customDomains)
      .where(eq(customDomains.tenantId, tenantId))
      .orderBy(desc(customDomains.isPrimary), desc(customDomains.createdAt));
  }

  async verifyCustomDomain(id: string): Promise<CustomDomain> {
    const [domain] = await db
      .update(customDomains)
      .set({
        sslStatus: "active",
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customDomains.id, id))
      .returning();
    return domain;
  }

  async deleteCustomDomain(id: string): Promise<void> {
    await db.delete(customDomains).where(eq(customDomains.id, id));
  }

  // =============================================
  // TENANT-SCOPED OPERATIONS
  // =============================================

  async getLinksByTenant(tenantId: string): Promise<Link[]> {
    return await db
      .select()
      .from(links)
      .where(eq(links.tenantId, tenantId))
      .orderBy(desc(links.createdAt));
  }

  async getAnalyticsByTenant(tenantId: string): Promise<Analytics[]> {
    // Get all links for the tenant, then get their analytics
    const tenantLinks = await this.getLinksByTenant(tenantId);
    const linkIds = tenantLinks.map((l) => l.id);

    if (linkIds.length === 0) {
      return [];
    }

    // Build OR condition for all link IDs
    const conditions = linkIds.map((id) => eq(analytics.linkId, id));
    const whereClause = conditions.length === 1 ? conditions[0] : or(...conditions);

    return await db
      .select()
      .from(analytics)
      .where(whereClause)
      .orderBy(desc(analytics.clickedAt));
  }

  async cleanupTenantAnalytics(tenantId: string, retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Get all links for the tenant
    const tenantLinks = await this.getLinksByTenant(tenantId);
    const linkIds = tenantLinks.map((l) => l.id);

    if (linkIds.length === 0) {
      return 0;
    }

    let deletedCount = 0;
    for (const linkId of linkIds) {
      const result = await db
        .delete(analytics)
        .where(
          and(
            eq(analytics.linkId, linkId),
            lt(analytics.clickedAt, cutoffDate)
          )
        )
        .returning();
      deletedCount += result.length;
    }

    return deletedCount;
  }

  async cleanupTenantAuditLogs(tenantId: string, retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db
      .delete(auditLogs)
      .where(
        and(
          eq(auditLogs.tenantId, tenantId),
          lt(auditLogs.createdAt, cutoffDate)
        )
      )
      .returning();

    return result.length;
  }

  // =============================================
  // ENHANCED LINK CREATION WITH TENANT SUPPORT
  // =============================================

  async createLinkWithTenant(
    linkData: InsertLink,
    createdBy: string,
    tenantId?: string
  ): Promise<Link> {
    const shortCode = linkData.customAlias || this.generateShortCode();
    const [link] = await db
      .insert(links)
      .values({
        ...linkData,
        shortCode,
        createdBy,
        tenantId: tenantId || null,
      })
      .returning();
    return link;
  }

  // =============================================
  // ENHANCED ANALYTICS WITH PRIVACY SETTINGS
  // =============================================

  async trackClickWithPrivacy(
    linkId: string,
    rawData: {
      country?: string;
      region?: string;
      language?: string;
      deviceType?: string;
      referrer?: string;
      ip?: string;
    },
    privacySettings: PrivacySettings
  ): Promise<Analytics> {
    const preparedData = prepareAnalyticsData(rawData, privacySettings);

    const [analytic] = await db
      .insert(analytics)
      .values({
        linkId,
        country: preparedData.country,
        region: preparedData.region,
        language: preparedData.language,
        deviceType: preparedData.deviceType as any,
        referrer: preparedData.referrer,
        anonymizedIp: preparedData.anonymizedIp,
      })
      .returning();

    return analytic;
  }
}

export const storage = new DatabaseStorage();

