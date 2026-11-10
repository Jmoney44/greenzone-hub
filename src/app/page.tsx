import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Arrow, Check, Play } from "@/components/icons";
import { currentUser, homeFor } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

const steps = [
  ["Create your account", "Sign up with your email and a password. Your account keeps your subscription and your progress safe."],
  ["Subscribe on Selar", "Pay once for the year on Selar's secure checkout. You are brought straight back and your access opens."],
  ["Watch and tick off", "Pick any video you like. When you finish one it is marked as watched, and the next is one tap away."],
];
const features = [
  ["Watch in any order", "Every video in the Parents Hub is open to subscribers. Choose what you need today."],
  ["Watched marks", "Finish a video and it gets a tick. Your overall progress updates itself."],
  ["Pick up where you stopped", "Close the page mid-video and it resumes from the same second next time."],
  ["Any device", "Designed for phones first, and just as comfortable on a laptop."],
];
const faqs = [
  ["Do I pay for each video?", "No. One yearly payment unlocks everything in the Parents Hub."],
  ["Must I watch in a set order?", "No. Parents can choose any video. Each one you finish is marked as watched."],
  ["What happens after I pay?", "Selar returns you to the hub and your access is switched on for 12 months."],
];
const plan = [
  "Full access to every video in the Parents Hub",
  "New videos included as they are added",
  "Progress tracking and watched marks",
  "Resume any video where you stopped",
];

