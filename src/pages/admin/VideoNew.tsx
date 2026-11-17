import { VideoForm } from "@/components/VideoForm";
import { PageHeader } from "@/components/AdminUI";
import { useSearchParams } from "react-router";
import { Loading } from "@/components/Loading";
import { loadFormOptions } from "./VideoEdit";
import { useLoad, useTitle } from "@/lib/load";

export default function NewVideo() {
  useTitle("Add a video");
  const hub = useSearchParams()[0].get("hub") ?? undefined;
  const load = useLoad(loadFormOptions, []);
  if (!load.data) return <Loading />;
  const { topics, courses } = load.data;
  return (
    <>
      <PageHeader title="Add a video" back={{ href: "/admin/videos", label: "All videos" }} />
      <VideoForm topics={topics} courses={courses.map((c) => ({ id: c.id, name: c.title }))} defaultHub={hub === "TEACHERS" ? "TEACHERS" : "PARENTS"} />
    </>
  );
}
