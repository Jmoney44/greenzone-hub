// Supabase Edge Function: receives Selar's payment notice and gives the buyer 12 months of Parents Hub access.
//
// Address to give Selar:  https://YOUR-PROJECT.supabase.co/functions/v1/selar-webhook?key=YOUR-SECRET
// In Supabase, set the secret SELAR_WEBHOOK_KEY to the same value, and turn OFF "Verify JWT" for this function.
//
// The notice only needs to contain the buyer's email somewhere in it. If the buyer has not signed up yet,
// the payment waits and is applied when they create an account with that email.

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function sha(text: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

function flatten(value: unknown, prefix = "", out: [string, string][] = []): [string, string][] {
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else if (value != null) {
    out.push([prefix, String(value)]);
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply(405, { error: "POST only" });
  const expected = Deno.env.get("SELAR_WEBHOOK_KEY") ?? "";
  const given = new URL(req.url).searchParams.get("key") ?? "";
  if (!expected || (await sha(given)) !== (await sha(expected))) return reply(401, { error: "bad key" });

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
  if (/fail|abandon|refund|cancel|declin|pending/.test(status)) return reply(200, { ok: true, ignored: status });

  const emails = flat.filter(([k, v]) => /email/i.test(k) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
  const email = (emails.find(([k]) => /customer|buyer|payer/i.test(k)) ?? emails[0])?.[1]?.toLowerCase();
  if (!email) return reply(422, { error: "no buyer email found in the notice" });

  const ref =
    flat.find(([k]) => /(^|\.)(reference|order_?id|transaction_?id|order_?number)$/i.test(k))?.[1] ??
    (await sha(text)).slice(0, 24);
  const amount = flat.find(([k]) => /(^|\.)(amount|total|price)$/i.test(k))?.[1] ?? "";

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${url}/rest/v1/rpc/record_selar_payment`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ buyer_email: email, ref, amt: amount, payload: text }),
  });
  if (!res.ok) {
    console.error("record_selar_payment failed", res.status, await res.text());
    return reply(500, { error: "could not record the payment" });
  }
  return reply(200, await res.json());
});
