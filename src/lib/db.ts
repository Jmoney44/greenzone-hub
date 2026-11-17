import { PrismaClient } from "@prisma/client";

/**
 * Tidies the DATABASE_URL setting before connecting, so common copy-and-paste slips do not take the site down:
 * surrounding quotes or spaces, a "?" typed twice, and a Supabase pooled connection (port 6543) missing the
 * settings Prisma needs for it (pgbouncer=true, otherwise requests fail with "prepared statement already exists").
 */
export function databaseUrl(raw = process.env.DATABASE_URL ?? "") {
  const value = raw.trim().replace(/^["']+|["']+$/g, "").trim();
  if (!value) return undefined;
  const [base, ...rest] = value.split("?");
  const params = new URLSearchParams(rest.join("&"));
  let pooled = false;
  try {
    pooled = new URL(base).port === "6543";
  } catch {
    return value; // leave anything unusual exactly as it was
  }
  if (pooled) {
    params.set("pgbouncer", "true");
    if (!params.has("connection_limit")) params.set("connection_limit", "1");
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

const g = globalThis as unknown as { prisma?: PrismaClient };
const url = databaseUrl();
export const db = g.prisma ?? new PrismaClient(url ? { datasourceUrl: url } : undefined);
if (process.env.NODE_ENV !== "production") g.prisma = db;
