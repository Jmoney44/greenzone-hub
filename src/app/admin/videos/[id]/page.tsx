import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoForm } from "@/components/VideoForm";
import { Back } from "@/components/icons";
import { db } from "@/lib/db";

export default async function EditVideo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [video, topics, courses] = await Promise.all([
    db.video.findUnique({ where: { id } }),
    db.topic.findMany({ orderBy: { name: "asc" } }),
    db.course.findMany({ orderBy: { position: "asc" } }),
  ]);
  if (!video) notFound();
  return (
    <>
      <Link href={`/admin/videos?hub=${video.hub}`} className="btn-sm self-start gap-2 rounded-full"><Back /> All videos</Link>
      <h1 className="text-3xl font-extrabold tracking-tight text-deep">Edit video</h1>
      <VideoForm video={video} topics={topics} courses={courses.map((c) => ({ id: c.id, name: c.title }))} defaultHub={video.hub} />
      <Link href={`/watch/${video.id}`} className="font-bold text-brand">Preview this video</Link>
    </>
  );
}
