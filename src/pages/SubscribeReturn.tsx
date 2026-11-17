import Link from "@/components/Link";
import { useEffect } from "react";
import { Navigate } from "react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { homeFor, isSubscribed, useAuth, useMe } from "@/lib/auth";
import { useLoad, useTitle } from "@/lib/load";
import { DEFAULTS, getSettings } from "@/lib/settings";

/** Selar sends the buyer back here. The page re-checks every few seconds until the payment notice arrives. */
export default function ReturnPage() {
  useTitle("Confirming your payment");
  const me = useMe();
  const { refresh } = useAuth();
  const s = useLoad(getSettings, []).data ?? DEFAULTS;
  useEffect(() => {
    const t = setInterval(() => void refresh(), 5000);
    return () => clearInterval(t);
  }, [refresh]);
  if (me.role !== "PARENT") return <Navigate to={homeFor(me)} replace />;
  if (isSubscribed(me)) return <Navigate to="/library?welcome=1" replace />;
  return (
    <div className="hub">
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
