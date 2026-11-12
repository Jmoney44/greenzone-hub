import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Check, Lock } from "@/components/icons";
import { homeFor, isSubscribed, requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Subscribe" };

const next = [
  ["Pay on Selar", "Card, bank transfer or any method Selar offers. Use the email shown above."],
  ["Come straight back", "Selar confirms your payment and returns you to the hub."],
  ["Access is switched on", "Your 12 months begin and every video in the Parents Hub opens."],
];

export default async function SubscribePage() {
  const me = await requireUser();
  if (me.role !== "PARENT" || isSubscribed(me)) redirect(homeFor(me));
  const s = await getSettings();
  const expired = !!me.subscriptionEndsAt;
  return (
    <div className="hub">
      <SiteHeader user={me} active="hub" />
      <main className="page max-w-[1040px]">
        <ol className="flex flex-wrap gap-3 text-sm font-bold">
          <li className="inline-flex items-center gap-2.5 rounded-full bg-tint py-2 pr-4 pl-2 text-deep">
            <span className="flex size-7 items-center justify-center rounded-full bg-brand text-white"><Check size={14} /></span>Account created
          </li>
          <li className="inline-flex items-center gap-2.5 rounded-full bg-deep py-2 pr-4 pl-2 text-white">
            <span className="flex size-7 items-center justify-center rounded-full bg-sun text-deep">2</span>Subscribe
          </li>
          <li className="inline-flex items-center gap-2.5 rounded-full border border-[#cfe3d5] bg-white py-2 pr-4 pl-2 text-soft">
            <span className="flex size-7 items-center justify-center rounded-full bg-line">3</span>Start watching
          </li>
        </ol>
        <div className="flex flex-wrap items-stretch gap-8">
          <div className="card flex flex-[1_1_380px] flex-col gap-5 rounded-3xl p-10">
            <h1 className="text-[clamp(28px,3.2vw,38px)] leading-tight font-extrabold tracking-tight text-deep">
              {expired ? "Renew to reopen the library for 12 months" : "Unlock the full library for 12 months"}
            </h1>
            <p className="leading-relaxed text-soft">One payment. Every video in the Parents Hub. Watch in whatever order suits you.</p>
            <p className="rounded-xl bg-mist px-4 py-3 text-sm text-soft">
              Pay on Selar with this email so we can match your payment: <strong className="text-deep">{me.email}</strong>
            </p>
            {s.selarUrl ? (
              <a href={s.selarUrl} className="btn min-h-14 text-lg"><Lock size={20} /> See the price and pay on Selar</a>
            ) : (
              <p role="status" className="rounded-xl bg-[#fbf3b4] px-4 py-3 text-sm font-semibold text-[#4a4200]">
                Online payment is being set up. Please check back shortly{s.supportEmail ? ` or contact ${s.supportEmail}` : ""}.
              </p>
            )}
            <p className="text-center text-[13px] leading-relaxed text-muted">
              The yearly price is shown on Selar. After you pay, you are brought back to your library.
            </p>
          </div>
          <div className="hero flex flex-[1_1_320px] flex-col gap-5 md:p-10">
            <h2 className="text-[22px] font-extrabold">What happens next</h2>
            {next.map(([t, d], i) => (
              <div key={t} className="flex items-start gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-leaf font-extrabold text-sun">{i + 1}</span>
                <div><div className="font-bold">{t}</div><div className="text-sm leading-relaxed text-pale">{d}</div></div>
              </div>
            ))}
            <div className="mt-auto rounded-2xl bg-leaf px-4 py-4 text-sm leading-relaxed text-[#e4f0e8]">
              Paid already but still locked?{" "}
              <a href="/subscribe/return" className="font-bold text-sun underline">Check my payment</a>
              {s.supportEmail && <> or write to <a href={`mailto:${s.supportEmail}`} className="font-bold text-sun underline">{s.supportEmail}</a></>}.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
