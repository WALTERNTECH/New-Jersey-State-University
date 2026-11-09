// Finds the Supabase pooler host that accepts njsu_api, saves DATABASE_URL to .local/secrets.json,
// and checks the role is confined to its own schema. Prints no secrets.
import pg from "pg";
import { readFileSync, writeFileSync } from "node:fs";

const file = ".local/secrets.json";
const s = JSON.parse(readFileSync(file, "utf8"));
const ref = "mrsxvdxaoogamhkdqejp";
for (const host of ["aws-0-eu-central-1.pooler.supabase.com", "aws-1-eu-central-1.pooler.supabase.com"]) {
  const url = `postgresql://njsu_api.${ref}:${encodeURIComponent(s.DB_PASSWORD)}@${host}:6543/postgres`;
  const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await c.connect();
    const who = await c.query("select current_user, current_setting('search_path') as sp");
    console.log("connected via", host, who.rows[0]);
    for (const t of ["mjengo", "nextgen", "konnect", "auth"]) {
      const r = await c.query("select has_schema_privilege($1, 'usage') as u", [t]).catch((e) => ({ rows: [{ u: e.message }] }));
      console.log("usage on", t, "=", r.rows[0].u);
    }
    s.DATABASE_URL = url;
    writeFileSync(file, JSON.stringify(s, null, 2));
    await c.end();
    break;
  } catch (e) {
    console.log("failed via", host, e.message);
    await c.end().catch(() => {});
  }
}
