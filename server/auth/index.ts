import type { Express, RequestHandler } from "express";

/**
 * Auth Provider Interface
 * Allows switching between different auth providers (Replit, Keycloak, etc.)
 */
export interface AuthProvider {
  name: string;
  setup(app: Express): Promise<void>;
  isAuthenticated: RequestHandler;
}

/**
 * Get the configured auth provider based on environment
 */
export async function getAuthProvider(): Promise<AuthProvider> {
  const authType = process.env.AUTH_PROVIDER || "replit";

  switch (authType.toLowerCase()) {
    case "keycloak":
      const { KeycloakAuthProvider } = await import("./keycloak");
      return new KeycloakAuthProvider();

    case "local":
      const { LocalAuthProvider } = await import("./local");
      return new LocalAuthProvider();

    case "replit":
    default:
      // Return Replit auth as default (existing implementation)
      const { ReplitAuthProvider } = await import("./replit");
      return new ReplitAuthProvider();
  }
}
