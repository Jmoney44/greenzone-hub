import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Thumb } from "@/components/Thumb";
import { Check, Play } from "@/components/icons";
import { db } from "@/lib/db";
import { requireSubscriber } from "@/lib/auth";
import { clock, day } from "@/lib/format";

export const metadata = { title: "Parents Hub" };
const PAGE = 12;

type Search = { q?: string; topic?: string; show?: string; n?: string; welcome?: string };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Search> }) {
  const me = await requireSubscriber();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const topic = sp.topic ?? "";
  const show = sp.show === "watched" || sp.show === "todo" ? sp.show : "all";
  const take = Math.min(200, Math.max(PAGE, parseInt(sp.n ?? "", 10) || PAGE));

  const base = { hub: "PARENTS", published: true };
  const mine = { userId: me.id, completed: true };
  const where = {
    ...base,
    ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] } : {}),
    ...(topic ? { topicId: topic } : {}),
    ...(show === "watched" ? { progress: { some: mine } } : show === "todo" ? { progress: { none: mine } } : {}),
  };

  const [total, watched, found, videos, topics, resume] = await Promise.all([
    db.video.count({ where: base }),
    db.progress.count({ where: { ...mine, video: base } }),
    db.video.count({ where }),
    db.video.findMany({
      where, take,
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      include: { topic: true, progress: { where: { userId: me.id } } },
    }),
    db.topic.findMany({ where: { videos: { some: base } }, orderBy: { name: "asc" } }),
    db.progress.findFirst({
      where: { userId: me.id, completed: false, positionSeconds: { gt: 0 }, video: base },
      orderBy: { updatedAt: "desc" },
      include: { video: true },
    }),
  ]);
  const percent = total ? Math.round((watched / total) * 100) : 0;
  const link = (over: Partial<Search>) => {
    const p = new URLSearchParams();
    const all = { q, topic, show: show === "all" ? "" : show, ...over };
    for (const [k, v] of Object.entries(all)) if (v) p.set(k, String(v));
    const s = p.toString();
    return s ? `/library?${s}` : "/library";
  };
  const chip = (on: boolean) =>
    `inline-flex min-h-11 items-center rounded-full border-[1.5px] px-4 text-sm font-bold ${on ? "border-deep bg-deep text-white" : "border-edge bg-white text-soft hover:bg-mist"}`;

  return (
    <div className="min-h-screen bg-mist">
      <SiteHeader user={me} active="hub" />
      <main className="mx-auto flex max-w-[1180px] flex-col gap-9 px-[5%] py-11">
        {sp.welcome && (
          <p role="status" className="flex items-center gap-3 rounded-2xl bg-tint px-5 py-4 font-bold text-deep">
            <Check /> Payment confirmed. Your library is open for the next 12 months.
          </p>
        )}
        <section className="flex flex-wrap items-stretch gap-6">
          <div className="flex flex-[2_1_420px] flex-col gap-4 rounded-[22px] bg-deep p-8 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-[clamp(26px,3vw,34px)] font-extrabold tracking-tight">Welcome back, {me.name.split(" ")[0]}</h1>
              {me.role === "PARENT" && (
                <span className="pill bg-leaf px-3.5 py-2 text-sun">Subscription active · until {day(me.subscriptionEndsAt)}</span>
              )}
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between gap-3 text-[15px] font-semibold text-[#e4f0e8]">
                <span>Parents Hub · your progress</span>
                <span>{watched} of {total} videos watched</span>
              </div>
              <div role="img" aria-label={`${watched} of ${total} videos watched`} className="h-3 rounded-full bg-leaf">
                <div className="h-3 rounded-full bg-sun" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>
          {resume && (
            <Link href={`/watch/${resume.videoId}`} className="card flex flex-[1_1_300px] items-center gap-4 rounded-[22px] p-6">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand text-white"><Play size={26} /></span>
              <span className="flex min-w-0 flex-col gap-1.5">
                <span className="eyebrow text-xs">Continue watching</span>
                <span className="text-lg font-bold">{resume.video.title}</span>
                <span className="text-sm text-muted">Resume from {clock(resume.positionSeconds)}</span>
              </span>
            </Link>
          )}
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-[26px] font-extrabold text-deep">The parents&apos; library</h2>
              <p className="text-sm text-muted">
                Watch anything, in any order. Showing {videos.length} of {found} video{found === 1 ? "" : "s"}.
              </p>
            </div>
            <form action="/library" className="flex flex-wrap items-center gap-2">
              {show !== "all" && <input type="hidden" name="show" value={show} />}
              <label htmlFor="q" className="sr-only">Search videos</label>
              <input id="q" name="q" type="search" defaultValue={q} placeholder="Search videos" className="field min-h-11 w-56 rounded-full" />
              {topics.length > 0 && (
                <>
                  <label htmlFor="topic" className="sr-only">Topic</label>
                  <select id="topic" name="topic" defaultValue={topic} className="field min-h-11 w-auto rounded-full text-sm font-bold text-soft">
                    <option value="">All topics</option>
                    {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </>
              )}
              <button className="btn min-h-11 px-5 text-sm">Search</button>
            </form>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={link({ show: "" })} className={chip(show === "all")}>All</Link>
            <Link href={link({ show: "todo" })} className={chip(show === "todo")}>Not watched</Link>
            <Link href={link({ show: "watched" })} className={chip(show === "watched")}>Watched</Link>
          </div>

          {videos.length === 0 ? (
            <div className="card flex flex-col items-center gap-2 p-12 text-center">
              <p className="text-lg font-bold text-deep">{total === 0 ? "Videos are on their way" : "No videos match"}</p>
              <p className="text-soft">
                {total === 0 ? "Greenzone is adding the first videos. Please check back soon." : "Try a different search or filter."}
              </p>
              {total > 0 && <Link href="/library" className="btn-outline mt-2">Show all videos</Link>}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
              {videos.map((v, i) => {
                const p = v.progress[0];
                const pct = p && v.durationSeconds ? Math.min(100, Math.round((p.positionSeconds / v.durationSeconds) * 100)) : 0;
                return (
                  <Link key={v.id} href={`/watch/${v.id}`} className="card flex flex-col overflow-hidden rounded-[18px] transition hover:shadow-lg">
                    <Thumb video={v} index={i}>
                      {p?.completed && (
                        <span className="pill absolute top-2.5 left-2.5 gap-1.5 bg-sun py-1 pr-2.5 pl-1.5 text-xs text-deep"><Check size={15} /> Watched</span>
                      )}
                    </Thumb>
                    <div className="flex flex-col gap-2 px-4 pt-4 pb-5">
                      {v.topic && <span className="eyebrow text-xs">{v.topic.name}</span>}
                      <span className="text-[17px] leading-snug font-bold">{v.title}</span>
                      {p?.completed ? (
                        <span className="text-[13px] font-semibold text-brand">Completed · watch again</span>
                      ) : p && p.positionSeconds > 0 ? (
                        <>
                          <span role="img" aria-label="Partly watched" className="h-1.5 rounded-full bg-line">
                            <span className="block h-1.5 rounded-full bg-brand" style={{ width: `${Math.max(pct, 4)}%` }} />
                          </span>
                          <span className="text-[13px] text-muted">In progress</span>
                        </>
                      ) : (
                        <span className="text-[13px] text-muted">Not started</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          {found > videos.length && (
            <div className="card flex flex-wrap items-center justify-between gap-4 rounded-[18px] px-7 py-6">
              <p className="font-bold text-deep">{found - videos.length} more video{found - videos.length === 1 ? "" : "s"}</p>
              <Link href={link({ n: String(take + PAGE) })} scroll={false} className="btn-outline">Load more videos</Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
