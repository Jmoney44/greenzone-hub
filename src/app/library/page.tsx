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
  const tab = (on: boolean) => `tab ${on ? "tab-on" : ""}`;
  const resumePct = resume?.video.durationSeconds ? Math.min(100, Math.round((resume.positionSeconds / resume.video.durationSeconds) * 100)) : 0;

  return (
    <div className="hub">
      <SiteHeader user={me} active="hub" />
      <main className="page">
        {sp.welcome && (
          <p role="status" className="flex items-center gap-3 rounded-2xl bg-tint px-5 py-4 font-bold text-deep">
            <Check /> Payment confirmed. Your library is open for the next 12 months.
          </p>
        )}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className={`hero flex min-w-0 flex-col justify-between gap-7 ${resume ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-bold tracking-widest text-sun uppercase">Parents Hub</span>
              <h1 className="text-[clamp(26px,3vw,36px)] leading-tight font-extrabold tracking-tight">Welcome back, {me.name.split(" ")[0]}</h1>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap justify-between gap-x-3 text-[15px] font-semibold text-[#e4f0e8]">
                <span>Your progress</span>
                <span>{watched} of {total} videos watched · {percent}%</span>
              </div>
              <div role="img" aria-label={`${watched} of ${total} videos watched`} className="h-2.5 rounded-full bg-white/15">
                <div className="h-2.5 rounded-full bg-sun" style={{ width: `${percent}%` }} />
              </div>
              {me.role === "PARENT" && (
                <span className="pt-1 text-sm text-pale">Subscription active until <strong className="text-white">{day(me.subscriptionEndsAt)}</strong></span>
              )}
            </div>
          </div>
          {resume && (
            <Link href={`/watch/${resume.videoId}`} className="card group flex min-w-0 flex-col justify-between gap-5 rounded-3xl p-6 transition hover:border-edge hover:shadow-md">
              <span className="eyebrow text-xs">Continue watching</span>
              <span className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand text-white transition group-hover:bg-deep"><Play size={24} /></span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-lg leading-snug font-bold text-ink">{resume.video.title}</span>
                  <span className="text-sm text-muted">Resume from {clock(resume.positionSeconds)}</span>
                </span>
              </span>
              <span aria-hidden className="h-1.5 rounded-full bg-line"><span className="block h-1.5 rounded-full bg-brand" style={{ width: `${Math.max(resumePct, 4)}%` }} /></span>
            </Link>
          )}
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-deep">The parents&apos; library</h2>
            <p className="text-[15px] text-soft">
              Watch anything, in any order. Showing {videos.length} of {found} video{found === 1 ? "" : "s"}.
            </p>
          </div>
          <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
            <div className="tabs">
              <Link href={link({ show: "" })} className={tab(show === "all")}>All</Link>
              <Link href={link({ show: "todo" })} className={tab(show === "todo")}>Not watched</Link>
              <Link href={link({ show: "watched" })} className={tab(show === "watched")}>Watched</Link>
            </div>
            <form action="/library" className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
              {show !== "all" && <input type="hidden" name="show" value={show} />}
              <label htmlFor="q" className="sr-only">Search videos</label>
              <input id="q" name="q" type="search" defaultValue={q} placeholder="Search videos" className="field min-h-11 w-full text-sm sm:w-56" />
              {topics.length > 0 && (
                <>
                  <label htmlFor="topic" className="sr-only">Topic</label>
                  <select id="topic" name="topic" defaultValue={topic} className="field min-h-11 w-auto min-w-0 flex-1 text-sm font-bold text-soft sm:flex-none">
                    <option value="">All topics</option>
                    {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </>
              )}
              <button className="btn min-h-11 rounded-xl px-5 text-sm">Search</button>
            </form>
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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos.map((v, i) => {
                const p = v.progress[0];
                const pct = p && v.durationSeconds ? Math.min(100, Math.round((p.positionSeconds / v.durationSeconds) * 100)) : 0;
                return (
                  <Link key={v.id} href={`/watch/${v.id}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-edge hover:shadow-lg">
                    <Thumb video={v} index={i}>
                      {p?.completed && (
                        <span className="pill absolute top-2.5 left-2.5 gap-1.5 bg-sun py-1 pr-2.5 pl-1.5 text-xs text-deep"><Check size={15} /> Watched</span>
                      )}
                    </Thumb>
                    <div className="flex flex-1 flex-col gap-2 px-4 pt-4 pb-4">
                      {v.topic && <span className="eyebrow text-[11px]">{v.topic.name}</span>}
                      <span className="text-base leading-snug font-bold text-ink">{v.title}</span>
                      <div className="mt-auto flex flex-col gap-2 pt-2">
                        {p?.completed ? (
                          <span className="text-[13px] font-bold text-brand">Completed · watch again</span>
                        ) : p && p.positionSeconds > 0 ? (
                          <>
                            <span role="img" aria-label="Partly watched" className="h-1.5 rounded-full bg-line">
                              <span className="block h-1.5 rounded-full bg-brand" style={{ width: `${Math.max(pct, 4)}%` }} />
                            </span>
                            <span className="text-[13px] font-bold text-soft">In progress</span>
                          </>
                        ) : (
                          <span className="text-[13px] text-muted">Not started</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          {found > videos.length && (
            <div className="flex flex-col items-center gap-3 pt-2">
              <p className="text-sm font-bold text-soft">{found - videos.length} more video{found - videos.length === 1 ? "" : "s"}</p>
              <Link href={link({ n: String(take + PAGE) })} scroll={false} className="btn-outline">Load more videos</Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
