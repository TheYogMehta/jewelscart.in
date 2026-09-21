import { Pool } from "pg";

const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

interface PgCache {
  pool: Pool | null;
  promise: Promise<Pool> | null;
}

declare global {
  var pgCache: PgCache | undefined;
}

const cached: PgCache = global.pgCache ?? {
  pool: null,
  promise: null,
};

global.pgCache = cached;

function getSslConfig(connectionString: string) {
  if (
    connectionString.includes("sslmode=require") ||
    connectionString.includes("ssl=true") ||
    process.env.POSTGRES_SSL === "true"
  ) {
    if (process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED === "false") {
      return { rejectUnauthorized: false as const };
    }
    return { rejectUnauthorized: true as const };
  }

  return false;
}

export async function connectDB(): Promise<Pool> {
  if (!POSTGRES_URL) {
    throw new Error(
      "Missing POSTGRES_URL or DATABASE_URL environment variable",
    );
  }

  if (cached.pool) {
    return cached.pool;
  }

  if (!cached.promise) {
    const pool = new Pool({
      connectionString: POSTGRES_URL,
      ssl: getSslConfig(POSTGRES_URL),
    });
    cached.promise = Promise.resolve(pool);
  }

  cached.pool = await cached.promise;
  return cached.pool;
}
