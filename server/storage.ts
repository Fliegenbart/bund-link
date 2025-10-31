import {
  users,
  links,
  routingRules,
  analytics,
  reports,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

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
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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
}

export const storage = new DatabaseStorage();

