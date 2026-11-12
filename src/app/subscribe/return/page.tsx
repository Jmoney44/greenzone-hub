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
      <main className="page max-w-[640px] py-12 md:py-16">
        <section className="card flex flex-col items-center gap-5 rounded-3xl p-7 text-center md:p-10">
          <span aria-hidden className="size-14 animate-spin rounded-full border-4 border-tint border-t-brand" />
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px] font-extrabold tracking-tight text-deep">Confirming your payment…</h1>
            <p className="leading-relaxed text-soft">
              This usually takes a few seconds. Keep this page open and your library will open by itself as soon as Selar
              confirms the payment for <strong className="break-all text-deep">{me.email}</strong>.
            </p>
          </div>
          <p role="status" className="pill bg-tint px-4 py-1.5 text-deep">Checking again every few seconds</p>
          <p className="border-t border-line pt-5 text-sm leading-relaxed text-muted">
            Paid with a different email, or still waiting after a few minutes?
            {s.supportEmail ? <> Write to <a className="font-bold text-brand" href={`mailto:${s.supportEmail}`}>{s.supportEmail}</a> and we will activate your account.</> : " Contact Greenzone and we will activate your account."}
          </p>
          <Link href="/subscribe" className="btn-outline">Back to the subscription page</Link>
        </section>
      </main>
    </div>
  );
}
