import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isNeonUrl = process.env.DATABASE_URL.includes("neon.tech");

// Use Neon serverless for Neon URLs, standard pg for local/other PostgreSQL
let db: any;
let pool: any;

if (isNeonUrl) {
  // Neon Serverless (for Replit/Neon hosting)
  const { Pool, neonConfig } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-serverless");
  const ws = (await import("ws")).default;

  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  // Standard PostgreSQL (for local development / self-hosting)
  const pg = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");

  pool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { db, pool };
