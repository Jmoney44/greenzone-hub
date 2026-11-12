import { VideoForm } from "@/components/VideoForm";
import { PageHeader } from "@/components/AdminUI";
import { db } from "@/lib/db";

export default async function NewVideo({ searchParams }: { searchParams: Promise<{ hub?: string }> }) {
  const { hub } = await searchParams;
  const [topics, courses] = await Promise.all([
    db.topic.findMany({ orderBy: { name: "asc" } }),
    db.course.findMany({ orderBy: { position: "asc" } }),
  ]);
  return (
    <>
      <PageHeader title="Add a video" back={{ href: "/admin/videos", label: "All videos" }} />
      <VideoForm topics={topics} courses={courses.map((c) => ({ id: c.id, name: c.title }))} defaultHub={hub === "TEACHERS" ? "TEACHERS" : "PARENTS"} />
    </>
  );
}
