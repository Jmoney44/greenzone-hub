// Creates the first admin account from ADMIN_EMAIL / ADMIN_PASSWORD in .env.  Run with: npm run seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
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
