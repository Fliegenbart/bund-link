/**
 * Tenant resolution middleware
 *
 * Resolves the current tenant based on:
 * 1. Custom domain (for white-label deployments)
 * 2. User's tenant association (for authenticated requests)
 * 3. Default tenant (for platform-wide resources)
 */

import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { customDomains, tenants, users, type Tenant, DEFAULT_PRIVACY_SETTINGS } from "@shared/schema";
import { eq } from "drizzle-orm";

// Extend Express Request type to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
      tenantId?: string;
    }
  }
}

// Cache for domain -> tenant mappings (refreshed periodically)
const domainCache = new Map<string, Tenant>();
const CACHE_TTL = 60 * 1000; // 1 minute
let lastCacheRefresh = 0;

/**
 * Refresh the domain cache from database
 */
async function refreshDomainCache(): Promise<void> {
  try {
    const domains = await db
      .select({
        domain: customDomains.domain,
        tenant: tenants,
      })
      .from(customDomains)
      .innerJoin(tenants, eq(customDomains.tenantId, tenants.id))
      .where(eq(tenants.isActive, true));

    domainCache.clear();
    for (const { domain, tenant } of domains) {
      domainCache.set(domain.toLowerCase(), tenant);
    }
    lastCacheRefresh = Date.now();
  } catch (error) {
    console.error("Failed to refresh domain cache:", error);
  }
}

/**
 * Get tenant by custom domain
 */
async function getTenantByDomain(hostname: string): Promise<Tenant | undefined> {
  const normalizedHostname = hostname.toLowerCase();

  // Check cache freshness
  if (Date.now() - lastCacheRefresh > CACHE_TTL) {
    await refreshDomainCache();
  }

  return domainCache.get(normalizedHostname);
}

/**
 * Get tenant by ID
 */
async function getTenantById(tenantId: string): Promise<Tenant | undefined> {
  const result = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  return result[0];
}

/**
 * Middleware to resolve tenant from request
 *
 * Resolution order:
 * 1. Custom domain (Host header)
 * 2. User's tenantId (from session)
 * 3. No tenant (platform-wide)
 */
export function resolveTenant() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      let tenant: Tenant | undefined;

      // 1. Try to resolve from custom domain
      const hostname = req.hostname || req.headers.host?.split(":")[0];
      if (hostname) {
        tenant = await getTenantByDomain(hostname);
      }

      // 2. Try to resolve from authenticated user's tenant
      if (!tenant && req.user && (req.user as any).tenantId) {
        tenant = await getTenantById((req.user as any).tenantId);
      }

      // Set tenant context on request
      if (tenant) {
        req.tenant = tenant;
        req.tenantId = tenant.id;
      }

      next();
    } catch (error) {
      console.error("Tenant resolution error:", error);
      next(); // Continue without tenant on error
    }
  };
}

/**
 * Middleware to require a tenant context
 * Use for routes that must be scoped to a tenant
 */
export function requireTenant() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(400).json({
        error: "Tenant context required",
        message: "Diese Aktion erfordert einen Mandanten-Kontext.",
      });
    }
    next();
  };
}

/**
 * Get effective privacy settings for the current context
 * Falls back to defaults if no tenant is set
 */
export function getPrivacySettings(req: Request) {
  if (req.tenant?.privacySettings) {
    return req.tenant.privacySettings;
  }
  return DEFAULT_PRIVACY_SETTINGS;
}

/**
 * Get effective domain whitelist for the current context
 */
export function getDomainWhitelist(req: Request): string[] {
  if (req.tenant?.domainWhitelist) {
    return req.tenant.domainWhitelist as string[];
  }
  return [];
}

/**
 * Get whitelist mode for the current context
 */
export function getWhitelistMode(req: Request): "warn" | "block" | "allow" {
  if (req.tenant?.whitelistMode) {
    return req.tenant.whitelistMode as "warn" | "block" | "allow";
  }
  return "warn"; // Default to warn mode
}

/**
 * Check if user belongs to the tenant
 */
export function userBelongsToTenant(user: any, tenantId: string | undefined): boolean {
  if (!tenantId) return true; // No tenant restriction
  if (!user) return false;
  if (!user.tenantId) return false; // User has no tenant
  return user.tenantId === tenantId;
}

/**
 * Middleware to ensure user belongs to the current tenant
 */
export function requireTenantMembership() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return next(); // No tenant context, allow
    }

    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Anmeldung erforderlich.",
      });
    }

    if (!userBelongsToTenant(req.user, req.tenant.id)) {
      return res.status(403).json({
        error: "Tenant access denied",
        message: "Sie haben keinen Zugriff auf diesen Mandanten.",
      });
    }

    next();
  };
}

/**
 * Initialize the domain cache on startup
 */
export async function initializeTenantCache(): Promise<void> {
  await refreshDomainCache();
  console.log(`Tenant cache initialized with ${domainCache.size} custom domains`);
}
