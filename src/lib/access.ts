import { COURSE_COLS, VIDEO_COLS, myProgress, toCourse, toVideo } from "./api";
import { must, supabase } from "./supabase";

export type CourseView = Awaited<ReturnType<typeof teacherCourses>>[number];

const byOrder = (a: { position: number; createdAt: Date; id: string }, b: { position: number; createdAt: Date; id: string }) =>
  a.position - b.position || a.createdAt.getTime() - b.createdAt.getTime() || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Published courses in order, with this teacher's progress. A course is locked until every course before it is finished.
 * (The database applies the same rule before it hands out any video, so this is only for display.)
 */
export async function teacherCourses(userId: string) {
  const [courses, videos, progress] = await Promise.all([
    supabase.from("courses").select(COURSE_COLS).eq("published", true).then(must).then((r) => r.map(toCourse)),
    supabase.from("videos").select(VIDEO_COLS).eq("hub", "TEACHERS").eq("published", true).not("course_id", "is", null).then(must).then((r) => r.map(toVideo)),
    myProgress(userId),
  ]);
  courses.sort(byOrder);
  let previousDone = true;
  return courses.map((c, index) => {
    const list = videos
      .filter((v) => v.courseId === c.id)
      .sort(byOrder)
      .map((v) => ({ ...v, progress: progress.filter((p) => p.videoId === v.id) }));
    const total = list.length;
    const done = list.filter((v) => v.progress[0]?.completed).length;
    const locked = !previousDone;
    // An empty course never blocks the ones after it.
    if (total > 0 && done < total) previousDone = false;
    return { ...c, videos: list, index, total, done, locked, finished: total > 0 && done === total };
  });
}

export { byOrder };
