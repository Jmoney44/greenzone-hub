import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { claimPayments } from "@/lib/access";
import { db } from "@/lib/db";
import { homeFor, isSubscribed, requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Confirming your payment" };

/** Selar sends the buyer back here. The page re-checks every few seconds until the payment notice arrives. */
export default async function ReturnPage() {
  const me = await requireUser();
  if (me.role !== "PARENT") redirect(homeFor(me));
  if (!isSubscribed(me)) await claimPayments(me.id, me.email);
  const fresh = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  if (isSubscribed(fresh)) redirect("/library?welcome=1");
  const s = await getSettings();
  return (
    <div className="hub">
      <meta httpEquiv="refresh" content="6" />
      <SiteHeader user={me} active="hub" />
      <main className="mx-auto flex max-w-xl flex-col items-center gap-5 px-5 py-20 text-center">
        <span aria-hidden className="size-14 animate-spin rounded-full border-4 border-tint border-t-brand" />
        <h1 className="text-3xl font-extrabold text-deep">Confirming your payment…</h1>
        <p className="leading-relaxed text-soft">
          This usually takes a few seconds. Keep this page open and your library will open by itself as soon as Selar
          confirms the payment for <strong>{me.email}</strong>.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Paid with a different email, or still waiting after a few minutes?
          {s.supportEmail ? <> Write to <a className="font-bold text-brand" href={`mailto:${s.supportEmail}`}>{s.supportEmail}</a> and we will activate your account.</> : " Contact Greenzone and we will activate your account."}
        </p>
        <Link href="/subscribe" className="btn-outline">Back to the subscription page</Link>
      </main>
    </div>
  );
}
