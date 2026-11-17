import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoForm } from "@/components/VideoForm";
import { PageHeader } from "@/components/AdminUI";
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
      <PageHeader title="Edit video" note={video.title} back={{ href: `/admin/videos?hub=${video.hub}`, label: "All videos" }}>
        <Link href={`/watch/${video.id}`} className="btn-outline">Preview this video</Link>
      </PageHeader>
      <VideoForm video={video} topics={topics} courses={courses.map((c) => ({ id: c.id, name: c.title }))} defaultHub={video.hub} />
    </>
  );
}
