// Creates .local/secrets.json (gitignored) once, and prints the SCRAM verifier for the database role.
import { randomBytes, pbkdf2Sync, createHmac, createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const file = ".local/secrets.json";
mkdirSync(".local", { recursive: true });
const s = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
s.DB_PASSWORD ??= randomBytes(24).toString("base64url");
s.MASTER_KEY ??= randomBytes(32).toString("base64");
writeFileSync(file, JSON.stringify(s, null, 2));

const salt = randomBytes(16);
const iter = 4096;
const salted = pbkdf2Sync(s.DB_PASSWORD, salt, iter, 32, "sha256");
const clientKey = createHmac("sha256", salted).update("Client Key").digest();
const storedKey = createHash("sha256").update(clientKey).digest();
const serverKey = createHmac("sha256", salted).update("Server Key").digest();
console.log("SCRAM-SHA-256" + "$" + iter + ":" + salt.toString("base64") + "$" + storedKey.toString("base64") + ":" + serverKey.toString("base64"));
