import Link from "next/link";
import { VideoForm } from "@/components/VideoForm";
import { Back } from "@/components/icons";
import { db } from "@/lib/db";

export default async function NewVideo({ searchParams }: { searchParams: Promise<{ hub?: string }> }) {
  const { hub } = await searchParams;
  const [topics, courses] = await Promise.all([
    db.topic.findMany({ orderBy: { name: "asc" } }),
    db.course.findMany({ orderBy: { position: "asc" } }),
  ]);
  return (
    <>
      <Link href="/admin/videos" className="btn-sm self-start gap-2 rounded-full"><Back /> All videos</Link>
      <h1 className="text-3xl font-extrabold tracking-tight text-deep">Add a video</h1>
      <VideoForm topics={topics} courses={courses.map((c) => ({ id: c.id, name: c.title }))} defaultHub={hub === "TEACHERS" ? "TEACHERS" : "PARENTS"} />
    </>
  );
}
