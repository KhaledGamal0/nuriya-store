// One Postgres connection pool per server instance. Neon's pooled connection string works here;
// prepare:false keeps it compatible with Neon's connection pooler (PgBouncer, transaction mode).
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

type Db = ReturnType<typeof drizzle>;
const g = globalThis as unknown as { __nuriyaDb?: Db };

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): Db {
  if (!g.__nuriyaDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const client = postgres(url, { max: 5, prepare: false, idle_timeout: 20, connect_timeout: 10 });
    g.__nuriyaDb = drizzle(client);
  }
  return g.__nuriyaDb;
}
