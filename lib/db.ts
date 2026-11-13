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

-- Scholarship committee
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  role text not null check (role in ('owner', 'chair', 'reviewer')),
  password_hash text not null,
  must_change boolean not null default false,
  totp_secret bytea,
  totp_pending bytea,
  totp_last_step bigint not null default 0,
  failed_logins int not null default 0,
  locked_until timestamptz,
  disabled boolean not null default false,
  last_seen timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists staff_sessions (
  token_hash text primary key,
  staff_id uuid not null references staff(id) on delete cascade,
  mfa_ok boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists staff_sessions_staff on staff_sessions(staff_id);
create table if not exists notes (
  id bigserial primary key,
  application_id uuid not null references applications(id) on delete cascade,
  staff_id uuid not null references staff(id),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists notes_application on notes(application_id);
create table if not exists scores (
  application_id uuid not null references applications(id) on delete cascade,
  staff_id uuid not null references staff(id),
  academic int not null check (academic between 1 and 5),
  need int not null check (need between 1 and 5),
  essays int not null check (essays between 1 and 5),
  potential int not null check (potential between 1 and 5),
  comment text,
  updated_at timestamptz not null default now(),
  primary key (application_id, staff_id)
);
create table if not exists audit (
  id bigserial primary key,
  staff_id uuid references staff(id),
  action text not null,
  target text,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists audit_created on audit(created_at desc);
alter table status_events add column if not exists staff_id uuid references staff(id);

-- Temporary passwords issued by the Office must be replaced at the next sign-in
alter table applicants add column if not exists must_change boolean not null default false;

-- Admission: offer reply and reporting to campus
alter table applications add column if not exists offer_reply_at timestamptz;
alter table applications add column if not exists arrival jsonb;
alter table applications add column if not exists enrolled_at timestamptz;

-- Allowance requests, opened only to admitted scholars
create table if not exists allowance_requests (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  slug text not null,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'declined', 'disbursed')),
  decision_note text,
  decided_by uuid references staff(id),
  decided_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists allowance_requests_application on allowance_requests(application_id);
create index if not exists allowance_requests_status on allowance_requests(status);
create table if not exists allowance_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references allowance_requests(id) on delete cascade,
  doc_key text not null,
  filename text not null,
  mime text not null,
  size int not null,
  content bytea not null,
  created_at timestamptz not null default now()
);
create index if not exists allowance_files_request on allowance_files(request_id);
alter table allowance_requests enable row level security;
alter table allowance_files enable row level security;
create index if not exists applications_status on applications(status);

-- Recommendations are no longer collected: the fourth score is character and potential
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = current_schema() and table_name = 'scores' and column_name = 'recommendation') then
    alter table scores rename column recommendation to potential;
  end if;
end $$;

-- Identification documents are collected after an offer is accepted, and verified by the Office
alter table documents add column if not exists review text not null default 'pending';
alter table documents add column if not exists review_note text;
alter table documents add column if not exists reviewed_by uuid references staff(id);
alter table documents add column if not exists reviewed_at timestamptz;
alter table applications add column if not exists cleared_at timestamptz;

-- Letters of admission: one per admitted candidate, verifiable by reference and code
create table if not exists letters (
  application_id uuid primary key references applications(id) on delete cascade,
  code text not null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- Every email the portal sends, so the Office can see what went out and resend it
create table if not exists emails (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid references applicants(id) on delete cascade,
  to_email text not null,
  kind text not null,
  subject text not null,
  params jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  provider_id text,
  error text,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists emails_created on emails(created_at desc);
create index if not exists emails_applicant on emails(applicant_id);

-- Self-service password reset links
create table if not exists password_resets (
  token_hash text primary key,
  applicant_id uuid not null references applicants(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_resets_applicant on password_resets(applicant_id);
-- Bank details for allowance payments: sealed with AES-256-GCM like documents; only the bank,
-- country and last four digits are kept in the clear, for display
create table if not exists payment_details (
  application_id uuid primary key references applications(id) on delete cascade,
  sealed bytea not null,
  bank_name text,
  country text,
  last4 text,
  updated_at timestamptz not null default now()
);
alter table payment_details enable row level security;
alter table allowance_requests add column if not exists paid_to text;
alter table letters enable row level security;
alter table emails enable row level security;
alter table password_resets enable row level security;
alter table staff enable row level security;
alter table staff_sessions enable row level security;
alter table notes enable row level security;
alter table scores enable row level security;
alter table audit enable row level security;
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
