import Link from "next/link";
import { ConfirmButton } from "@/components/Confirm";
import { Upload } from "@/components/icons";
import { deleteVideo, moveVideo, toggleVideo } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { clock } from "@/lib/format";

export default async function AdminVideos({ searchParams }: { searchParams: Promise<{ hub?: string }> }) {
  const hub = (await searchParams).hub === "TEACHERS" ? "TEACHERS" : "PARENTS";
  const videos = await db.video.findMany({
    where: { hub },
    include: { topic: true, course: true, _count: { select: { progress: { where: { completed: true } } } } },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  // Teachers Hub videos are shown course by course, in course order.
  if (hub === "TEACHERS") videos.sort((a, b) => (a.course?.position ?? 0) - (b.course?.position ?? 0) || a.position - b.position);
  const tab = (on: boolean) =>
    `inline-flex min-h-11 items-center rounded-full border-[1.5px] px-4 text-sm font-bold ${on ? "border-deep bg-deep text-white" : "border-edge bg-white text-soft"}`;
  const th = "border-b border-line px-3 py-2.5";
  const td = "border-b border-[#eef4f0] px-3 py-3";
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-deep">Videos</h1>
        <Link href={`/admin/videos/new?hub=${hub}`} className="btn"><Upload /> Upload video</Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/videos?hub=PARENTS" className={tab(hub === "PARENTS")}>Parents Hub</Link>
        <Link href="/admin/videos?hub=TEACHERS" className={tab(hub === "TEACHERS")}>Teachers Hub</Link>
      </div>
      <section className="card p-6">
        {videos.length === 0 ? (
          <p className="text-soft">No videos here yet. Use “Upload video” to add the first one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[15px]">
              <thead>
                <tr className="text-left text-xs tracking-wider text-muted uppercase">
                  <th className={th}>Order</th><th className={th}>Video</th><th className={th}>{hub === "TEACHERS" ? "Course" : "Topic"}</th>
                  <th className={th}>Length</th><th className={th}>Status</th><th className={th}>Completed by</th><th className={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <tr key={v.id}>
                    <td className={td}>
                      <form action={moveVideo} className="flex gap-1">
                        <input type="hidden" name="id" value={v.id} />
                        <button name="dir" value="up" aria-label={`Move ${v.title} up`} className="btn-sm min-w-11 px-0">↑</button>
                        <button name="dir" value="down" aria-label={`Move ${v.title} down`} className="btn-sm min-w-11 px-0">↓</button>
                      </form>
                    </td>
                    <td className={`${td} font-bold`}>{v.title}</td>
                    <td className={`${td} text-soft`}>{hub === "TEACHERS" ? v.course?.title ?? "—" : v.topic?.name ?? "—"}</td>
                    <td className={`${td} text-soft`}>{v.durationSeconds ? clock(v.durationSeconds) : "—"}</td>
                    <td className={td}>
                      <span className={`pill ${v.published ? "bg-tint text-deep" : "bg-[#eef1ef] text-soft"}`}>{v.published ? "Published" : "Draft"}</span>
                    </td>
                    <td className={`${td} text-soft`}>{v._count.progress}</td>
                    <td className={td}>
                      <div className="flex gap-2">
                        <Link href={`/admin/videos/${v.id}`} className="btn-sm">Edit</Link>
                        <form action={toggleVideo}><input type="hidden" name="id" value={v.id} /><button className="btn-sm">{v.published ? "Unpublish" : "Publish"}</button></form>
                        <form action={deleteVideo}><input type="hidden" name="id" value={v.id} /><ConfirmButton message={`Delete “${v.title}” for good?`}>Delete</ConfirmButton></form>
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
