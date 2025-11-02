import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireRole, canAccessLink } from "./middleware/authorization";
import { insertLinkSchema, updateLinkSchema, insertReportSchema, insertRoutingRuleSchema, bulkLinksSchema, type BulkLinkResult } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Link routes (require at least 'local' role to create/manage links)
  app.post("/api/links", isAuthenticated, requireRole("local", "state", "federal"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertLinkSchema.parse(req.body);
      const link = await storage.createLink(validatedData, userId);
      res.json(link);
    } catch (error: any) {
      console.error("Error creating link:", error);
      res.status(400).json({ message: error.message || "Failed to create link" });
    }
  });

  app.post("/api/links/bulk", isAuthenticated, requireRole("local", "state", "federal"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const links = bulkLinksSchema.parse(req.body);
      
      const results: BulkLinkResult[] = [];
      for (let i = 0; i < links.length; i++) {
        const linkData = links[i];
        try {
          const validatedData = insertLinkSchema.parse({
            ...linkData,
            isActive: true,
          });
          const link = await storage.createLink(validatedData, userId);
          results.push({
            row: i + 1,
            success: true,
            shortCode: link.shortCode,
            link,
          });
        } catch (error: any) {
          results.push({
            row: i + 1,
            success: false,
            error: error.message || "Failed to create link",
          });
        }
      }
      
      res.json(results);
    } catch (error: any) {
      console.error("Error in bulk creation:", error);
      res.status(400).json({ message: error.message || "Failed to process bulk creation" });
    }
  });

  app.get("/api/links", isAuthenticated, requireRole("local", "state", "federal"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const links = await storage.getLinks(userId);
      res.json(links);
    } catch (error) {
      console.error("Error fetching links:", error);
      res.status(500).json({ message: "Failed to fetch links" });
    }
  });

  app.get("/api/links/:id", isAuthenticated, canAccessLink, async (req: any, res) => {
    try {
      const { id } = req.params;
      const link = await storage.getLink(id);
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }
      res.json(link);
    } catch (error) {
      console.error("Error fetching link:", error);
      res.status(500).json({ message: "Failed to fetch link" });
    }
  });

  app.get("/api/links/stats", isAuthenticated, requireRole("local", "state", "federal"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getLinkStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/links/preview/:shortCode", async (req, res) => {
    try {
      const { shortCode } = req.params;
      const link = await storage.getLinkByShortCode(shortCode);
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }

      // Determine appropriate destination URL based on routing rules
      const userAgent = req.headers["user-agent"] || "";
      const deviceType = userAgent.includes("Mobile") ? "mobile" : 
                        userAgent.includes("Tablet") ? "tablet" : "desktop";
      
      // Parse full language tag from Accept-Language (e.g., "de-DE" or "en-US")
      // Format: "de-DE,de;q=0.9,en;q=0.8" → extract "de-DE"
      const acceptLanguage = req.headers["accept-language"] || "de";
      const language = acceptLanguage.split(",")[0].split(";")[0].trim();
      
      // Country detection: Use X-Country-Code header for testing, fallback to DE
      // In production, replace with GeoIP service (e.g., MaxMind, ipapi.co)
      const country = (req.headers["x-country-code"] as string) || "DE";

      const destinationUrl = await storage.getDestinationUrl(link.id, {
        country,
        language,
        deviceType,
      });

      res.json({ ...link, destinationUrl });
    } catch (error) {
      console.error("Error fetching link:", error);
      res.status(500).json({ message: "Failed to fetch link" });
    }
  });

  app.post("/api/links/:shortCode/track", async (req, res) => {
    try {
      const { shortCode } = req.params;
      const link = await storage.getLinkByShortCode(shortCode);
      
      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }

      // Track analytics (fully anonymized, GDPR-compliant)
      const userAgent = req.headers["user-agent"] || "";
      const deviceType = userAgent.includes("Mobile") ? "mobile" : 
                        userAgent.includes("Tablet") ? "tablet" : "desktop";
      
      await storage.trackClick({
        linkId: link.id,
        deviceType,
        // In production, would use GeoIP service for country/region
        country: "DE",
        region: null,
        language: req.headers["accept-language"]?.split(",")[0].slice(0, 2) || "de",
        // Referrer intentionally omitted - contains potentially identifying information
        referrer: null,
      });

      await storage.incrementClickCount(link.id);

      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking click:", error);
      res.status(500).json({ message: "Failed to track click" });
    }
  });

  app.patch("/api/links/:id", isAuthenticated, canAccessLink, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateLinkSchema.parse(req.body);
      
      // Convert expiresAt string to Date if present
      const updates: any = { ...validatedData };
      if (updates.expiresAt) {
        updates.expiresAt = new Date(updates.expiresAt);
      }
      
      const link = await storage.updateLink(id, updates);
      res.json(link);
    } catch (error: any) {
      console.error("Error updating link:", error);
      res.status(400).json({ message: error.message || "Failed to update link" });
    }
  });

  app.delete("/api/links/:id", isAuthenticated, canAccessLink, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLink(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting link:", error);
      res.status(500).json({ message: "Failed to delete link" });
    }
  });

  // Routing rules (for smart routing)
  app.post("/api/links/:linkId/routing-rules", isAuthenticated, canAccessLink, async (req: any, res) => {
    try {
      const { linkId } = req.params;
      const validatedData = insertRoutingRuleSchema.parse({
        ...req.body,
        linkId,
      });
      const rule = await storage.createRoutingRule(validatedData);
      res.json(rule);
    } catch (error: any) {
      console.error("Error creating routing rule:", error);
      res.status(400).json({ message: error.message || "Failed to create routing rule" });
    }
  });

  app.get("/api/links/:linkId/routing-rules", isAuthenticated, canAccessLink, async (req: any, res) => {
    try {
      const { linkId } = req.params;
      const rules = await storage.getRoutingRulesByLink(linkId);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching routing rules:", error);
      res.status(500).json({ message: "Failed to fetch routing rules" });
    }
  });

  // Analytics routes (require at least 'local' role)
  app.get("/api/analytics/overview", isAuthenticated, requireRole("local", "state", "federal"), async (req, res) => {
    try {
      const analytics = await storage.getAnalyticsOverview();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/:linkId", isAuthenticated, canAccessLink, async (req, res) => {
    try {
      const { linkId } = req.params;
      const analytics = await storage.getAnalyticsByLink(linkId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching link analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Report routes (anyone can report, only state/federal can manage)
  app.post("/api/reports", async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(validatedData);
      res.json(report);
    } catch (error: any) {
      console.error("Error creating report:", error);
      res.status(400).json({ message: error.message || "Failed to create report" });
    }
  });

  app.get("/api/reports", isAuthenticated, requireRole("state", "federal"), async (req, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.patch("/api/reports/:id/status", isAuthenticated, requireRole("state", "federal"), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const report = await storage.updateReportStatus(id, status);
      res.json(report);
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
