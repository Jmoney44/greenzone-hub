import Link from "next/link";
import { ConfirmButton } from "@/components/Confirm";
import { Empty, PageHeader, Status } from "@/components/AdminUI";
import { Upload } from "@/components/icons";
import { deleteVideo, moveVideo, toggleVideo } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { clock } from "@/lib/format";

export default async function AdminVideos({ searchParams }: { searchParams: Promise<{ hub?: string }> }) {
  const hub = (await searchParams).hub === "TEACHERS" ? "TEACHERS" : "PARENTS";
  const [videos, parentCount, teacherCount] = await Promise.all([
    db.video.findMany({
      where: { hub },
      include: { topic: true, course: true, _count: { select: { progress: { where: { completed: true } } } } },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    }),
    db.video.count({ where: { hub: "PARENTS" } }),
    db.video.count({ where: { hub: "TEACHERS" } }),
  ]);
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
                      <form action={moveVideo} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={v.id} />
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
                        <form action={toggleVideo}><input type="hidden" name="id" value={v.id} /><button className="btn-sm">{v.published ? "Unpublish" : "Publish"}</button></form>
                        <form action={deleteVideo}><input type="hidden" name="id" value={v.id} /><ConfirmButton className="btn-danger" message={`Delete “${v.title}” for good?`}>Delete</ConfirmButton></form>
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
