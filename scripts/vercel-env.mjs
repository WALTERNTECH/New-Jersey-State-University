// Pushes secrets from .local/secrets.json to Vercel production via stdin (never on the command line).
// Usage: node scripts/vercel-env.mjs [NAME ...]   (defaults to every secret the app needs)
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const file = ".local/secrets.json";
const s = JSON.parse(readFileSync(file, "utf8"));
s.ADMIN_SETUP_TOKEN ??= randomBytes(18).toString("base64url");
writeFileSync(file, JSON.stringify(s, null, 2));

const names = process.argv.slice(2).length ? process.argv.slice(2) : ["DATABASE_URL", "MASTER_KEY", "ADMIN_SETUP_TOKEN"];
for (const name of names) {
  spawnSync("vercel", ["env", "rm", name, "production", "--yes"], { shell: true, stdio: "ignore" });
  const r = spawnSync("vercel", ["env", "add", name, "production", "--sensitive"], { input: s[name], shell: true, encoding: "utf8" });
  console.log(name, r.status === 0 ? "set" : `failed: ${(r.stderr || r.stdout).split("\n").slice(-3).join(" ")}`);
}
