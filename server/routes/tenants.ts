/**
 * Tenant Management Routes
 *
 * Provides API endpoints for managing tenants (organizations/authorities),
 * custom domains, privacy settings, and domain whitelists.
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import {
  insertTenantSchema,
  updateTenantSchema,
  insertCustomDomainSchema,
  DEFAULT_TRUSTED_DOMAINS,
} from "@shared/schema";
import { requireRole } from "../middleware/authorization";
import { isValidDomainPattern, normalizeDomainPattern } from "../lib/domain";

const router = Router();

// =============================================
// TENANT CRUD OPERATIONS
// =============================================

/**
 * GET /api/tenants
 * List all tenants (federal role required)
 */
router.get("/", requireRole("federal"), async (_req: Request, res: Response) => {
  try {
    const tenants = await storage.getTenants();
    res.json(tenants);
  } catch (error) {
    console.error("Failed to list tenants:", error);
    res.status(500).json({ error: "Failed to list tenants" });
  }
});

/**
 * POST /api/tenants
 * Create a new tenant (federal role required)
 */
router.post("/", requireRole("federal"), async (req: Request, res: Response) => {
  try {
    const data = insertTenantSchema.parse(req.body);

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(data.slug)) {
      return res.status(400).json({
        error: "Invalid slug format",
        message: "Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.",
      });
    }

    // Check if slug is unique
    const existingTenant = await storage.getTenantBySlug(data.slug);
    if (existingTenant) {
      return res.status(409).json({
        error: "Slug already exists",
        message: "Ein Mandant mit diesem Slug existiert bereits.",
      });
    }

    // Validate domain patterns if provided
    if (data.domainWhitelist) {
      for (const pattern of data.domainWhitelist as string[]) {
        if (!isValidDomainPattern(pattern)) {
          return res.status(400).json({
            error: "Invalid domain pattern",
            message: `Ungültiges Domain-Muster: ${pattern}`,
          });
        }
      }
    }

    const tenant = await storage.createTenant(data);
    res.status(201).json(tenant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Failed to create tenant:", error);
    res.status(500).json({ error: "Failed to create tenant" });
  }
});

/**
 * GET /api/tenants/:id
 * Get a specific tenant
 */
router.get("/:id", requireRole("state"), async (req: Request, res: Response) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Check access (state/local can only see their own tenant)
    const user = req.user as any;
    if (user.role !== "federal" && user.tenantId !== tenant.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(tenant);
  } catch (error) {
    console.error("Failed to get tenant:", error);
    res.status(500).json({ error: "Failed to get tenant" });
  }
});

/**
 * PATCH /api/tenants/:id
 * Update a tenant
 */
router.patch("/:id", requireRole("state"), async (req: Request, res: Response) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Check access
    const user = req.user as any;
    if (user.role !== "federal" && user.tenantId !== tenant.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updates = updateTenantSchema.parse(req.body);

    // Validate domain patterns if provided
    if (updates.domainWhitelist) {
      for (const pattern of updates.domainWhitelist) {
        if (!isValidDomainPattern(pattern)) {
          return res.status(400).json({
            error: "Invalid domain pattern",
            message: `Ungültiges Domain-Muster: ${pattern}`,
          });
        }
      }
      // Normalize patterns
      updates.domainWhitelist = updates.domainWhitelist.map(normalizeDomainPattern);
    }

    const updated = await storage.updateTenant(req.params.id, updates);
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Failed to update tenant:", error);
    res.status(500).json({ error: "Failed to update tenant" });
  }
});

/**
 * DELETE /api/tenants/:id
 * Delete a tenant (federal only)
 */
router.delete("/:id", requireRole("federal"), async (req: Request, res: Response) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    await storage.deleteTenant(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete tenant:", error);
    res.status(500).json({ error: "Failed to delete tenant" });
  }
});

// =============================================
// CUSTOM DOMAIN OPERATIONS
// =============================================

/**
 * GET /api/tenants/:id/domains
 * List custom domains for a tenant
 */
router.get("/:id/domains", requireRole("state"), async (req: Request, res: Response) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Check access
    const user = req.user as any;
    if (user.role !== "federal" && user.tenantId !== tenant.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const domains = await storage.getCustomDomainsByTenant(req.params.id);
    res.json(domains);
  } catch (error) {
    console.error("Failed to list custom domains:", error);
    res.status(500).json({ error: "Failed to list custom domains" });
  }
});

/**
 * POST /api/tenants/:id/domains
 * Add a custom domain to a tenant
 */
