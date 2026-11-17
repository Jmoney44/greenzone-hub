import Link from "next/link";
import { Logo } from "./Logo";
import { Back, Check } from "./icons";

/** Two-panel layout shared by sign in, sign up and password pages. */
export function AuthShell({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr] bg-[#f4f7f5] lg:grid-rows-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="relative flex flex-col justify-between gap-8 overflow-hidden bg-linear-to-br from-leaf to-[#072a16] px-6 py-6 text-white lg:px-14 lg:py-12">
        <div aria-hidden className="absolute -right-24 -bottom-24 size-80 rounded-full bg-sun/15 blur-3xl" />
        <div className="relative"><Logo chip height={44} /></div>
        <div className="relative flex flex-col gap-4">
          <h1 className="text-[clamp(24px,3.4vw,44px)] leading-[1.1] font-extrabold tracking-tight">{title}</h1>
          <p className="hidden max-w-md text-[17px] leading-relaxed text-pale lg:block">{text}</p>
        </div>
        <ul className="relative hidden flex-col gap-3 text-[15px] font-semibold text-[#e4f0e8] lg:flex">
          {["Parents: one yearly subscription, every video", "Teachers: free training courses", "A tick on everything you finish"].map((t) => (
            <li key={t} className="flex items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-sun"><Check size={15} /></span>{t}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col items-center gap-5 px-5 py-8 lg:justify-center lg:py-12">
        <div className="card flex w-full max-w-[460px] flex-col gap-5 p-6 shadow-[0_20px_50px_-30px_rgba(11,61,32,0.35)] sm:p-9">{children}</div>
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-soft hover:text-deep"><Back /> Back to the home page</Link>
      </div>
    </div>
  );
}
