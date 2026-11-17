import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Arrow, Book, Check, Clock, Film, Grid, Lock, Play } from "@/components/icons";
import { currentUser, homeFor } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

const steps = [
  ["Create your account", "Sign up with your email and a password. Your account keeps your subscription and your progress safe."],
  ["Subscribe on Selar", "Pay once for the year on Selar's secure checkout. You are brought straight back and your access opens."],
  ["Watch and tick off", "Pick any video you like. When you finish one it is marked as watched, and the next is one tap away."],
];
const features = [
  { Icon: Film, title: "Watch in any order", text: "Every video in the Parents Hub is open to subscribers. Choose what you need today." },
  { Icon: Check, title: "Watched marks", text: "Finish a video and it gets a tick. Your overall progress updates itself." },
  { Icon: Clock, title: "Pick up where you stopped", text: "Close the page mid-video and it resumes from the same second next time." },
  { Icon: Grid, title: "Any device", text: "Designed for phones first, and just as comfortable on a laptop." },
];
const parentPoints = ["One yearly subscription", "Watch any video, in any order", "Your progress is saved"];
const teacherPoints = ["Free for Greenzone teachers", "Courses and modules, in order", "Account created for you"];
const preview = [
  { title: "Watched videos get a tick", note: "Completed", done: true },
  { title: "Resume where you stopped", note: "In progress", done: false },
  { title: "New videos added for you", note: "Not started", done: false },
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
  const wrap = "mx-auto w-full max-w-[1180px] px-5 md:px-8";
  const h2 = "text-[clamp(28px,3.4vw,40px)] leading-tight font-extrabold tracking-tight";
  return (
    <div className="bg-white">
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className={`${wrap} flex h-[72px] items-center justify-between gap-4`}>
          <Logo height={46} />
          <nav aria-label="Main" className="hidden items-center gap-1 text-[15px] font-bold text-soft lg:flex">
            <a href="#hubs" className="inline-flex min-h-11 items-center rounded-lg px-3 hover:bg-mist hover:text-deep">Parents &amp; Teachers</a>
            <a href="#how" className="inline-flex min-h-11 items-center rounded-lg px-3 hover:bg-mist hover:text-deep">How it works</a>
            <a href="#pricing" className="inline-flex min-h-11 items-center rounded-lg px-3 hover:bg-mist hover:text-deep">Subscription</a>
            <a href="#faq" className="inline-flex min-h-11 items-center rounded-lg px-3 hover:bg-mist hover:text-deep">Questions</a>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            {me ? (
              <Link href={homeFor(me)} className="btn min-h-11 px-5 text-[15px]">Go to my hub</Link>
            ) : (
              <>
                <Link href="/signin" className="inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-bold text-brand hover:bg-mist">Sign in</Link>
                <Link href="/signup" className="btn min-h-11 px-5 text-[15px]">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="overflow-hidden bg-linear-to-b from-mist to-white">
        <div className={`${wrap} grid grid-cols-1 items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-24`}>
          <div className="flex min-w-0 flex-col gap-6">
            <span className="eyebrow self-start rounded-full border border-[#cfe3d5] bg-white px-3.5 py-2 text-xs">Greenzone Learning Hub</span>
            <h1 className="text-[clamp(36px,5vw,60px)] leading-[1.05] font-extrabold tracking-tight text-deep">
              Every tutorial. One subscription. <span className="text-brand">Your own pace.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-soft">
              Sign in, subscribe once for the year, and watch any Greenzone tutorial in any order. We keep track of what you
              have finished, so you always know where you are.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={start} className="btn min-h-14 px-8 text-[17px]">Start learning <Arrow /></Link>
              <a href="#how" className="btn-outline min-h-14 px-7 text-[17px]">See how it works</a>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-soft">
              {["12 months of access", "Secure payment through Selar", "Phone, tablet and computer"].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check size={16} className="text-brand" />{t}</li>
              ))}
            </ul>
          </div>
          <div aria-hidden className="relative min-w-0">
            <div className="absolute -top-10 -right-16 size-72 rounded-full bg-sun/30 blur-3xl" />
            <div className="absolute -bottom-12 -left-10 size-72 rounded-full bg-brand/20 blur-3xl" />
            <div className="relative rounded-3xl border border-line bg-white p-3 shadow-[0_30px_70px_-30px_rgba(11,61,32,0.45)]">
              <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-leaf to-[#072a16]">
                <span className="flex size-18 items-center justify-center rounded-full bg-sun text-deep shadow-lg"><Play size={30} /></span>
                <span className="absolute right-4 bottom-4 left-4 h-1.5 rounded-full bg-white/25"><span className="block h-1.5 w-2/5 rounded-full bg-sun" /></span>
              </div>
              <div className="flex flex-col gap-1 px-2 pt-4 pb-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-extrabold text-deep">A library that remembers you</span>
                  <span className="text-[13px] font-bold text-brand">1 of 3 watched</span>
                </div>
                <ul className="flex flex-col">
                  {preview.map((p) => (
                    <li key={p.title} className="flex items-center gap-3 border-t border-[#eef4f0] py-2.5 first:border-0">
                      {p.done ? (
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-white"><Check size={14} /></span>
                      ) : (
                        <span className="size-7 shrink-0 rounded-full border-2 border-edge" />
                      )}
                      <span className="min-w-0 flex-1 text-[15px] font-semibold text-ink">{p.title}</span>
                      <span className="text-[13px] text-muted">{p.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="hubs" className="scroll-mt-20 py-16 lg:py-24">
        <div className={`${wrap} flex flex-col gap-10`}>
          <div className="flex max-w-2xl flex-col gap-3">
            <span className="eyebrow">Two hubs, one home</span>
            <h2 className={`${h2} text-deep`}>A place for parents and a place for teachers</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="hero flex flex-col gap-5 md:p-10">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-sun text-deep"><Film size={24} /></span>
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-bold tracking-widest text-sun uppercase">For parents</span>
                <h3 className="text-[28px] font-extrabold">Parents Hub</h3>
              </div>
              <p className="leading-relaxed text-pale">
                One big learning library on a single yearly subscription. Come in any time, pick any video you want, and watch
                at your own pace.
              </p>
              <ul className="flex flex-col gap-2.5 text-[15px] font-semibold">
                {parentPoints.map((t) => <li key={t} className="flex items-center gap-3"><Check size={18} className="shrink-0 text-sun" />{t}</li>)}
              </ul>
              <Link href={start} className="btn mt-auto self-start bg-white text-deep hover:bg-tint">Enter the Parents Hub <Arrow /></Link>
            </div>
            <div className="flex flex-col gap-5 rounded-3xl border border-[#cfe3d5] bg-mist p-6 md:p-10">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-white"><Book size={24} /></span>
              <div className="flex flex-col gap-2">
                <span className="eyebrow">For teachers</span>
                <h3 className="text-[28px] font-extrabold text-deep">Teachers Hub</h3>
              </div>
              <p className="leading-relaxed text-soft">
                Free for Greenzone teachers. Training is organised into courses and modules, and finishing one course unlocks
                the next. Your account is created for you by Greenzone.
              </p>
              <ul className="flex flex-col gap-2.5 text-[15px] font-semibold text-ink">
                {teacherPoints.map((t) => <li key={t} className="flex items-center gap-3"><Check size={18} className="shrink-0 text-brand" />{t}</li>)}
              </ul>
              <Link href="/signin" className="btn mt-auto self-start">Teacher sign in <Arrow /></Link>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-20 border-y border-line bg-[#f4f7f5] py-16 lg:py-24">
        <div className={`${wrap} flex flex-col gap-10`}>
          <div className="flex max-w-2xl flex-col gap-3">
            <span className="eyebrow">How it works</span>
            <h2 className={`${h2} text-deep`}>From sign-up to your first video in three steps</h2>
          </div>
          <ol className="grid gap-5 md:grid-cols-3">
            {steps.map(([title, text], i) => (
              <li key={title} className="card flex flex-col gap-3.5 p-7 shadow-[0_1px_2px_rgba(11,61,32,0.06)]">
                <span className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-brand text-lg font-extrabold text-white">{i + 1}</span>
                  <span className="text-[13px] font-bold tracking-widest text-muted uppercase">Step {i + 1}</span>
                </span>
                <h3 className="text-xl font-extrabold text-deep">{title}</h3>
                <p className="leading-relaxed text-soft">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-linear-to-br from-leaf to-[#072a16] py-16 text-white lg:py-24">
        <div className={`${wrap} grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-14`}>
          <div className="flex flex-col gap-4">
            <span className="eyebrow text-sun">What&apos;s inside</span>
            <h2 className={h2}>Built so you actually finish what you start</h2>
            <p className="text-[17px] leading-relaxed text-pale">
              The hub remembers where you stopped, shows what you have completed, and keeps new tutorials coming as Greenzone
              adds them.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map(({ Icon, title, text }) => (
              <div key={title} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-sun text-deep"><Icon size={22} /></span>
                <h3 className="text-lg font-extrabold">{title}</h3>
                <p className="text-[15px] leading-relaxed text-pale">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 py-16 lg:py-24">
        <div className={`${wrap} grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14`}>
          <div className="flex flex-col gap-4">
            <span className="eyebrow">Subscription for parents</span>
            <h2 className={`${h2} text-deep`}>One simple yearly plan</h2>
            <p className="text-[17px] leading-relaxed text-soft">
              No per-video charges. One payment opens the full Parents Hub for twelve months, including every video added
              during your year.
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-6 rounded-3xl border-2 border-brand bg-white p-7 shadow-[0_30px_60px_-35px_rgba(11,61,32,0.45)] md:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[26px] leading-tight font-extrabold tracking-tight text-deep">Yearly subscription</h3>
              <span className="pill bg-sun text-deep">12 months</span>
            </div>
            <ul className="flex flex-col gap-3 border-y border-line py-5">
              {plan.map((p) => (
                <li key={p} className="flex items-center gap-3 font-semibold text-ink">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tint text-brand"><Check size={14} /></span>{p}
                </li>
              ))}
            </ul>
            <Link href={start} className="btn min-h-14 text-[17px]">Create account and subscribe</Link>
            <p className="flex items-center justify-center gap-2 text-center text-[13px] text-muted"><Lock size={14} /> You will see the price on Selar&apos;s secure checkout before you pay</p>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 border-t border-line bg-[#f4f7f5] py-16 lg:py-20">
        <div className={`${wrap} flex flex-col gap-8`}>
          <h2 className={`${h2} text-deep`}>Common questions</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {faqs.map(([q, a]) => (
              <div key={q} className="card flex flex-col gap-2 p-6 shadow-[0_1px_2px_rgba(11,61,32,0.06)]">
                <h3 className="text-lg font-extrabold text-deep">{q}</h3>
                <p className="text-[15px] leading-relaxed text-soft">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className={wrap}>
          <div className="hero flex flex-wrap items-center justify-between gap-6 md:p-12">
            <div className="flex max-w-xl flex-col gap-2">
              <h2 className="text-[clamp(24px,3vw,34px)] leading-tight font-extrabold tracking-tight">Ready to start learning?</h2>
              <p className="leading-relaxed text-pale">Create your account in a minute. Teachers sign in with the details Greenzone sent.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={start} className="btn bg-sun text-deep hover:bg-white">{me ? "Go to my hub" : "Get started"} <Arrow /></Link>
              {!me && <Link href="/signin" className="btn border-[1.5px] border-white/40 bg-transparent hover:bg-white/10">Sign in</Link>}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className={`${wrap} flex flex-wrap items-center justify-between gap-5 py-8 text-sm text-muted`}>
          <Logo height={44} />
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 font-semibold text-soft">
            <a href="#hubs" className="hover:text-deep">Parents &amp; Teachers</a>
            <a href="#pricing" className="hover:text-deep">Subscription</a>
            <Link href="/signin" className="hover:text-deep">Sign in</Link>
            {settings.supportEmail && <a href={`mailto:${settings.supportEmail}`} className="text-brand">{settings.supportEmail}</a>}
          </nav>
          <span>© {new Date().getFullYear()} Greenzone Academy Limited</span>
        </div>
      </footer>
    </div>
  );
}
