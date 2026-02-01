import { storage } from "../storage";

// Retention periods in days
const RETENTION_CONFIG = {
  analytics: 90, // 90 days for analytics data
  auditLogs: 365, // 1 year for audit logs
};

/**
 * Cleanup old analytics data based on retention policy
 * Should be run daily via cron or on server startup
 */
export async function runRetentionCleanup(): Promise<void> {
  console.log("[Retention] Starting cleanup job...");

  try {
    // Clean up old analytics
    const deletedAnalytics = await storage.cleanupOldAnalytics(RETENTION_CONFIG.analytics);
    console.log(`[Retention] Deleted ${deletedAnalytics} old analytics records`);

    // TODO: Add audit log cleanup when needed
    // const deletedAuditLogs = await storage.cleanupOldAuditLogs(RETENTION_CONFIG.auditLogs);

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
