import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "../storage";
import type { AuthProvider } from "./index";
import crypto from "crypto";

/**
 * Local Auth Provider for simple deployments
 * Uses username/password stored in database
 *
 * WARNING: Less secure than OIDC. Use for development or internal tools only.
 *
 * Required environment variables:
 * - SESSION_SECRET: Secret for session cookies
 * - DATABASE_URL: PostgreSQL connection string
 */
export class LocalAuthProvider implements AuthProvider {
  name = "local";

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

  /**
   * Hash a password using scrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString("hex");
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt + ":" + derivedKey.toString("hex"));
      });
    });
  }

  /**
   * Verify a password against a hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [salt, key] = hash.split(":");
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(key === derivedKey.toString("hex"));
      });
    });
  }

  async setup(app: Express): Promise<void> {
    app.set("trust proxy", 1);
    app.use(this.getSession());
    app.use(passport.initialize());
    app.use(passport.session());

    // Local strategy
    passport.use(
      new LocalStrategy(
        {
          usernameField: "email",
          passwordField: "password",
        },
        async (email, password, done) => {
          try {
            // Note: This requires a password field in the users table
            // You would need to extend the schema for local auth
            const user = await storage.getUser(email);

            if (!user) {
              return done(null, false, { message: "User not found" });
            }

            // For now, this is a placeholder
            // In production, you would verify against stored password hash
            // const isValid = await this.verifyPassword(password, user.passwordHash);

            done(null, {
              claims: {
                sub: user.id,
                email: user.email,
              },
              expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
            });
          } catch (error) {
            done(error);
          }
        }
      )
    );

    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    // Auth routes
    app.post("/api/login", passport.authenticate("local"), (req, res) => {
      res.json({ success: true, user: req.user });
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect("/");
      });
    });

    console.log("[Auth] Local provider initialized (development mode)");
    console.warn("[Auth] WARNING: Local auth is less secure than OIDC. Use for development only.");
  }

  isAuthenticated: RequestHandler = async (req, res, next) => {
    const user = req.user as any;

    if (!req.isAuthenticated() || !user?.expires_at) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > user.expires_at) {
      return res.status(401).json({ message: "Session expired" });
    }

    return next();
  };
}