router.post("/:id/domains", requireRole("state"), async (req: Request, res: Response) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Check access
    const user = req.user as any;
    if (user.role !== "federal" && user.tenantId !== tenant.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const data = insertCustomDomainSchema.parse({
      ...req.body,
      tenantId: req.params.id,
    });

    // Check if domain already exists
    const existingDomain = await storage.getCustomDomain(data.domain);
    if (existingDomain) {
      return res.status(409).json({
        error: "Domain already exists",
        message: "Diese Domain ist bereits registriert.",
      });
    }

    const domain = await storage.createCustomDomain(data);

    res.status(201).json({
      ...domain,
      verificationInstructions: {
        type: "DNS TXT record",
        name: `_bundlink-verify.${data.domain}`,
        value: domain.verificationToken,
        message: "Fügen Sie diesen TXT-Record zu Ihrer DNS-Konfiguration hinzu.",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Failed to add custom domain:", error);
    res.status(500).json({ error: "Failed to add custom domain" });
  }
});

/**
 * POST /api/tenants/:id/domains/:domainId/verify
 * Verify a custom domain
 */
router.post(
  "/:id/domains/:domainId/verify",
  requireRole("state"),
  async (req: Request, res: Response) => {
    try {
      const tenant = await storage.getTenant(req.params.id);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Check access
      const user = req.user as any;
      if (user.role !== "federal" && user.tenantId !== tenant.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // In a production environment, you would:
      // 1. Perform DNS lookup for the TXT record
      // 2. Verify the token matches
      // 3. Check SSL certificate
      // For now, we just mark it as verified

      const domain = await storage.verifyCustomDomain(req.params.domainId);
      res.json(domain);
    } catch (error) {
      console.error("Failed to verify domain:", error);
      res.status(500).json({ error: "Failed to verify domain" });
    }
  }
);

/**
 * DELETE /api/tenants/:id/domains/:domainId
 * Remove a custom domain
 */
router.delete(
  "/:id/domains/:domainId",
  requireRole("state"),
  async (req: Request, res: Response) => {
    try {
      const tenant = await storage.getTenant(req.params.id);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Check access
      const user = req.user as any;
      if (user.role !== "federal" && user.tenantId !== tenant.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteCustomDomain(req.params.domainId);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete domain:", error);
      res.status(500).json({ error: "Failed to delete domain" });
    }
  }
);

// =============================================
// PRIVACY & WHITELIST SETTINGS
// =============================================

/**
 * GET /api/tenants/:id/privacy-settings
 * Get privacy settings for a tenant
 */
router.get("/:id/privacy-settings", requireRole("state"), async (req: Request, res: Response) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Check access
    const user = req.user as any;
    if (user.role !== "federal" && user.tenantId !== tenant.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      privacySettings: tenant.privacySettings,
      whitelistMode: tenant.whitelistMode,
      domainWhitelist: tenant.domainWhitelist,
      defaultTrustedDomains: DEFAULT_TRUSTED_DOMAINS,
    });
  } catch (error) {
    console.error("Failed to get privacy settings:", error);
    res.status(500).json({ error: "Failed to get privacy settings" });
  }
});

/**
 * PATCH /api/tenants/:id/privacy-settings
 * Update privacy settings for a tenant
 */
router.patch("/:id/privacy-settings", requireRole("state"), async (req: Request, res: Response) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Check access
    const user = req.user as any;
    if (user.role !== "federal" && user.tenantId !== tenant.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updateSchema = z.object({
      privacySettings: z.object({
        ipAnonymization: z.enum(["none", "partial", "full"]),
        analyticsRetentionDays: z.number().min(0).max(3650),
        auditLogRetentionDays: z.number().min(0).max(3650),
        collectReferrer: z.boolean(),
        collectDeviceType: z.boolean(),
        collectGeoData: z.boolean(),
      }).optional(),
      whitelistMode: z.enum(["warn", "block", "allow"]).optional(),
      domainWhitelist: z.array(z.string()).optional(),
    });

    const updates = updateSchema.parse(req.body);

    // Validate domain patterns
    if (updates.domainWhitelist) {
      for (const pattern of updates.domainWhitelist) {
        if (!isValidDomainPattern(pattern)) {
          return res.status(400).json({
            error: "Invalid domain pattern",
            message: `Ungültiges Domain-Muster: ${pattern}`,
          });
        }
      }
      updates.domainWhitelist = updates.domainWhitelist.map(normalizeDomainPattern);
    }

    const updated = await storage.updateTenant(req.params.id, updates);

    res.json({
      privacySettings: updated.privacySettings,
      whitelistMode: updated.whitelistMode,
      domainWhitelist: updated.domainWhitelist,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Failed to update privacy settings:", error);
    res.status(500).json({ error: "Failed to update privacy settings" });
  }
});

// =============================================
// TENANT ANALYTICS & CLEANUP
// =============================================

/**
 * GET /api/tenants/:id/stats
 * Get statistics for a tenant
 */
router.get("/:id/stats", requireRole("state"), async (req: Request, res: Response) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Check access
    const user = req.user as any;
    if (user.role !== "federal" && user.tenantId !== tenant.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const links = await storage.getLinksByTenant(req.params.id);
    const domains = await storage.getCustomDomainsByTenant(req.params.id);

    const totalLinks = links.length;
    const activeLinks = links.filter((l) => l.isActive).length;
    const totalClicks = links.reduce((sum, l) => sum + l.clickCount, 0);

    res.json({
      totalLinks,
      activeLinks,
      totalClicks,
      customDomains: domains.length,
      verifiedDomains: domains.filter((d) => d.sslStatus === "active").length,
    });
  } catch (error) {
    console.error("Failed to get tenant stats:", error);
    res.status(500).json({ error: "Failed to get tenant stats" });
  }
});

/**
 * POST /api/tenants/:id/cleanup
 * Run data cleanup for a tenant (based on retention settings)
 */
router.post("/:id/cleanup", requireRole("state"), async (req: Request, res: Response) => {
  try {
    const tenant = await storage.getTenant(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Check access
    const user = req.user as any;
    if (user.role !== "federal" && user.tenantId !== tenant.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const settings = tenant.privacySettings;
    if (!settings) {
      return res.status(400).json({ error: "No privacy settings configured" });
    }

    const analyticsDeleted = await storage.cleanupTenantAnalytics(
      req.params.id,
      settings.analyticsRetentionDays
    );
    const auditLogsDeleted = await storage.cleanupTenantAuditLogs(
      req.params.id,
      settings.auditLogRetentionDays
    );

    res.json({
      message: "Cleanup completed",
      analyticsDeleted,
      auditLogsDeleted,
    });
  } catch (error) {
    console.error("Failed to run cleanup:", error);
    res.status(500).json({ error: "Failed to run cleanup" });
  }
});

export default router;
