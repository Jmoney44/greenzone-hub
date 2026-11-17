import Link from "@/components/Link";
import { useParams } from "react-router";
import { VideoForm } from "@/components/VideoForm";
import { PageHeader } from "@/components/AdminUI";
import { Loading, LoadError } from "@/components/Loading";
import { NotFound } from "@/pages/NotFound";
import { COURSE_COLS, VIDEO_COLS, toCourse, toVideo, videoSource } from "@/lib/api";
import { useLoad, useTitle } from "@/lib/load";
import { must, supabase } from "@/lib/supabase";

export async function loadFormOptions() {
  const [topics, courses] = await Promise.all([
    supabase.from("topics").select("id,name").order("name").then(must),
    supabase.from("courses").select(COURSE_COLS).order("position").order("created_at").then(must).then((r) => r.map(toCourse)),
  ]);
  return { topics: topics as { id: string; name: string }[], courses };
}

async function loadEdit(id: string) {
  const [row, source, options] = await Promise.all([
    supabase.from("videos").select(VIDEO_COLS).eq("id", id).maybeSingle().then((r) => must(r) as Record<string, unknown> | null),
    videoSource(id),
    loadFormOptions(),
  ]);
  return { video: row ? { ...toVideo(row), source: source ?? "" } : null, ...options };
}

export default function EditVideo() {
  const { id = "" } = useParams();
  const load = useLoad(() => loadEdit(id), [id]);
  useTitle(load.data?.video?.title ? `Edit: ${load.data.video.title}` : "Edit video");
  if (load.error) return <LoadError message={load.error} retry={load.reload} />;
  if (!load.data) return <Loading />;
  const { video, topics, courses } = load.data;
  if (!video) return <NotFound />;
  return (
    <>
      <PageHeader title="Edit video" note={video.title} back={{ href: `/admin/videos?hub=${video.hub}`, label: "All videos" }}>
        <Link href={`/watch/${video.id}`} className="btn-outline">Preview this video</Link>
      </PageHeader>
      <VideoForm video={video} topics={topics} courses={courses.map((c) => ({ id: c.id, name: c.title }))} defaultHub={video.hub} />
    </>
  );
}
