import Link from "next/link";
import { Upload } from "@/components/icons";
import { db } from "@/lib/db";
import { day } from "@/lib/format";

export default async function AdminHome() {
  const now = new Date();
  const soon = new Date(Date.now() + 30 * 864e5);
  const [parents, teachers, active, expiring, videos, drafts, recent] = await Promise.all([
    db.user.count({ where: { role: "PARENT" } }),
    db.user.count({ where: { role: "TEACHER" } }),
    db.user.count({ where: { role: "PARENT", subscriptionEndsAt: { gt: now } } }),
    db.user.count({ where: { role: "PARENT", subscriptionEndsAt: { gt: now, lt: soon } } }),
    db.video.count({ where: { published: true } }),
    db.video.count({ where: { published: false } }),
    db.progress.findMany({
      where: { completed: true }, orderBy: { completedAt: "desc" }, take: 8, include: { user: true, video: true },
    }),
  ]);
  const tiles: [string, number][] = [
    ["Registered parents", parents], ["Active subscriptions", active], ["Expiring in 30 days", expiring],
    ["Teachers", teachers], ["Videos published", videos], ["Draft videos", drafts],
  ];
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-deep">Overview</h1>
        <Link href="/admin/videos/new" className="btn"><Upload /> Upload video</Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        {tiles.map(([label, value]) => (
          <div key={label} className="card flex flex-col gap-2 p-5">
            <span className="text-[13px] font-bold text-muted">{label}</span>
            <span className="text-[34px] font-extrabold text-deep">{value}</span>
          </div>
        ))}
      </div>
      <section className="card flex flex-col gap-3 p-6">
        <h2 className="text-xl font-extrabold text-deep">Recently completed videos</h2>
        {recent.length === 0 && <p className="text-soft">Nobody has finished a video yet.</p>}
        <ul className="flex flex-col divide-y divide-line">
          {recent.map((r) => (
            <li key={r.userId + r.videoId} className="flex flex-wrap justify-between gap-2 py-2.5 text-[15px]">
              <span><strong>{r.user.name}</strong> finished <strong>{r.video.title}</strong></span>
              <span className="text-muted">{day(r.completedAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
