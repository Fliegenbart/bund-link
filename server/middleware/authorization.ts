import type { RequestHandler } from "express";
import { storage } from "../storage";

// Role hierarchy: federal > state > local
const roleHierarchy = {
  federal: 3,
  state: 2,
  local: 1,
};

export function requireRole(...allowedRoles: ("federal" | "state" | "local")[]): RequestHandler {
  return async (req: any, res, next) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const userRole = user.role || "local";
      
      // Check if user's role is in the allowed roles
      const hasPermission = allowedRoles.some(
        (allowedRole) => roleHierarchy[userRole] >= roleHierarchy[allowedRole]
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: "Insufficient permissions",
          required: allowedRoles,
          actual: userRole,
        });
      }

      // Attach user to request for later use
      req.authUser = user;
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: "Authorization failed" });
    }
  };
}

// Middleware to check if user can access a specific link
export const canAccessLink: RequestHandler = async (req: any, res, next) => {
  try {
    const userId = req.user?.claims?.sub;
    const linkId = req.params.id || req.params.linkId;

    if (!userId || !linkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    const link = await storage.getLink(linkId);

    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    // Federal users can access all links
    if (user?.role === "federal") {
      req.authUser = user;
      req.targetLink = link;
      return next();
    }

    // Users can only access their own links
    if (link.createdBy !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    req.authUser = user;
    req.targetLink = link;
    next();
  } catch (error) {
    console.error("Link access check error:", error);
    res.status(500).json({ message: "Access check failed" });
  }
};
