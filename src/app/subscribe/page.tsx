import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Arrow, Check, Lock } from "@/components/icons";
import { homeFor, isSubscribed, requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Subscribe" };

const next = [
  ["Pay on Selar", "Card, bank transfer or any method Selar offers. Use the email shown on this page."],
  ["Come straight back", "Selar confirms your payment and returns you to the hub."],
  ["Access is switched on", "Your 12 months begin and every video in the Parents Hub opens."],
];
const included = [
  "Every video in the Parents Hub",
  "New videos added during your year",
  "Watched marks and progress tracking",
  "Resume any video where you stopped",
];
const stages = ["Account created", "Subscribe", "Start watching"];

export default async function SubscribePage() {
  const me = await requireUser();
  if (me.role !== "PARENT" || isSubscribed(me)) redirect(homeFor(me));
  const s = await getSettings();
  const expired = !!me.subscriptionEndsAt;
  return (
    <div className="hub">
      <SiteHeader user={me} active="hub" />
      <main className="page max-w-[1040px]">
        <ol className="card flex items-center gap-2 p-3 text-sm font-bold sm:gap-3 sm:px-5">
          {stages.map((label, i) => (
            <li key={label} aria-current={i === 1 ? "step" : undefined} className={`flex items-center gap-2 sm:gap-3 ${i < 2 ? "flex-1" : ""}`}>
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${i === 0 ? "bg-brand text-white" : i === 1 ? "bg-deep text-sun" : "bg-[#eef1ef] text-soft"}`}>
                {i === 0 ? <Check size={15} /> : i + 1}
              </span>
              <span className={`${i === 1 ? "text-deep" : "hidden text-soft sm:inline"} whitespace-nowrap`}>{label}</span>
              {i < 2 && <span aria-hidden className={`h-0.5 min-w-3 flex-1 rounded-full ${i === 0 ? "bg-brand" : "bg-line"}`} />}
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <section className="card flex min-w-0 flex-col gap-6 rounded-3xl p-6 md:p-9">
            <div className="flex flex-col gap-3">
              <span className="pill self-start bg-sun text-deep">{expired ? "Renew · 12 months" : "Yearly subscription · 12 months"}</span>
              <h1 className="text-[clamp(26px,3vw,36px)] leading-tight font-extrabold tracking-tight text-deep">
                {expired ? "Renew to reopen the library for 12 months" : "Unlock the full library for 12 months"}
              </h1>
              <p className="leading-relaxed text-soft">One payment. Every video in the Parents Hub. Watch in whatever order suits you.</p>
            </div>
            <ul className="grid gap-3 border-y border-line py-5 sm:grid-cols-2">
              {included.map((t) => (
                <li key={t} className="flex items-center gap-3 text-[15px] font-semibold text-ink">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tint text-brand"><Check size={14} /></span>{t}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-1 rounded-2xl border border-line bg-[#f7faf8] px-5 py-4">
              <span className="text-[13px] font-bold tracking-wider text-muted uppercase">Pay on Selar with this email</span>
              <strong className="text-lg break-all text-deep">{me.email}</strong>
              <span className="text-[13px] text-soft">This is how we match your payment to your account.</span>
            </div>
            {s.selarUrl ? (
              <a href={s.selarUrl} className="btn min-h-14 px-4 text-[15px] sm:px-6 sm:text-[17px]"><Lock size={18} className="shrink-0" /> See the price and pay on Selar <Arrow className="hidden sm:block" /></a>
            ) : (
              <p role="status" className="rounded-xl bg-[#fbf3b4] px-4 py-3 text-sm font-semibold text-[#4a4200]">
                Online payment is being set up. Please check back shortly{s.supportEmail ? ` or contact ${s.supportEmail}` : ""}.
              </p>
            )}
            <p className="text-center text-[13px] leading-relaxed text-muted">
              The yearly price is shown on Selar. After you pay, you are brought back to your library.
            </p>
          </section>

          <section className="hero flex min-w-0 flex-col gap-6 md:p-9">
            <h2 className="text-[22px] font-extrabold">What happens next</h2>
            <ol className="flex flex-col">
              {next.map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="flex flex-col items-center">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sun font-extrabold text-deep">{i + 1}</span>
                    {i < next.length - 1 && <span aria-hidden className="my-1 w-0.5 flex-1 rounded-full bg-white/20" />}
                  </span>
                  <div className="flex flex-col gap-1 pb-6">
                    <span className="pt-1.5 font-bold">{t}</span>
                    <span className="text-sm leading-relaxed text-pale">{d}</span>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-auto rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm leading-relaxed text-[#e4f0e8]">
              <strong className="block pb-1 text-white">Paid already but still locked?</strong>
              <a href="/subscribe/return" className="font-bold text-sun underline">Check my payment</a>
              {s.supportEmail && <> or write to <a href={`mailto:${s.supportEmail}`} className="font-bold wrap-anywhere text-sun underline">{s.supportEmail}</a></>}.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
