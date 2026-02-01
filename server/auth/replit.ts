import type { Express, RequestHandler } from "express";
import type { AuthProvider } from "./index";
import {
  setupAuth as setupReplitAuth,
  isAuthenticated as replitIsAuthenticated,
} from "../replitAuth";

/**
 * Replit Auth Provider (existing implementation wrapper)
 * Uses Replit's built-in OIDC authentication
 */
export class ReplitAuthProvider implements AuthProvider {
  name = "replit";

  async setup(app: Express): Promise<void> {
    await setupReplitAuth(app);
    console.log("[Auth] Replit provider initialized");
  }

  isAuthenticated: RequestHandler = replitIsAuthenticated;
}
