import { Logo } from "./Logo";
import { Check } from "./icons";

/** Two-panel layout shared by sign in, sign up and password pages. */
export function AuthShell({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-wrap bg-white">
      <div className="flex flex-[1_1_420px] flex-col justify-between gap-12 bg-deep px-[6%] py-14 text-white">
        <div><Logo chip height={48} /></div>
        <div className="flex flex-col gap-5">
          <h1 className="text-[clamp(32px,3.6vw,46px)] leading-[1.1] font-extrabold tracking-tight">{title}</h1>
          <p className="max-w-md text-[17px] leading-relaxed text-pale">{text}</p>
        </div>
        <ul className="flex flex-col gap-3.5 text-[15px] text-[#e4f0e8]">
          {["Parents: one yearly subscription, every video", "Teachers: free training courses", "A tick on everything you finish"].map((t) => (
            <li key={t} className="flex items-center gap-3"><Check size={20} className="text-sun" />{t}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-[1_1_420px] items-center justify-center px-[6%] py-14">
        <div className="flex w-full max-w-[420px] flex-col gap-5">{children}</div>
      </div>
    </div>
  );
}
