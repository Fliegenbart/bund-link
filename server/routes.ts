import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertLinkSchema, insertReportSchema } from "@shared/schema";

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

  // Link routes
  app.post("/api/links", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/links", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const links = await storage.getLinks(userId);
      res.json(links);
    } catch (error) {
      console.error("Error fetching links:", error);
      res.status(500).json({ message: "Failed to fetch links" });
    }
  });

  app.get("/api/links/stats", isAuthenticated, async (req: any, res) => {
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
      res.json(link);
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

      // Track analytics (anonymized)
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
        referrer: req.headers.referer || null,
      });

      await storage.incrementClickCount(link.id);

      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking click:", error);
      res.status(500).json({ message: "Failed to track click" });
    }
  });

  app.delete("/api/links/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLink(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting link:", error);
      res.status(500).json({ message: "Failed to delete link" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/overview", isAuthenticated, async (req, res) => {
    try {
      const analytics = await storage.getAnalyticsOverview();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/:linkId", isAuthenticated, async (req, res) => {
    try {
      const { linkId } = req.params;
      const analytics = await storage.getAnalyticsByLink(linkId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching link analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Report routes
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

  app.get("/api/reports", isAuthenticated, async (req, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.patch("/api/reports/:id/status", isAuthenticated, async (req, res) => {
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
