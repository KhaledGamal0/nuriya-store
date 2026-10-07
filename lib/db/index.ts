// One Postgres connection pool per server instance. Neon's pooled connection string works here;
// prepare:false keeps it compatible with Neon's connection pooler (PgBouncer, transaction mode).
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

type Db = ReturnType<typeof drizzle>;
export type Sql = postgres.Sql;
const g = globalThis as unknown as { __nuriyaDb?: Db; __nuriyaSql?: Sql };

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Raw SQL client (tagged templates, always parameterized). Used where we need explicit transactions and row locks. */
export function getSql(): Sql {
  if (!g.__nuriyaSql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    g.__nuriyaSql = postgres(url, { max: 5, prepare: false, idle_timeout: 20, connect_timeout: 10, onnotice: () => {} });
  }
  return g.__nuriyaSql;
}

/** Drizzle on the same pool, for simple reads. */
export function getDb(): Db {
  if (!g.__nuriyaDb) g.__nuriyaDb = drizzle(getSql());
  return g.__nuriyaDb;
}
