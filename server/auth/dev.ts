import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "../storage";
import type { AuthProvider } from "./index";

/**
 * Development Auth Provider
 * Auto-creates a test user and logs them in
 * ONLY FOR LOCAL DEVELOPMENT
 */
export class DevAuthProvider implements AuthProvider {
  name = "dev";

  private getSession() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000;
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true, // Auto-create for dev
      ttl: sessionTtl,
      tableName: "sessions",
    });

    return session({
      secret: process.env.SESSION_SECRET || "dev-secret",
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // Allow HTTP in dev
        sameSite: "lax",
        maxAge: sessionTtl,
      },
    });
  }

  async setup(app: Express): Promise<void> {
    app.set("trust proxy", 1);
    app.use(this.getSession());

    // Create test user if not exists
    const testUser = await storage.upsertUser({
      id: "dev-user-1",
      email: "admin@bundlink.dev",
      firstName: "Admin",
      lastName: "Developer",
      role: "federal", // Full access for testing
    });

    console.log("[Auth] Dev provider initialized");
    console.log("[Auth] Test user: admin@bundlink.dev (federal role)");

    // Auto-login route
    app.get("/api/login", (req: any, res) => {
      req.session.user = {
        claims: {
          sub: testUser.id,
          email: testUser.email,
        },
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };
      req.session.save(() => {
        res.redirect("/");
      });
    });

    app.get("/api/logout", (req: any, res) => {
      req.session.destroy(() => {
        res.redirect("/");
      });
    });

    app.get("/api/auth/user", (req: any, res) => {
      if (req.session?.user) {
        res.json(testUser);
      } else {
        res.status(401).json({ message: "Not logged in" });
      }
    });
  }

  isAuthenticated: RequestHandler = async (req: any, res, next) => {
    if (req.session?.user) {
      // Attach user info for other middleware
      req.user = req.session.user;
      return next();
    }
    return res.status(401).json({ message: "Unauthorized - visit /api/login first" });
  };
}
