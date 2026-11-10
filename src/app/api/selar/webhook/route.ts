import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { grantYear } from "@/lib/access";

/**
 * Payment notice from Selar (directly, or relayed by a tool such as Zapier).
 * Address to give Selar:  https://YOUR-SITE/api/selar/webhook?key=SELAR_WEBHOOK_KEY
 *
 * The notice only needs to contain the buyer's email somewhere in it. The buyer's
 * account gets 12 months of access; if they have not signed up yet, the payment
 * waits and is applied when they create an account with that email.
 */
export async function POST(req: Request) {
  const expected = process.env.SELAR_WEBHOOK_KEY ?? "";
  const given = new URL(req.url).searchParams.get("key") ?? "";
  const a = Buffer.from(createHash("sha256").update(given).digest("hex"));
  const b = Buffer.from(createHash("sha256").update(expected).digest("hex"));
  if (!expected || !timingSafeEqual(a, b)) return NextResponse.json({ error: "bad key" }, { status: 401 });

  const text = await req.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = Object.fromEntries(new URLSearchParams(text));
  }
  const flat = flatten(data);

  // Ignore notices that are not successful sales.
  const status = flat.filter(([k]) => /(^|\.)(status|event|type)$/i.test(k)).map(([, v]) => v.toLowerCase()).join(" ");
  if (/fail|abandon|refund|cancel|declin|pending/.test(status)) return NextResponse.json({ ok: true, ignored: status });

  const emails = flat.filter(([k, v]) => /email/i.test(k) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
  const email = (emails.find(([k]) => /customer|buyer|payer/i.test(k)) ?? emails[0])?.[1]?.toLowerCase();
  if (!email) return NextResponse.json({ error: "no buyer email found in the notice" }, { status: 422 });

  const ref =
    flat.find(([k]) => /(^|\.)(reference|order_?id|transaction_?id|order_?number)$/i.test(k))?.[1] ??
    createHash("sha256").update(text).digest("hex").slice(0, 24);
  const amount = flat.find(([k]) => /(^|\.)(amount|total|price)$/i.test(k))?.[1] ?? "";

  // The same notice delivered twice must not give two years.
  if (await db.payment.findUnique({ where: { reference: ref } })) return NextResponse.json({ ok: true, duplicate: true });

  const user = await db.user.findUnique({ where: { email } });
  await db.payment.create({
    data: { reference: ref, email, amount, source: "selar", raw: text.slice(0, 5000), userId: user?.id ?? null },
  });
  if (user) await grantYear(user.id);
  return NextResponse.json({ ok: true, matched: !!user });
}

function flatten(value: unknown, prefix = "", out: [string, string][] = []): [string, string][] {
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else if (value != null) {
    out.push([prefix, String(value)]);
  }
  return out;
}
