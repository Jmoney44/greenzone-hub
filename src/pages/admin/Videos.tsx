import Link from "@/components/Link";
import { ConfirmButton } from "@/components/Confirm";
import { Empty, PageHeader, Status } from "@/components/AdminUI";
import { Upload } from "@/components/icons";
import { useSearchParams } from "react-router";
import { Loading, LoadError } from "@/components/Loading";
import { deleteVideo, moveVideo, toggleVideo } from "@/lib/actions";
import { VIDEO_WITH, count as countRows, toVideo } from "@/lib/api";
import { useLoad, useTitle } from "@/lib/load";
import { must, supabase } from "@/lib/supabase";
import { clock } from "@/lib/format";

async function loadVideos(hub: string) {
  const [rows, done, parentCount, teacherCount] = await Promise.all([
    supabase.from("videos").select(VIDEO_WITH).eq("hub", hub).order("position").order("created_at").then(must),
    supabase.rpc("admin_video_completions").then(must) as Promise<{ video_id: string; done: number }[]>,
    countRows("videos", (q) => q.eq("hub", "PARENTS")),
    countRows("videos", (q) => q.eq("hub", "TEACHERS")),
  ]);
  const videos = rows.map((r) => ({ ...toVideo(r), _count: { progress: Number(done.find((d) => d.video_id === r.id)?.done ?? 0) } }));
  return { videos, parentCount, teacherCount };
}

export default function AdminVideos() {
  useTitle("Videos");
  const [params] = useSearchParams();
  const hub = params.get("hub") === "TEACHERS" ? "TEACHERS" : "PARENTS";
  const load = useLoad(() => loadVideos(hub), [hub]);
  if (load.error) return <LoadError message={load.error} retry={load.reload} />;
  if (!load.data) return <Loading />;
  const { videos, parentCount, teacherCount } = load.data;
  const after = <T,>(fn: () => Promise<T>) => async () => {
    await fn();
    load.reload();
  };
  // Teachers Hub videos are shown course by course, in course order.
  if (hub === "TEACHERS") videos.sort((a, b) => (a.course?.position ?? 0) - (b.course?.position ?? 0) || a.position - b.position);
  const count = "rounded-full bg-[#e3ece6] px-2 py-0.5 text-xs font-extrabold text-soft";
  const add = <Link href={`/admin/videos/new?hub=${hub}`} className="btn"><Upload /> Upload video</Link>;
  return (
    <>
      <PageHeader title="Videos" note="Upload, order and publish the videos in each hub. People see them in the order shown here.">{add}</PageHeader>
      <div className="tabs self-start">
        <Link href="/admin/videos?hub=PARENTS" className={`tab ${hub === "PARENTS" ? "tab-on" : ""}`}>Parents Hub <span className={count}>{parentCount}</span></Link>
        <Link href="/admin/videos?hub=TEACHERS" className={`tab ${hub === "TEACHERS" ? "tab-on" : ""}`}>Teachers Hub <span className={count}>{teacherCount}</span></Link>
      </div>
      <section className="card overflow-hidden">
        {videos.length === 0 ? (
          <Empty title="No videos here yet"><p className="text-soft">Add the first video for this hub.</p>{add}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl min-w-[900px]">
              <thead>
                <tr>
                  <th>Order</th><th>Video</th><th>{hub === "TEACHERS" ? "Course" : "Topic"}</th>
                  <th>Length</th><th>Status</th><th>Finished by</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v, i) => (
                  <tr key={v.id}>
                    <td>
                      <form action={async (f) => { await moveVideo(v.id, String(f.get("dir"))); load.reload(); }} className="flex items-center gap-1">
                        <span className="w-6 text-sm font-bold text-muted tabular-nums">{i + 1}</span>
                        <button name="dir" value="up" aria-label={`Move ${v.title} up`} className="btn-sm min-w-11 px-0">↑</button>
                        <button name="dir" value="down" aria-label={`Move ${v.title} down`} className="btn-sm min-w-11 px-0">↓</button>
                      </form>
                    </td>
                    <td className="min-w-[170px] font-bold text-ink">{v.title}</td>
                    <td className="text-soft">{hub === "TEACHERS" ? v.course?.title ?? "—" : v.topic?.name ?? "—"}</td>
                    <td className="text-soft tabular-nums">{v.durationSeconds ? clock(v.durationSeconds) : "—"}</td>
                    <td><Status tone={v.published ? "on" : "off"}>{v.published ? "Published" : "Draft"}</Status></td>
                    <td className="text-soft tabular-nums">{v._count.progress}</td>
                    <td>
                      <div className="flex gap-2">
                        <Link href={`/admin/videos/${v.id}`} className="btn-sm">Edit</Link>
                        <form action={after(() => toggleVideo(v.id, v.published))}><button className="btn-sm">{v.published ? "Unpublish" : "Publish"}</button></form>
                        <form action={after(() => deleteVideo(v.id, v.sourceType))}><ConfirmButton className="btn-danger" message={`Delete “${v.title}” for good?`}>Delete</ConfirmButton></form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
