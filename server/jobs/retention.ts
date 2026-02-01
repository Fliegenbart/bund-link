import { storage } from "../storage";
import { DEFAULT_PRIVACY_SETTINGS } from "@shared/schema";

// Default retention periods for platform-wide cleanup (when no tenant)
const DEFAULT_RETENTION_CONFIG = {
  analytics: DEFAULT_PRIVACY_SETTINGS.analyticsRetentionDays,
  auditLogs: DEFAULT_PRIVACY_SETTINGS.auditLogRetentionDays,
};

/**
 * Cleanup old analytics data based on retention policy
 * Handles both platform-wide and per-tenant cleanup
 */
export async function runRetentionCleanup(): Promise<void> {
  console.log("[Retention] Starting cleanup job...");

  try {
    // 1. Clean up platform-wide data (links without tenant)
    const deletedPlatformAnalytics = await storage.cleanupOldAnalytics(
      DEFAULT_RETENTION_CONFIG.analytics
    );
    console.log(`[Retention] Deleted ${deletedPlatformAnalytics} platform analytics records`);

    // 2. Clean up per-tenant data based on their privacy settings
    const tenants = await storage.getTenants();

    for (const tenant of tenants) {
      if (!tenant.isActive) continue;

      const settings = tenant.privacySettings || DEFAULT_PRIVACY_SETTINGS;

      try {
        // Clean up tenant analytics
        const deletedAnalytics = await storage.cleanupTenantAnalytics(
          tenant.id,
          settings.analyticsRetentionDays
        );

        // Clean up tenant audit logs
        const deletedAuditLogs = await storage.cleanupTenantAuditLogs(
          tenant.id,
          settings.auditLogRetentionDays
        );

        if (deletedAnalytics > 0 || deletedAuditLogs > 0) {
          console.log(
            `[Retention] Tenant "${tenant.slug}": Deleted ${deletedAnalytics} analytics, ${deletedAuditLogs} audit logs`
          );
        }
      } catch (error) {
        console.error(`[Retention] Failed to cleanup tenant "${tenant.slug}":`, error);
      }
    }

    console.log("[Retention] Cleanup job completed successfully");
  } catch (error) {
    console.error("[Retention] Cleanup job failed:", error);
  }
}

/**
 * Schedule retention cleanup to run daily
 * Simple implementation using setInterval
 */
export function scheduleRetentionCleanup(): void {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // Run immediately on startup
  runRetentionCleanup();

  // Then run daily
  setInterval(runRetentionCleanup, ONE_DAY_MS);

  console.log("[Retention] Scheduled daily cleanup job");
}
