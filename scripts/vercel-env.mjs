// Pushes DATABASE_URL and MASTER_KEY from .local/secrets.json to Vercel production via stdin (never on the command line).
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const s = JSON.parse(readFileSync(".local/secrets.json", "utf8"));
for (const name of ["DATABASE_URL", "MASTER_KEY"]) {
  spawnSync("vercel", ["env", "rm", name, "production", "--yes"], { shell: true, stdio: "ignore" });
  const r = spawnSync("vercel", ["env", "add", name, "production", "--sensitive"], { input: s[name], shell: true, encoding: "utf8" });
  console.log(name, r.status === 0 ? "set" : `failed: ${(r.stderr || r.stdout).split("\n").slice(-3).join(" ")}`);
}
