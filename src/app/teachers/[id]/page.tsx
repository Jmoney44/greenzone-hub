import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Back, Check, Play } from "@/components/icons";
import { requireRole } from "@/lib/auth";
import { teacherCourses } from "@/lib/access";
import { clock } from "@/lib/format";

export const metadata = { title: "Course" };

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole("TEACHER");
  const { id } = await params;
  const courses = await teacherCourses(me.id);
  const course = courses.find((c) => c.id === id);
  if (!course) notFound();
  if (course.locked && me.role !== "ADMIN") redirect("/teachers");
  const upNext = courses[course.index + 1];
  return (
    <div className="min-h-screen bg-mist">
      <SiteHeader user={me} active="hub" />
      <main className="mx-auto flex max-w-[900px] flex-col gap-7 px-[5%] py-11">
        <Link href="/teachers" className="btn-sm self-start gap-2 rounded-full"><Back /> All courses</Link>
        <div className="flex flex-col gap-3">
          <span className="eyebrow">Course {course.index + 1}</span>
          <h1 className="text-[clamp(28px,3.2vw,38px)] leading-tight font-extrabold tracking-tight text-deep">{course.title}</h1>
          {course.description && <p className="leading-relaxed text-soft">{course.description}</p>}
        </div>
        {course.finished && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-deep px-6 py-5 text-white">
            <span className="flex items-center gap-3 font-bold"><Check className="text-sun" /> Course completed</span>
            {upNext && <Link href={`/teachers/${upNext.id}`} className="btn min-h-11 bg-sun text-deep hover:bg-white">Start {upNext.title}</Link>}
          </div>
        )}
        <section className="card flex flex-col gap-3 rounded-[22px] p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[22px] font-extrabold text-deep">Modules</h2>
            <span className="text-sm font-bold text-brand">{course.done} of {course.total} completed</span>
          </div>
          {course.videos.length === 0 && <p className="text-soft">Modules for this course are being prepared.</p>}
          {course.videos.map((v, i) => {
            const done = v.progress[0]?.completed;
            const started = (v.progress[0]?.positionSeconds ?? 0) > 0;
            return (
              <Link key={v.id} href={`/watch/${v.id}`} className="flex min-h-16 items-center gap-4 rounded-2xl bg-mist px-4 py-2 hover:bg-tint">
                {done ? (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-white"><Check size={16} /></span>
                ) : (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-edge bg-white text-deep"><Play size={12} /></span>
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-bold">Module {i + 1}: {v.title}</span>
                  <span className="text-[13px] text-muted">{done ? "Completed" : started ? "In progress" : "Not started"}</span>
                </span>
                {v.durationSeconds > 0 && <span className="text-[13px] font-semibold text-soft">{clock(v.durationSeconds)}</span>}
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
