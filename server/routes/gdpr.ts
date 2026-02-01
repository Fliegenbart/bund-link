import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { logAudit } from "../middleware/audit";

/**
 * GDPR Compliance Routes
 * - Data Export (Subject Access Request)
 * - Data Deletion (Right to Erasure)
 * - Retention Policy enforcement
 */
export function registerGdprRoutes(app: Express) {
  /**
   * GET /api/gdpr/export
   * Export all user data (Subject Access Request - DSGVO Art. 15)
   */
  app.get("/api/gdpr/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Collect all user data
      const userData = await storage.exportUserData(userId);

      // Log the export request
      await logAudit(req, {
        action: "EXPORT",
        resourceType: "user_data",
        resourceId: userId,
        details: { exportType: "full" },
      });

      // Set headers for download
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="bundlink-data-export-${new Date().toISOString().split("T")[0]}.json"`
      );

      res.json({
        exportDate: new Date().toISOString(),
        userId,
        data: userData,
      });
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  /**
   * DELETE /api/gdpr/delete
   * Delete all user data (Right to Erasure - DSGVO Art. 17)
   */
  app.delete("/api/gdpr/delete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Log the deletion request BEFORE deleting
      await logAudit(req, {
        action: "DELETE_REQUEST",
        resourceType: "user_data",
        resourceId: userId,
        details: { requestType: "gdpr_erasure" },
      });

      // Delete all user data
      await storage.deleteUserData(userId);

      // Logout the user after deletion
      req.logout(() => {
        res.json({
          success: true,
          message: "All your data has been deleted. You have been logged out.",
        });
      });
    } catch (error) {
      console.error("Error deleting user data:", error);
      res.status(500).json({ message: "Failed to delete user data" });
    }
  });

  /**
   * GET /api/gdpr/retention-info
   * Get information about data retention policies
   */
  app.get("/api/gdpr/retention-info", async (_req, res) => {
    res.json({
      analytics: {
        retentionDays: 90,
        description: "Click analytics are automatically deleted after 90 days",
      },
      sessions: {
        retentionDays: 7,
        description: "Login sessions expire after 7 days of inactivity",
      },
      auditLogs: {
        retentionDays: 365,
        description: "Audit logs are kept for 1 year for security purposes",
      },
      links: {
        retention: "Until manually deleted or expired",
        description: "Links are kept until you delete them or they expire",
      },
    });
  });
}
