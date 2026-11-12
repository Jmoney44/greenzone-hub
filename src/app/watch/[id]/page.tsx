import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Player } from "@/components/Player";
import { SiteHeader } from "@/components/SiteHeader";
import { Back, Check, Download } from "@/components/icons";
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

  return (
    <div className="hub">
      <SiteHeader user={me} active={teachers ? "teachers" : "hub"} />
      <main className="mx-auto flex max-w-[1180px] flex-wrap items-start gap-7 px-5 py-6 md:px-8 md:py-8">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <Link href={back} className="back"><Back /> {teachers ? "Back to course" : "Back to library"}</Link>
          <Player
            key={video.id}
            videoId={video.id}
            kind={yt ? "youtube" : "native"}
            src={src}
            startAt={completed ? 0 : mine?.positionSeconds ?? 0}
            alreadyCompleted={completed}
            nextHref={nextHref}
          />
          <div className="card flex flex-col gap-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <span className="eyebrow text-xs">{teachers ? video.course?.title : video.topic?.name ?? "Parents Hub"}</span>
              <h1 className="text-[clamp(22px,2.6vw,30px)] leading-tight font-extrabold tracking-tight text-deep">{video.title}</h1>
            </div>
            {completed ? (
              <span className="pill gap-1.5 bg-brand py-1.5 pr-3.5 pl-2.5 text-white"><Check size={15} /> Watched</span>
            ) : (
              <span className="pill bg-[#eef1ef] px-3.5 py-1.5 text-soft">
                {mine && mine.positionSeconds > 0 ? "In progress" : "Not started"}
              </span>
            )}
          </div>
          {video.description && <p className="leading-relaxed whitespace-pre-line text-soft">{video.description}</p>}
          {video.resourceUrl && (
            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <h2 className="text-[13px] font-bold tracking-wider text-muted uppercase">Resources for this video</h2>
              <a href={video.resourceUrl} target="_blank" rel="noopener noreferrer" className="btn-sm gap-2 self-start text-brand">
                <Download size={18} /> {video.resourceLabel || "Download the notes"}
              </a>
            </div>
          )}
          </div>
        </div>

        <aside className="card flex flex-[1_1_300px] flex-col overflow-hidden lg:sticky lg:top-24">
          <div className="panel-head px-5">
            <h2 className="text-base font-extrabold text-deep">{teachers ? "Course modules" : "More videos"}</h2>
            <span className="text-[13px] font-bold text-brand">{watchedCount} of {all.length} watched</span>
          </div>
          <div className="flex flex-col gap-1 p-2">
          {list.map((v) => {
            const done = v.progress[0]?.completed;
            return (
              <Link
                key={v.id}
                href={`/watch/${v.id}`}
                aria-current={v.id === video.id ? "page" : undefined}
                className={`flex min-h-13 items-center gap-3 rounded-xl px-3 py-1.5 ${v.id === video.id ? "bg-tint" : "hover:bg-mist"}`}
              >
                {done ? (
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-white"><Check size={14} /></span>
                ) : (
                  <span className="size-7 shrink-0 rounded-full border-2 border-edge" />
                )}
                <span className="min-w-0 flex-1 text-[15px] font-semibold">{v.title}</span>
                {v.durationSeconds > 0 && <span className="text-[13px] text-muted">{clock(v.durationSeconds)}</span>}
              </Link>
            );
          })}
          </div>
        </aside>
      </main>
    </div>
  );
}
