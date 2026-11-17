import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const REQUIRED = ["DATABASE_URL", "DIRECT_URL", "SUPABASE_URL", "SUPABASE_SERVICE_KEY", "SELAR_WEBHOOK_KEY", "ADMIN_EMAIL", "ADMIN_PASSWORD", "SITE_URL"];

/** Plain-words explanation of the most common database connection problems. */
function explain(code: string, message: string) {
  if (/prepared statement/i.test(message)) return "DATABASE_URL must use the Supabase pooled connection on port 6543 with ?pgbouncer=true at the end.";
  if (code === "P1000" || /authentication failed|password authentication|credentials .* not valid/i.test(message)) return "The database password in DATABASE_URL is wrong. Copy the string again from Supabase and put your database password in it (no square brackets).";
  if (code === "P1001" || /can't reach database server/i.test(message)) return "The database address in DATABASE_URL cannot be reached. Use the pooler address from Supabase > Connect > ORMs (it ends in pooler.supabase.com:6543), not db.xxx.supabase.co.";
  if (code === "P2021" || /does not exist/i.test(message)) return "The database tables have not been created. Redeploy on Vercel and check the build log for the step \"prisma migrate deploy\".";
  if (code === "P1013" || /must start with the protocol|invalid .*(url|connection string|port)/i.test(message)) return "DATABASE_URL is not a valid connection string. It should start with postgresql:// and contain no spaces or quotes. A password with symbols such as @ # / ? must be written URL-encoded.";
  if (/tenant or user not found/i.test(message)) return "The user name or region in DATABASE_URL does not match your Supabase project. Copy the string again from Supabase > Connect > ORMs.";
  if (/query engine/i.test(message)) return "The database engine was not bundled with the site. Redeploy with the build cache turned off.";
  if (/environment variable not found/i.test(message)) return "A database setting is missing in Vercel. Add it for Production, Preview and Development, then redeploy.";
  return "See the message below, or send it to your developer.";
}

/** Open /api/health to see whether the site's settings and database connection work. Never shows passwords or keys. */
export async function GET() {
  const missing = REQUIRED.filter((k) => !process.env[k]?.trim());
  const result: Record<string, unknown> = { settings: missing.length ? { missing } : "ok" };
  try {
    await db.setting.count();
    await db.user.count();
    result.database = "ok";
  } catch (e) {
    const err = e as { code?: string; errorCode?: string; name?: string; message?: string };
    const code = err.code ?? err.errorCode ?? err.name ?? "unknown";
    const message = String(err.message ?? e)
      .replace(/[a-z]+:\/\/[^\s"'`]+/gi, "[connection string hidden]")
      .replace(/\s+/g, " ")
      .slice(-400)
      .trim();
    result.database = { status: "error", code, fix: explain(code, message), message };
  }
  result.storage = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY ? "configured" : "missing settings";
  const ok = !missing.length && result.database === "ok";
  return NextResponse.json(result, { status: ok ? 200 : 500, headers: { "Cache-Control": "no-store" } });
}
