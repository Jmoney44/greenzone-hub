import Link from "next/link";
import { Back } from "@/components/icons";

/** Title block shared by every admin page. */
export function PageHeader({ title, note, back, children }: {
  title: string; note?: React.ReactNode; back?: { href: string; label: string }; children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {back && (
        <Link href={back.href} className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-bold text-brand hover:text-deep">
          <Back /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-[640px] flex-col gap-1">
          <h1 className="text-[28px] font-extrabold tracking-tight text-deep">{title}</h1>
          {note && <p className="text-[15px] text-soft">{note}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

/** Status label with a coloured dot. tone: on = green, warn = yellow, off = grey */
export function Status({ tone, children }: { tone: "on" | "warn" | "off"; children: React.ReactNode }) {
  const box = { on: "bg-tint text-deep", warn: "bg-[#fbf3b4] text-[#4a4200]", off: "bg-[#eef1ef] text-soft" }[tone];
  const dot = { on: "bg-brand", warn: "bg-[#a38f00]", off: "bg-[#8a9a90]" }[tone];
  return (
    <span className={`pill gap-1.5 whitespace-nowrap ${box}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <p className="text-lg font-extrabold text-deep">{title}</p>
      {children}
    </div>
  );
}
