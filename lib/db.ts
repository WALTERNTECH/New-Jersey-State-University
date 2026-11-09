import "server-only";
import pg from "pg";
import path from "node:path";

// One query interface over node-postgres (Supabase in production) and PGlite (local development).
export type Row = Record<string, unknown>;
export interface Q {
  query<T extends Row = Row>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}
interface Db extends Q {
  exec(sql: string): Promise<void>;
  tx<T>(fn: (q: Q) => Promise<T>): Promise<T>;
}

export const SCHEMA = "njsu";

pg.types.setTypeParser(20, (v) => Number(v));
pg.types.setTypeParser(1082, (v) => v);

function pgDb(url: string): Db {
  const pool = new pg.Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 10_000,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
  });
  pool.on("error", (e) => console.error("pg pool error", e.message));
  const withClient = async <T>(fn: (c: pg.PoolClient) => Promise<T>) => {
    const c = await pool.connect();
    try {
      // The transaction pooler may hand over any backend, so every checkout names the schema.
      await c.query(`set search_path to ${SCHEMA}, public`);
      return await fn(c);
    } finally {
      c.release();
    }
  };
  return {
    query: (sql, params) => withClient((c) => c.query(sql, params as unknown[]) as never),
    exec: (sql) => withClient(async (c) => void (await c.query(sql))),
    tx: (fn) =>
      withClient(async (c) => {
        await c.query("begin");
        try {
          const out = await fn({ query: (s, p) => c.query(s, p as unknown[]) as never });
          await c.query("commit");
          return out;
        } catch (e) {
          await c.query("rollback").catch(() => {});
          throw e;
        }
      }),
  };
}

async function pgliteDb(dir: string): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  mkdirSync(dir, { recursive: true });
  const lite = new PGlite(dir);
  await lite.exec(`create schema if not exists ${SCHEMA}; set search_path to ${SCHEMA}, public;`);
  let chain: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>) => {
    const next = chain.then(fn, fn);
    chain = next.catch(() => {});
    return next;
  };
  return {
    query: (sql, params) => serial(() => lite.query(sql, params as unknown[]) as never),
    exec: (sql) => serial(async () => void (await lite.exec(sql))),
    tx: (fn) => serial(() => lite.transaction((t) => fn({ query: (s, p) => t.query(s, p as unknown[]) as never }))),
  };
}

const MIGRATION = `
create table if not exists applicants (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text not null,
  last_name text not null,
  password_hash text not null,
  failed_logins int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists sessions (
  token_hash text primary key,
  applicant_id uuid not null references applicants(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_applicant on sessions(applicant_id);
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null unique references applicants(id) on delete cascade,
  reference text not null unique,
  cycle text not null,
  status text not null default 'draft',
  eligibility jsonb not null default '{}'::jsonb,
  data jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  kind text not null,
  filename text not null,
  mime text not null,
  size int not null,
  content bytea not null,
  created_at timestamptz not null default now()
);
create index if not exists documents_application on documents(application_id);
create table if not exists status_events (
  id bigserial primary key,
  application_id uuid not null references applications(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists status_events_application on status_events(application_id);
alter table applicants enable row level security;
alter table sessions enable row level security;
alter table applications enable row level security;
alter table documents enable row level security;
alter table status_events enable row level security;
`;

const g = globalThis as unknown as { __njsuDb?: Promise<Db> };

async function open(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  const db = url ? pgDb(url) : await pgliteDb(path.join(process.cwd(), ".local", "pglite"));
  await db.exec(MIGRATION);
  return db;
}

export function db(): Promise<Db> {
  if (!g.__njsuDb) g.__njsuDb = open().catch((e) => ((g.__njsuDb = undefined), Promise.reject(e)));
  return g.__njsuDb;
}