export default async function Home() {
  const [me, settings] = await Promise.all([currentUser(), getSettings()]);
  const start = me ? homeFor(me) : "/signup";
  return (
    <div className="bg-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-[5%] py-4">
        <Logo height={56} />
        <nav className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[15px] font-semibold">
          <a href="#hubs">Parents &amp; Teachers</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Subscription</a>
          {me ? (
            <Link href={homeFor(me)} className="btn min-h-11">Go to my hub</Link>
          ) : (
            <>
              <Link href="/signin" className="text-brand">Sign in</Link>
              <Link href="/signup" className="btn min-h-11">Get started</Link>
            </>
          )}
        </nav>
      </header>

      <section className="flex flex-wrap items-center gap-14 bg-mist px-[5%] py-20">
        <div className="flex flex-[1_1_420px] flex-col gap-6">
          <span className="eyebrow self-start rounded-full border border-[#cfe3d5] bg-white px-3.5 py-2">Greenzone Learning Hub</span>
          <h1 className="text-[clamp(38px,5vw,62px)] leading-[1.05] font-extrabold tracking-tight text-deep">
            Every tutorial. One subscription. Your own pace.
          </h1>
          <p className="max-w-xl text-[19px] leading-relaxed text-soft">
            Sign in, subscribe once for the year, and watch any Greenzone tutorial in any order. We keep track of what you
            have finished, so you always know where you are.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <Link href={start} className="btn min-h-14 px-8 text-[17px]">Start learning <Arrow /></Link>
            <a href="#how" className="btn-outline min-h-14 px-7 text-[17px]">See how it works</a>
          </div>
          <p className="text-sm text-muted">12 months of access · Secure payment through Selar · Works on phone, tablet and computer</p>
        </div>
        <div className="min-w-0 flex-[1_1_440px]">
          <div className="rounded-3xl bg-deep p-4 shadow-[0_30px_60px_-30px_rgba(11,61,32,0.55)]">
            <div className="flex aspect-video items-center justify-center rounded-2xl bg-leaf">
              <span className="flex size-21 items-center justify-center rounded-full bg-sun text-deep"><Play size={34} /></span>
            </div>
            <div className="flex items-center justify-between gap-4 px-2 pt-4 pb-1 text-white">
              <div>
                <div className="font-bold">A library that remembers you</div>
                <div className="text-[13px] text-pale">Resume where you stopped, on any device</div>
              </div>
              <span className="pill gap-2 bg-leaf text-sun"><Check size={16} /> Watched</span>
            </div>
          </div>
        </div>
      </section>

      <section id="hubs" className="flex flex-col gap-10 px-[5%] pt-24">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="eyebrow">Two hubs, one home</span>
          <h2 className="text-[clamp(30px,3.6vw,44px)] leading-tight font-extrabold tracking-tight text-deep">
            A place for parents and a place for teachers
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-3xl bg-deep p-9 text-white">
            <span className="pill self-start bg-sun text-xs tracking-wider text-deep uppercase">For parents</span>
            <h3 className="text-[28px] font-extrabold">Parents Hub</h3>
            <p className="leading-relaxed text-pale">
              One big learning library on a single yearly subscription. Come in any time, pick any video you want, and watch
              at your own pace.
            </p>
            <Link href={start} className="btn self-start bg-white text-deep hover:bg-tint">Enter the Parents Hub</Link>
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-[#cfe3d5] bg-mist p-9">
            <span className="pill self-start bg-brand text-xs tracking-wider text-white uppercase">For teachers</span>
            <h3 className="text-[28px] font-extrabold text-deep">Teachers Hub</h3>
            <p className="leading-relaxed text-soft">
              Free for Greenzone teachers. Training is organised into courses and modules, and finishing one course unlocks
              the next. Your account is created for you by Greenzone.
            </p>
            <Link href="/signin" className="btn self-start">Teacher sign in</Link>
          </div>
        </div>
      </section>

      <section id="how" className="flex flex-col gap-12 px-[5%] py-24">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="eyebrow">How it works</span>
          <h2 className="text-[clamp(30px,3.6vw,44px)] leading-tight font-extrabold tracking-tight text-deep">
            From sign-up to your first video in three steps
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map(([title, text], i) => (
            <div key={title} className="flex flex-col gap-3.5 rounded-[20px] bg-mist p-8">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-xl font-extrabold text-white">{i + 1}</span>
              <h3 className="text-[22px] font-bold text-deep">{title}</h3>
              <p className="leading-relaxed text-soft">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap items-start gap-14 bg-deep px-[5%] py-24 text-white">
        <div className="flex flex-[1_1_340px] flex-col gap-4">
          <span className="eyebrow text-sun">What&apos;s inside</span>
          <h2 className="text-[clamp(30px,3.6vw,44px)] leading-tight font-extrabold tracking-tight">Built so you actually finish what you start</h2>
          <p className="text-[17px] leading-relaxed text-pale">
            The hub remembers where you stopped, shows what you have completed, and keeps new tutorials coming as Greenzone
            adds them.
          </p>
        </div>
        <div className="grid flex-[2_1_520px] gap-5 sm:grid-cols-2">
          {features.map(([title, text]) => (
            <div key={title} className="flex flex-col gap-2.5 rounded-[18px] bg-leaf p-6">
              <span className="flex size-9 items-center justify-center rounded-full bg-sun text-deep"><Check /></span>
              <h3 className="text-[19px] font-bold">{title}</h3>
              <p className="text-[15px] leading-relaxed text-pale">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="flex flex-wrap items-center gap-14 px-[5%] py-24">
        <div className="flex flex-[1_1_360px] flex-col gap-4">
          <span className="eyebrow">Subscription for parents</span>
          <h2 className="text-[clamp(30px,3.6vw,44px)] leading-tight font-extrabold tracking-tight text-deep">One simple yearly plan</h2>
          <p className="text-[17px] leading-relaxed text-soft">
            No per-video charges. One payment opens the full Parents Hub for twelve months, including every video added
            during your year.
          </p>
        </div>
        <div className="flex flex-[1_1_380px] flex-col gap-5 rounded-3xl border-2 border-brand bg-white p-9">
          <h3 className="text-[30px] leading-tight font-extrabold tracking-tight text-deep">Yearly subscription</h3>
          <ul className="flex flex-col gap-3">
            {plan.map((p) => (
              <li key={p} className="flex items-center gap-3"><Check size={20} className="shrink-0 text-brand" />{p}</li>
            ))}
          </ul>
          <Link href={start} className="btn min-h-14 text-[17px]">Create account and subscribe</Link>
          <p className="text-center text-[13px] text-muted">You will see the price on Selar&apos;s secure checkout before you pay</p>
        </div>
      </section>

      <section className="flex flex-col gap-7 px-[5%] pb-24">
        <h2 className="text-3xl font-extrabold text-deep">Common questions</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {faqs.map(([q, a]) => (
            <div key={q} className="card flex flex-col gap-2 p-6">
              <h3 className="text-lg font-bold text-deep">{q}</h3>
              <p className="text-[15px] leading-relaxed text-soft">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-5 border-t border-line px-[5%] py-8 text-sm text-muted">
        <Logo height={44} />
        {settings.supportEmail && <a href={`mailto:${settings.supportEmail}`} className="font-semibold text-brand">Contact: {settings.supportEmail}</a>}
        <span>© {new Date().getFullYear()} Greenzone Academy Limited</span>
      </footer>
    </div>
  );
}
