import type { RequestHandler, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { auditLogs } from "@shared/schema";

export interface AuditContext {
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
}

// Store audit context for the current request
declare global {
  namespace Express {
    interface Request {
      auditContext?: AuditContext;
    }
  }
}

/**
 * Log an audit event to the database
 */
export async function logAudit(
  req: Request,
  context: AuditContext
): Promise<void> {
  try {
    const user = req.user as any;
    const userId = user?.claims?.sub || null;

    await db.insert(auditLogs).values({
      userId,
      action: context.action,
      resourceType: context.resourceType,
      resourceId: context.resourceId || null,
      ipAddress: req.ip || req.socket.remoteAddress || null,
      userAgent: req.headers["user-agent"] || null,
      details: context.details || null,
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error("Audit logging failed:", error);
  }
}

/**
 * Middleware factory to automatically log actions after successful responses
 */
export function auditAction(
  action: string,
  resourceType: string,
  getResourceId?: (req: Request, res: Response) => string | undefined,
  getDetails?: (req: Request, res: Response) => Record<string, any> | undefined
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json to capture response and log audit
    res.json = function (body: any) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const resourceId = getResourceId ? getResourceId(req, res) : req.params.id;
        const details = getDetails ? getDetails(req, res) : undefined;

        // Log asynchronously, don't block response
        logAudit(req, {
          action,
          resourceType,
          resourceId,
          details,
        }).catch(console.error);
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Pre-built audit middleware for common actions
 */
export const auditMiddleware = {
  createLink: auditAction("CREATE", "link", (req, res) => {
    // Resource ID will be in the response body
    return undefined; // Will be captured from response
  }),

  updateLink: auditAction("UPDATE", "link", (req) => req.params.id),

  deleteLink: auditAction("DELETE", "link", (req) => req.params.id),

  createRoutingRule: auditAction("CREATE", "routing_rule"),

  createReport: auditAction("CREATE", "report"),

  updateReportStatus: auditAction("UPDATE", "report", (req) => req.params.id, (req) => ({
    newStatus: req.body.status,
  })),

  login: auditAction("LOGIN", "session"),

  logout: auditAction("LOGOUT", "session"),
};
