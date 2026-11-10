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
    <div className="min-h-screen bg-mist">
      <SiteHeader user={me} />
      <main className="mx-auto flex max-w-[1180px] flex-wrap items-start gap-8 px-[5%] py-9">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          <Link href={back} className="btn-sm self-start gap-2 rounded-full"><Back /> {teachers ? "Back to course" : "Back to library"}</Link>
          <Player
            key={video.id}
            videoId={video.id}
            kind={yt ? "youtube" : "native"}
            src={src}
            startAt={completed ? 0 : mine?.positionSeconds ?? 0}
            alreadyCompleted={completed}
            nextHref={nextHref}
          />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <span className="eyebrow text-xs">{teachers ? video.course?.title : video.topic?.name ?? "Parents Hub"}</span>
              <h1 className="text-[clamp(26px,3vw,34px)] leading-tight font-extrabold tracking-tight text-deep">{video.title}</h1>
            </div>
            {completed ? (
              <span className="pill gap-2 bg-brand py-2.5 pr-4 pl-2.5 text-sm text-white"><Check /> Watched</span>
            ) : (
              <span className="pill border-[1.5px] border-edge bg-white px-4 py-2.5 text-sm text-soft">
                {mine && mine.positionSeconds > 0 ? "In progress" : "Not started"}
              </span>
            )}
          </div>
          {video.description && <p className="leading-relaxed whitespace-pre-line text-soft">{video.description}</p>}
          {video.resourceUrl && (
            <div className="card flex flex-col gap-3 rounded-[18px] p-6">
              <h2 className="text-lg font-extrabold text-deep">Resources for this video</h2>
              <a href={video.resourceUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 text-[15px] font-semibold text-brand">
                <Download /> {video.resourceLabel || "Download the notes"}
              </a>
            </div>
          )}
        </div>

        <aside className="card flex flex-[1_1_300px] flex-col gap-2 rounded-[20px] p-5">
          <div className="flex items-baseline justify-between gap-3 pb-1">
            <h2 className="text-lg font-extrabold text-deep">{teachers ? "Course modules" : "More videos"}</h2>
            <span className="text-[13px] font-bold text-brand">{watchedCount} of {all.length} watched</span>
          </div>
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
        </aside>
      </main>
    </div>
  );
}
