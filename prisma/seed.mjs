// Creates the first admin account from ADMIN_EMAIL / ADMIN_PASSWORD in .env.  Run with: npm run seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Same clean-up of DATABASE_URL as src/lib/db.ts, so a pasted quote or doubled "?" does not stop the deploy.
function databaseUrl(raw = process.env.DATABASE_URL ?? "") {
  const value = raw.trim().replace(/^["']+|["']+$/g, "").trim();
  if (!value) return undefined;
  const [base, ...rest] = value.split("?");
  const params = new URLSearchParams(rest.join("&"));
  try {
    if (new URL(base).port === "6543") {
      params.set("pgbouncer", "true");
      if (!params.has("connection_limit")) params.set("connection_limit", "1");
    }
  } catch {
    return value;
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
const url = databaseUrl();
const db = new PrismaClient(url ? { datasourceUrl: url } : undefined);
const email = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
if (!email || password.length < 8) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) in .env first.");
  process.exit(1);
}
const passwordHash = await bcrypt.hash(password, 10);
await db.user.upsert({
  where: { email },
  create: { email, name: "Greenzone Admin", role: "ADMIN", passwordHash },
  update: { role: "ADMIN" }, // never overwrite a password the admin has changed
});
console.log(`Admin account ready: ${email}`);
await db.$disconnect();
