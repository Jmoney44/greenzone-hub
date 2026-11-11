/**
 * Startup file for cPanel "Setup Node.js App" (Upperlink and similar hosts).
 * It prepares the database on first run, creates the admin account, then starts the site.
 */
const fs = require("fs");
const path = require("path");
const http = require("http");

const root = __dirname;
process.env.NODE_ENV = "production";
process.chdir(root);

// Settings can come from the cPanel screen or from a .env file in this folder.
try { require("@next/env").loadEnvConfig(root); } catch {}

const dataDir = process.env.DATA_DIR || path.join(root, "data");
const dbFile = path.join(dataDir, "hub.db");
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = "file:" + dbFile;
if (!process.env.STORAGE_DIR) process.env.STORAGE_DIR = path.join(dataDir, "videos");
fs.mkdirSync(process.env.STORAGE_DIR, { recursive: true });

// First run: start from the empty database shipped with the site.
if (process.env.DATABASE_URL === "file:" + dbFile && !fs.existsSync(dbFile)) {
  fs.copyFileSync(path.join(root, "data-template", "hub.db"), dbFile);
  console.log("Created a new database at " + dbFile);
}

const { PrismaClient } = require("./prisma-client");
const prisma = new PrismaClient();
globalThis.prisma = prisma; // the site picks this connection up

async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 8) {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set (password needs 8+ characters): no admin account was created.");
    return;
  }
  if (await prisma.user.findUnique({ where: { email } })) return;
  const passwordHash = await require("bcryptjs").hash(password, 10);
  await prisma.user.create({ data: { email, name: "Greenzone Admin", role: "ADMIN", passwordHash } });
  console.log("Admin account created: " + email);
}

async function main() {
  await ensureAdmin();
  const port = parseInt(process.env.PORT, 10) || 3000;
  const app = require("next")({ dev: false, dir: root, hostname: "localhost", port });
  const handle = app.getRequestHandler();
  await app.prepare();
  http.createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log("Greenzone Learning Hub is running.");
  });
}

main().catch((err) => {
  console.error("The site could not start:", err);
  process.exit(1);
});
