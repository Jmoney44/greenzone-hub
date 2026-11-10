import { db } from "./db";
import { isSubscribed, type Me } from "./auth";

export type CourseView = Awaited<ReturnType<typeof teacherCourses>>[number];

/** Published courses in order, with this teacher's progress. A course is locked until every course before it is finished. */
export async function teacherCourses(userId: string) {
  const courses = await db.course.findMany({
    where: { published: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: {
      videos: {
        where: { published: true, hub: "TEACHERS" },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        include: { progress: { where: { userId } } },
      },
    },
  });
  let previousDone = true;
  return courses.map((c, index) => {
    const total = c.videos.length;
    const done = c.videos.filter((v) => v.progress[0]?.completed).length;
    const locked = !previousDone;
    // An empty course never blocks the ones after it.
    if (total > 0 && done < total) previousDone = false;
    return { ...c, index, total, done, locked, finished: total > 0 && done === total };
  });
}

/** Can this person play this video? */
export async function canWatch(user: Me, video: { hub: string; published: boolean; courseId: string | null }) {
  if (user.role === "ADMIN") return true;
  if (!video.published) return false;
  if (user.role === "PARENT") return video.hub === "PARENTS" && isSubscribed(user);
  if (user.role === "TEACHER") {
    if (video.hub !== "TEACHERS" || !video.courseId) return false;
    const course = (await teacherCourses(user.id)).find((c) => c.id === video.courseId);
    return !!course && !course.locked;
  }
  return false;
}

/** Adds a year of access. Renewing early adds to the time left. */
export async function grantYear(userId: string) {
  const u = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const from = u.subscriptionEndsAt && u.subscriptionEndsAt > new Date() ? u.subscriptionEndsAt : new Date();
  const ends = new Date(from);
  ends.setFullYear(ends.getFullYear() + 1);
  await db.user.update({ where: { id: userId }, data: { subscriptionEndsAt: ends } });
  return ends;
}

/** Payments that arrived before the buyer had an account are applied when they sign up with the same email. */
export async function claimPayments(userId: string, email: string) {
  const waiting = await db.payment.findMany({ where: { email, userId: null } });
  for (const p of waiting) {
    await db.payment.update({ where: { id: p.id }, data: { userId } });
    await grantYear(userId);
  }
}
