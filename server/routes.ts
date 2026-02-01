import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { storage } from "./storage";
import { getAuthProvider } from "./auth";
import { requireRole, canAccessLink } from "./middleware/authorization";
import { auditMiddleware } from "./middleware/audit";
import { resolveTenant, getPrivacySettings, getDomainWhitelist, getWhitelistMode, initializeTenantCache } from "./middleware/tenant";
import { registerGdprRoutes } from "./routes/gdpr";
import { registerQrCodeRoutes } from "./routes/qrcode";
import { registerAIRoutes } from "./routes/ai";
import tenantRoutes from "./routes/tenants";
import { initGeoIP, getCountryFromIP, getClientIP } from "./lib/geoip";
import { initAI } from "./lib/ai";
import { validateDestinationUrl, isExternalLink, isTrustedDomain } from "./lib/domain";
import { getClientIp } from "./lib/privacy";
import { insertLinkSchema, updateLinkSchema, insertReportSchema, insertRoutingRuleSchema, bulkLinksSchema, type BulkLinkResult, DEFAULT_TRUSTED_DOMAINS } from "@shared/schema";

// Stricter rate limits for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: { message: "Too many authentication attempts, please try again later." },
});

const createLinkLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 links per minute
  message: { message: "Too many links created, please slow down." },
});

const trackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 tracking calls per minute per IP
  message: { message: "Too many tracking requests." },
});

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 reports per hour
  message: { message: "Too many reports submitted, please try again later." },
});

// Input validation schemas for public endpoints
const shortCodeSchema = z.string().regex(/^[a-zA-Z0-9_-]{3,50}$/, "Invalid short code format");

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize GeoIP database (non-blocking, falls back gracefully)
  await initGeoIP();

  // Initialize AI (Ollama) - non-blocking, falls back gracefully
  await initAI();

  // Initialize tenant domain cache
  await initializeTenantCache();

  // Auth middleware - uses AUTH_PROVIDER env to choose provider
  const authProvider = await getAuthProvider();
  await authProvider.setup(app);
  const isAuthenticated = authProvider.isAuthenticated;

  // Apply tenant resolution middleware to all routes
  app.use(resolveTenant());

  // GDPR compliance routes
  registerGdprRoutes(app);

  // QR Code generation routes
  registerQrCodeRoutes(app);

  // AI-powered features routes
  registerAIRoutes(app);

  // Tenant management routes
  app.use("/api/tenants", isAuthenticated, tenantRoutes);

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
  app.post("/api/links", createLinkLimiter, isAuthenticated, requireRole("local", "state", "federal"), auditMiddleware.createLink, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertLinkSchema.parse(req.body);

      // Validate destination URL against tenant whitelist
      const whitelist = [...DEFAULT_TRUSTED_DOMAINS, ...getDomainWhitelist(req)];
      const whitelistMode = getWhitelistMode(req);
      const validation = validateDestinationUrl(validatedData.destinationUrl, {
        whitelistMode,
        whitelist,
      });

      if (!validation.allowed) {
        return res.status(400).json({
          message: validation.reason,
          code: "WHITELIST_BLOCKED",
        });
      }

      // Create link with tenant association
      const tenantId = req.tenant?.id || (req.user as any).tenantId;
      const link = await storage.createLinkWithTenant(validatedData, userId, tenantId);
      res.json(link);
    } catch (error: any) {
      console.error("Error creating link:", error);
      res.status(400).json({ message: error.message || "Failed to create link" });
    }
  });

  app.post("/api/links/bulk", createLinkLimiter, isAuthenticated, requireRole("local", "state", "federal"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const links = bulkLinksSchema.parse(req.body);

      // Get whitelist settings
      const whitelist = [...DEFAULT_TRUSTED_DOMAINS, ...getDomainWhitelist(req)];
      const whitelistMode = getWhitelistMode(req);
      const tenantId = req.tenant?.id || (req.user as any).tenantId;

      const results: BulkLinkResult[] = [];
      for (let i = 0; i < links.length; i++) {
        const linkData = links[i];
        try {
          // Validate against whitelist
          const validation = validateDestinationUrl(linkData.destinationUrl, {
            whitelistMode,
            whitelist,
          });

          if (!validation.allowed) {
            results.push({
              row: i + 1,
              success: false,
              error: validation.reason,
            });
            continue;
          }

          const validatedData = insertLinkSchema.parse({
            ...linkData,
            isActive: true,
          });
          const link = await storage.createLinkWithTenant(validatedData, userId, tenantId);
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
      // Validate shortCode format to prevent injection
      const shortCode = shortCodeSchema.parse(req.params.shortCode);
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

      // Country detection: Use X-Country-Code header for testing, otherwise use GeoIP
      const testCountry = req.headers["x-country-code"] as string;
      const country = testCountry || getCountryFromIP(getClientIP(req));

      const destinationUrl = await storage.getDestinationUrl(link.id, {
        country,
        language,
        deviceType,
      });

      // DSGVO transparency: flag external links (outside trusted German/EU domains)
      // Combine default trusted domains with tenant-specific whitelist
      const whitelist = [...DEFAULT_TRUSTED_DOMAINS, ...getDomainWhitelist(req)];
      const isExternal = isExternalLink(destinationUrl, whitelist);

      res.json({ ...link, destinationUrl, isExternalLink: isExternal });
    } catch (error) {
      console.error("Error fetching link:", error);
      res.status(500).json({ message: "Failed to fetch link" });
    }
  });

  app.post("/api/links/:shortCode/track", trackingLimiter, async (req, res) => {
    try {
      // Validate shortCode format
      const shortCode = shortCodeSchema.parse(req.params.shortCode);
      const link = await storage.getLinkByShortCode(shortCode);

      if (!link) {
        return res.status(404).json({ message: "Link not found" });
      }

      // Get privacy settings (from tenant if link has one, otherwise defaults)
      const privacySettings = getPrivacySettings(req);

      // Prepare raw analytics data
      const userAgent = req.headers["user-agent"] || "";
      const deviceType = userAgent.includes("Mobile") ? "mobile" :
                        userAgent.includes("Tablet") ? "tablet" : "desktop";

      // Track analytics with privacy-aware data collection
      await storage.trackClickWithPrivacy(
        link.id,
        {
          country: getCountryFromIP(getClientIP(req)),
          region: undefined, // Would require GeoLite2-City database
          language: req.headers["accept-language"]?.split(",")[0].slice(0, 10) || "de",
          deviceType,
          referrer: req.headers.referer || undefined,
          ip: getClientIp(req),
        },
        privacySettings
      );

      await storage.incrementClickCount(link.id);

      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking click:", error);
      res.status(500).json({ message: "Failed to track click" });
    }
  });

  app.patch("/api/links/:id", isAuthenticated, canAccessLink, auditMiddleware.updateLink, async (req: any, res) => {
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

  app.delete("/api/links/:id", isAuthenticated, canAccessLink, auditMiddleware.deleteLink, async (req: any, res) => {
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
  app.post("/api/reports", reportLimiter, async (req, res) => {
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

  app.patch("/api/reports/:id/status", isAuthenticated, requireRole("state", "federal"), auditMiddleware.updateReportStatus, async (req, res) => {
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

  // Health check endpoint (for Docker, Kubernetes, load balancers)
  app.get("/api/health", async (_req, res) => {
    try {
      // Basic health check - could add DB ping for thorough check
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        error: "Service unavailable",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
