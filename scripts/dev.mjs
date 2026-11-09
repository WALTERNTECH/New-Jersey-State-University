// Runs the site locally from the repo root (PGlite keeps data in .local/pglite).
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const next = path.join(root, "node_modules", "next", "dist", "bin", "next");
const port = process.argv[2] ?? "5330";
const child = spawn(process.execPath, [next, "dev", "-p", port], { cwd: root, stdio: "inherit", env: { ...process.env } });
const stop = () => (child.kill(), process.exit(0));
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
