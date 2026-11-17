import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Arrow, Check, Lock } from "@/components/icons";
import { requireRole } from "@/lib/auth";
import { teacherCourses } from "@/lib/access";

export const metadata = { title: "Teachers Hub" };

export default async function TeachersPage() {
  const me = await requireRole("TEACHER");
  const courses = await teacherCourses(me.id);
  const total = courses.reduce((n, c) => n + c.total, 0);
  const done = courses.reduce((n, c) => n + c.done, 0);
  const finished = courses.filter((c) => c.finished).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="hub">
      <SiteHeader user={me} active="teachers" />
      <main className="page">
        <section className="hero flex flex-col gap-7">
          <div className="flex max-w-2xl flex-col gap-2">
            <span className="text-[13px] font-bold tracking-widest text-sun uppercase">Teachers Hub</span>
            <h1 className="text-[clamp(26px,3vw,36px)] leading-tight font-extrabold tracking-tight">Welcome, {me.name.split(" ")[0]}</h1>
            <p className="leading-relaxed text-pale">
              Open a course and work through its modules. Completed modules are ticked off, and finishing a course unlocks
              the next one.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="stat"><span className="text-[13px] font-bold text-pale">Modules completed</span><span className="text-[28px] font-extrabold text-sun tabular-nums">{done} of {total}</span></div>
            <div className="stat"><span className="text-[13px] font-bold text-pale">Courses finished</span><span className="text-[28px] font-extrabold tabular-nums">{finished} of {courses.length}</span></div>
            <div className="stat justify-between">
              <span className="text-[13px] font-bold text-pale">Overall progress · {percent}%</span>
              <span role="img" aria-label={`${percent}% complete`} className="mb-3 h-2.5 rounded-full bg-white/15"><span className="block h-2.5 rounded-full bg-sun" style={{ width: `${percent}%` }} /></span>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-deep">Training courses</h2>
            <p className="text-[15px] text-soft">Take them in order. Each one opens when the course before it is finished.</p>
          </div>
          {courses.length === 0 && (
            <div className="card p-12 text-center text-soft">Your training courses will appear here as soon as Greenzone publishes them.</div>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c, i) => {
              const body = (
                <>
                  <div className={`flex items-center justify-between gap-3 px-5 py-4 ${c.locked ? "bg-[#eef1ef]" : "bg-linear-to-br from-leaf to-[#072a16] text-white"}`}>
                    <span className="flex items-center gap-3">
                      <span className={`flex size-11 items-center justify-center rounded-xl text-lg font-extrabold ${c.locked ? "bg-white text-soft" : c.finished ? "bg-sun text-deep" : "bg-white/15 text-white"}`}>
                        {c.locked ? <Lock size={18} /> : c.finished ? <Check size={20} /> : i + 1}
                      </span>
                      <span className={`text-[13px] font-bold tracking-widest uppercase ${c.locked ? "text-soft" : "text-pale"}`}>Course {i + 1}</span>
                    </span>
                    <span className={`text-[13px] font-bold ${c.locked ? "text-soft" : "text-white"}`}>{c.total} module{c.total === 1 ? "" : "s"}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2.5 px-5 pt-4 pb-5">
                    <span className={`text-lg leading-snug font-extrabold ${c.locked ? "text-soft" : "text-deep"}`}>{c.title}</span>
                    {c.description && <span className="text-sm leading-normal text-soft">{c.description}</span>}
                    <div className="mt-auto flex flex-col gap-2.5 pt-3">
                      <span role="img" aria-label={`${c.done} of ${c.total} completed`} className="h-2 rounded-full bg-line">
                        <span className="block h-2 rounded-full bg-brand" style={{ width: `${c.total ? (c.done / c.total) * 100 : 0}%` }} />
                      </span>
                      <span className="flex items-center justify-between gap-3 text-[13px] font-bold">
                        <span className="text-soft">{c.locked ? "Finish the course before this one to unlock" : `${c.done} of ${c.total} completed`}</span>
                        {!c.locked && <span className="inline-flex shrink-0 items-center gap-1 text-brand">{c.finished ? "Review" : c.done ? "Continue" : "Start course"} <Arrow size={14} /></span>}
                      </span>
                    </div>
                  </div>
                </>
              );
              return c.locked ? (
                <div key={c.id} aria-disabled className="flex flex-col overflow-hidden rounded-2xl border border-dashed border-[#8fa397] bg-white">{body}</div>
              ) : (
                <Link key={c.id} href={`/teachers/${c.id}`} className="card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-edge hover:shadow-lg">{body}</Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
