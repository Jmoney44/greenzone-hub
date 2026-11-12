import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Player } from "@/components/Player";
import { SiteHeader } from "@/components/SiteHeader";
import { Arrow, Back, Check, Clock, Download, Play } from "@/components/icons";
import { db } from "@/lib/db";
import { homeFor, requireUser } from "@/lib/auth";
import { canWatch } from "@/lib/access";
import { clock, youtubeId } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await db.video.findUnique({ where: { id }, select: { title: true } });
  return { title: v?.title ?? "Video" };
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const video = await db.video.findUnique({ where: { id }, include: { topic: true, course: true } });
  if (!video) notFound();
  if (!(await canWatch(me, video))) redirect(homeFor(me));

  const teachers = video.hub === "TEACHERS";
  // The list beside the player: the course's modules for teachers, the library in order for parents.
  const all = await db.video.findMany({
    where: teachers ? { hub: "TEACHERS", courseId: video.courseId, published: true } : { hub: "PARENTS", published: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: { progress: { where: { userId: me.id } } },
  });
  const at = Math.max(0, all.findIndex((v) => v.id === video.id));
  const mine = all[at]?.progress[0];
  const completed = !!mine?.completed;
  const list = teachers ? all : [...all.slice(at), ...all.slice(0, at)].slice(0, 12);
  const after = teachers ? all.slice(at + 1) : [...all.slice(at + 1), ...all.slice(0, at)];
  const next = after.find((v) => !v.progress[0]?.completed) ?? after[0];
  const back = teachers ? `/teachers/${video.courseId}` : "/library";
  const nextHref = next ? `/watch/${next.id}` : teachers ? back : null;

  const yt = video.sourceType === "YOUTUBE" ? youtubeId(video.source) : null;
  const src = video.sourceType === "FILE" ? `/api/media/${video.id}` : yt ?? video.source;
  const watchedCount = all.filter((v) => v.progress[0]?.completed).length;

  const prev = at > 0 ? all[at - 1] : null;
  const following = at < all.length - 1 ? all[at + 1] : null;
  const percent = all.length ? Math.round((watchedCount / all.length) * 100) : 0;
  const unit = teachers ? "Module" : "Video";
  const step = "inline-flex min-h-11 items-center gap-2 rounded-xl border-[1.5px] border-edge bg-white px-4 text-sm font-bold text-deep hover:bg-mist";
  const stepOff = "inline-flex min-h-11 items-center gap-2 rounded-xl border-[1.5px] border-line bg-white px-4 text-sm font-bold text-[#9aaba0]";

  return (
    <div className="hub">
      <SiteHeader user={me} active={teachers ? "teachers" : "hub"} />
      <main className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-start gap-6 px-5 py-5 md:px-8 md:py-7 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4">
            <Link href={back} className="back"><Back /> {teachers ? "Back to course" : "Back to library"}</Link>
            <span className="text-sm font-bold text-soft">{unit} {at + 1} of {all.length}</span>
          </div>
          <div className="overflow-hidden rounded-2xl bg-black shadow-[0_24px_50px_-28px_rgba(11,61,32,0.55)]">
            <Player
              key={video.id}
              videoId={video.id}
              kind={yt ? "youtube" : "native"}
              src={src}
              startAt={completed ? 0 : mine?.positionSeconds ?? 0}
              alreadyCompleted={completed}
              nextHref={nextHref}
            />
          </div>

          <section className="card flex flex-col overflow-hidden">
            <div className="flex flex-col gap-3 p-6">
              <span className="eyebrow text-xs">{teachers ? video.course?.title : video.topic?.name ?? "Parents Hub"}</span>
              <h1 className="text-[clamp(22px,2.6vw,30px)] leading-tight font-extrabold tracking-tight text-deep">{video.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-soft">
                {completed ? (
                  <span className="pill gap-1.5 bg-brand py-1.5 pr-3.5 pl-2.5 text-white"><Check size={15} /> Watched</span>
                ) : (
                  <span className={`pill px-3.5 py-1.5 ${mine && mine.positionSeconds > 0 ? "bg-[#fbf3b4] text-[#4a4200]" : "bg-[#eef1ef] text-soft"}`}>
                    {mine && mine.positionSeconds > 0 ? "In progress" : "Not started"}
                  </span>
                )}
                {video.durationSeconds > 0 && <span className="inline-flex items-center gap-1.5 tabular-nums"><Clock size={16} /> {clock(video.durationSeconds)}</span>}
                {!completed && mine && mine.positionSeconds > 0 && <span>Resumes from {clock(mine.positionSeconds)}</span>}
              </div>
            </div>
            {video.description && (
              <div className="flex flex-col gap-2 border-t border-line p-6">
                <h2 className="text-[13px] font-bold tracking-wider text-muted uppercase">About this {unit.toLowerCase()}</h2>
                <p className="leading-relaxed whitespace-pre-line text-soft">{video.description}</p>
              </div>
            )}
            {video.resourceUrl && (
              <div className="flex flex-col gap-3 border-t border-line p-6">
                <h2 className="text-[13px] font-bold tracking-wider text-muted uppercase">Resources</h2>
                <a href={video.resourceUrl} target="_blank" rel="noopener noreferrer" className="group flex min-h-16 items-center gap-4 rounded-xl border border-line bg-[#f7faf8] px-4 py-3 hover:border-edge">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-tint text-brand"><Download size={20} /></span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-bold text-ink">{video.resourceLabel || "Download the notes"}</span>
                    <span className="text-[13px] text-muted">Opens in a new tab</span>
                  </span>
                  <Arrow size={16} className="shrink-0 text-brand transition group-hover:translate-x-0.5" />
                </a>
              </div>
            )}
            <nav aria-label={`${unit}s`} className="flex items-center justify-between gap-3 border-t border-line bg-[#f7faf8] px-6 py-4">
              {prev ? <Link href={`/watch/${prev.id}`} className={step}><Back /> Previous</Link> : <span aria-disabled className={stepOff}><Back /> Previous</span>}
              {following ? (
                <Link href={`/watch/${following.id}`} className="btn min-h-11 rounded-xl px-5 text-sm">Next {unit.toLowerCase()} <Arrow size={16} /></Link>
              ) : (
                <Link href={back} className="btn min-h-11 rounded-xl px-5 text-sm">{teachers ? "Back to course" : "Back to library"}</Link>
              )}
            </nav>
          </section>
        </div>

        <aside className="card flex min-w-0 flex-col overflow-hidden lg:sticky lg:top-22">
          <div className="flex flex-col gap-3 border-b border-line px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-extrabold text-deep">{teachers ? "Course modules" : "More videos"}</h2>
              <span className="text-[13px] font-bold text-brand">{watchedCount} of {all.length} watched</span>
            </div>
            <span role="img" aria-label={`${percent}% watched`} className="h-1.5 rounded-full bg-line"><span className="block h-1.5 rounded-full bg-brand" style={{ width: `${percent}%` }} /></span>
          </div>
          <ol className="flex flex-col gap-1 p-2 lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto">
            {list.map((v) => {
              const done = v.progress[0]?.completed;
              const here = v.id === video.id;
              return (
                <li key={v.id}>
                  <Link
                    href={`/watch/${v.id}`}
                    aria-current={here ? "page" : undefined}
                    className={`flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 ${here ? "bg-tint" : "hover:bg-[#f4f7f5]"}`}
                  >
                    {done ? (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-white"><Check size={15} /></span>
                    ) : here ? (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-deep text-sun"><Play size={14} /></span>
                    ) : (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-edge text-xs font-bold text-soft tabular-nums">{all.indexOf(v) + 1}</span>
                    )}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={`text-[15px] leading-snug ${here ? "font-extrabold text-deep" : "font-semibold text-ink"}`}>{v.title}</span>
                      <span className="text-[12px] text-muted">
                        {here ? "Now playing" : done ? "Watched" : (v.progress[0]?.positionSeconds ?? 0) > 0 ? "In progress" : "Not started"}
                        {v.durationSeconds > 0 && <span className="tabular-nums"> · {clock(v.durationSeconds)}</span>}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          {!teachers && all.length > list.length && (
            <Link href="/library" className="flex min-h-12 items-center justify-center gap-2 border-t border-line text-sm font-bold text-brand hover:bg-[#f7faf8]">See all {all.length} videos <Arrow size={16} /></Link>
          )}
        </aside>
      </main>
    </div>
  );
}
