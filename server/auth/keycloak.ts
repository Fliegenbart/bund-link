import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "../storage";
import type { AuthProvider } from "./index";

/**
 * Keycloak Auth Provider for Self-Hosting
 *
 * Required environment variables:
 * - KEYCLOAK_URL: e.g., https://keycloak.example.com
 * - KEYCLOAK_REALM: e.g., bundlink
 * - KEYCLOAK_CLIENT_ID: e.g., bundlink-app
 * - KEYCLOAK_CLIENT_SECRET: (optional, for confidential clients)
 * - SESSION_SECRET: Secret for session cookies
 * - DATABASE_URL: PostgreSQL connection string
 */
export class KeycloakAuthProvider implements AuthProvider {
  name = "keycloak";

  private getIssuerUrl(): string {
    const baseUrl = process.env.KEYCLOAK_URL;
    const realm = process.env.KEYCLOAK_REALM;

    if (!baseUrl || !realm) {
      throw new Error("KEYCLOAK_URL and KEYCLOAK_REALM must be set");
    }

    return `${baseUrl}/realms/${realm}`;
  }

  private getSession() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });

    return session({
      secret: process.env.SESSION_SECRET!,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: sessionTtl,
      },
    });
  }

  async setup(app: Express): Promise<void> {
    if (!process.env.KEYCLOAK_URL || !process.env.KEYCLOAK_REALM) {
      throw new Error("Keycloak configuration missing. Set KEYCLOAK_URL and KEYCLOAK_REALM");
    }

    app.set("trust proxy", 1);
    app.use(this.getSession());
    app.use(passport.initialize());
    app.use(passport.session());

    // Discover Keycloak OIDC configuration
    const issuerUrl = this.getIssuerUrl();
    const config = await client.discovery(
      new URL(issuerUrl),
      process.env.KEYCLOAK_CLIENT_ID!,
      process.env.KEYCLOAK_CLIENT_SECRET
    );

    const verify: VerifyFunction = async (tokens, verified) => {
      const claims = tokens.claims();
      const user: any = {
        claims,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: claims?.exp,
      };

      // Map Keycloak roles to BundLink roles
      // Expects Keycloak realm roles: bundlink-federal, bundlink-state, bundlink-local
      const realmRoles = (claims as any)?.realm_access?.roles || [];
      let role: "federal" | "state" | "local" = "local";
      if (realmRoles.includes("bundlink-federal")) {
        role = "federal";
      } else if (realmRoles.includes("bundlink-state")) {
        role = "state";
      }

      // Upsert user in database
      await storage.upsertUser({
        id: claims?.sub || "",
        email: (claims?.email as string) || "",
        firstName: (claims as any)?.given_name,
        lastName: (claims as any)?.family_name,
        profileImageUrl: (claims as any)?.picture,
        role,
      });

      verified(null, user);
    };

    // Register Keycloak strategy
    passport.use(
      "keycloak",
      new Strategy(
        {
          name: "keycloak",
          config,
          scope: "openid email profile offline_access",
          callbackURL: process.env.KEYCLOAK_CALLBACK_URL || "/api/callback",
        },
        verify
      )
    );

    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    // Auth routes
    app.get("/api/login", passport.authenticate("keycloak", {
      scope: ["openid", "email", "profile", "offline_access"],
    }));

    app.get("/api/callback", (req, res, next) => {
      passport.authenticate("keycloak", (err: any, user: any) => {
        if (err) return next(err);
        if (!user) return res.redirect("/api/login");

        // Regenerate session to prevent session fixation
        req.session.regenerate((regenerateErr) => {
          if (regenerateErr) return next(regenerateErr);

          req.logIn(user, (loginErr) => {
            if (loginErr) return next(loginErr);
            res.redirect("/");
          });
        });
      })(req, res, next);
    });

    app.get("/api/logout", (req, res) => {
      const issuerUrl = this.getIssuerUrl();
      const redirectUri = `${req.protocol}://${req.get("host")}`;

      req.logout(() => {
        // Redirect to Keycloak logout endpoint
        const logoutUrl = `${issuerUrl}/protocol/openid-connect/logout?client_id=${process.env.KEYCLOAK_CLIENT_ID}&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;
        res.redirect(logoutUrl);
      });
    });

    console.log(`[Auth] Keycloak provider initialized: ${issuerUrl}`);
  }

  isAuthenticated: RequestHandler = async (req, res, next) => {
    const user = req.user as any;

    if (!req.isAuthenticated() || !user?.expires_at) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const now = Math.floor(Date.now() / 1000);
    if (now <= user.expires_at) {
      return next();
    }

    // Token expired, try to refresh
    const refreshToken = user.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const issuerUrl = this.getIssuerUrl();
      const config = await client.discovery(
        new URL(issuerUrl),
        process.env.KEYCLOAK_CLIENT_ID!,
        process.env.KEYCLOAK_CLIENT_SECRET
      );

      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      user.access_token = tokenResponse.access_token;
      user.refresh_token = tokenResponse.refresh_token;
      user.claims = tokenResponse.claims();
      user.expires_at = user.claims?.exp;

      return next();
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
}
