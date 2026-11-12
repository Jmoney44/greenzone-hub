import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Arrow, Back, Check, Play } from "@/components/icons";
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
  const percent = course.total ? Math.round((course.done / course.total) * 100) : 0;
  return (
    <div className="hub">
      <SiteHeader user={me} active="teachers" />
      <main className="page max-w-[900px] gap-6">
        <Link href="/teachers" className="back"><Back /> All courses</Link>
        <section className="hero flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-bold tracking-widest text-sun uppercase">Course {course.index + 1}</span>
            <h1 className="text-[clamp(26px,3vw,36px)] leading-tight font-extrabold tracking-tight">{course.title}</h1>
            {course.description && <p className="leading-relaxed text-pale">{course.description}</p>}
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap justify-between gap-x-3 text-[15px] font-semibold text-[#e4f0e8]">
              <span>Your progress</span><span>{course.done} of {course.total} modules · {percent}%</span>
            </div>
            <div role="img" aria-label={`${course.done} of ${course.total} modules completed`} className="h-2.5 rounded-full bg-white/15">
              <div className="h-2.5 rounded-full bg-sun" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </section>
        {course.finished && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-tint px-6 py-4 text-deep">
            <span className="flex items-center gap-3 font-bold"><Check className="text-brand" /> Course completed</span>
            {upNext && <Link href={`/teachers/${upNext.id}`} className="btn min-h-11 px-5 text-sm">Start {upNext.title} <Arrow size={16} /></Link>}
          </div>
        )}
        <section className="card overflow-hidden">
          <div className="panel-head">
            <h2 className="text-lg font-extrabold text-deep">Modules</h2>
            <span className="text-sm font-bold text-brand">{course.done} of {course.total} completed</span>
          </div>
          {course.videos.length === 0 && <p className="px-6 py-8 text-soft">Modules for this course are being prepared.</p>}
          <ul className="flex flex-col divide-y divide-[#eef4f0]">
            {course.videos.map((v, i) => {
              const done = v.progress[0]?.completed;
              const started = (v.progress[0]?.positionSeconds ?? 0) > 0;
              return (
                <li key={v.id}>
                  <Link href={`/watch/${v.id}`} className="group flex min-h-18 items-center gap-4 px-6 py-3 hover:bg-[#f7faf8]">
                    {done ? (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white"><Check size={18} /></span>
                    ) : (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tint text-deep transition group-hover:bg-brand group-hover:text-white"><Play size={16} /></span>
                    )}
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[12px] font-bold tracking-wider text-muted uppercase">Module {i + 1}</span>
                      <span className="font-bold text-ink">{v.title}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-0.5 text-[13px]">
                      <span className={`font-bold ${done ? "text-brand" : "text-soft"}`}>{done ? "Completed" : started ? "In progress" : "Not started"}</span>
                      {v.durationSeconds > 0 && <span className="text-muted tabular-nums">{clock(v.durationSeconds)}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
