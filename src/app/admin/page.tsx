import Link from "next/link";
import { Arrow, Card, Clock, Draft, Film, People, Upload } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { day, initials } from "@/lib/format";

export default async function AdminHome() {
  const me = await requireAdmin();
  const now = new Date();
  const soon = new Date(Date.now() + 30 * 864e5);
  const [parents, teachers, active, expiring, videos, drafts, recent, payments] = await Promise.all([
    db.user.count({ where: { role: "PARENT" } }),
    db.user.count({ where: { role: "TEACHER" } }),
    db.user.count({ where: { role: "PARENT", subscriptionEndsAt: { gt: now } } }),
    db.user.count({ where: { role: "PARENT", subscriptionEndsAt: { gt: now, lt: soon } } }),
    db.video.count({ where: { published: true } }),
    db.video.count({ where: { published: false } }),
    db.progress.findMany({
      where: { completed: true }, orderBy: { completedAt: "desc" }, take: 6, include: { user: true, video: true },
    }),
    db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: true } }),
  ]);
  const share = parents ? Math.round((active / parents) * 100) : 0;
  const tiles = [
    { label: "Registered parents", value: parents, note: `${share}% have an active subscription`, href: "/admin/people?role=PARENT", Icon: People },
    { label: "Active subscriptions", value: active, note: "Parents who can watch today", href: "/admin/people?role=PARENT", Icon: Card },
    { label: "Expiring in 30 days", value: expiring, note: expiring ? "Worth a renewal reminder" : "Nothing due soon", href: "/admin/people?role=PARENT", Icon: Clock, warn: expiring > 0 },
    { label: "Teachers", value: teachers, note: "Free accounts you created", href: "/admin/people?role=TEACHER", Icon: People },
    { label: "Videos published", value: videos, note: "Live in both hubs", href: "/admin/videos", Icon: Film },
    { label: "Draft videos", value: drafts, note: drafts ? "Not visible to anyone yet" : "Everything is published", href: "/admin/videos", Icon: Draft },
  ];
  const panelHead = "flex items-center justify-between gap-3 border-b border-line px-6 py-4";
  const more = "inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-brand hover:text-deep";
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-muted">{now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          <h1 className="text-[28px] font-extrabold tracking-tight text-deep">Welcome back, {me.name.split(" ")[0]}</h1>
        </div>
        <Link href="/admin/videos/new" className="btn"><Upload /> Upload video</Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ label, value, note, href, Icon, warn }) => (
          <Link key={label} href={href} className="card group flex items-start gap-4 p-5 transition hover:border-edge hover:shadow-md">
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${warn ? "bg-[#fbf3b4] text-[#4a4200]" : "bg-tint text-brand"}`}>
              <Icon size={22} />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[13px] font-bold text-muted">{label}</span>
              <span className="text-[30px] leading-9 font-extrabold text-deep tabular-nums">{value.toLocaleString("en-GB")}</span>
              <span className="text-[13px] text-soft">{note}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card flex min-w-0 flex-col">
          <div className={panelHead}>
            <h2 className="text-lg font-extrabold text-deep">Recently completed videos</h2>
            <Link href="/admin/people" className={more}>All people <Arrow size={16} /></Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-6 py-8 text-soft">Nobody has finished a video yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-[#eef4f0] px-6">
              {recent.map((r) => (
                <li key={r.userId + r.videoId} className="flex items-center gap-3 py-3.5">
                  <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tint text-xs font-extrabold text-deep">{initials(r.user.name)}</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-bold text-ink">{r.user.name}</span>
                    <span className="truncate text-[13px] text-soft">Finished {r.video.title}</span>
                  </span>
                  <span className="shrink-0 text-[13px] text-muted">{day(r.completedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card flex min-w-0 flex-col">
          <div className={panelHead}>
            <h2 className="text-lg font-extrabold text-deep">Latest payments</h2>
            <Link href="/admin/payments" className={more}>All payments <Arrow size={16} /></Link>
          </div>
          {payments.length === 0 ? (
            <p className="px-6 py-8 text-soft">No payments recorded yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-[#eef4f0] px-6">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3.5">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-bold text-ink">{p.user?.name ?? p.email}</span>
                    <span className="truncate text-[13px] text-soft">
                      {p.source === "manual" ? "Granted by admin" : "Selar"}{p.amount ? ` · ${p.amount}` : ""}
                    </span>
                  </span>
                  {!p.user && <span className="pill shrink-0 bg-[#fbf3b4] text-[#4a4200]">Waiting for sign-up</span>}
                  <span className="shrink-0 text-[13px] text-muted">{day(p.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
