import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Lock } from "@/components/icons";
import { requireRole } from "@/lib/auth";
import { teacherCourses } from "@/lib/access";

export const metadata = { title: "Teachers Hub" };
const tints = ["bg-leaf", "bg-[#1e6b3c]", "bg-deep"];

export default async function TeachersPage() {
  const me = await requireRole("TEACHER");
  const courses = await teacherCourses(me.id);
  const total = courses.reduce((n, c) => n + c.total, 0);
  const done = courses.reduce((n, c) => n + c.done, 0);
  return (
    <div className="min-h-screen bg-mist">
      <SiteHeader user={me} active="hub" />
      <main className="mx-auto flex max-w-[1180px] flex-col gap-9 px-[5%] py-11">
        <section className="flex flex-wrap items-center justify-between gap-6 rounded-[22px] bg-deep p-9 text-white">
          <div className="flex flex-[1_1_380px] flex-col gap-3">
            <span className="pill self-start bg-sun text-xs tracking-wider text-deep uppercase">Teachers Hub</span>
            <h1 className="text-[clamp(28px,3.2vw,38px)] leading-tight font-extrabold tracking-tight">Welcome, {me.name.split(" ")[0]}</h1>
            <p className="max-w-xl leading-relaxed text-pale">
              Open a course and work through its modules. Completed modules are ticked off, and finishing a course unlocks
              the next one.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 rounded-2xl bg-leaf px-6 py-5">
            <span className="text-[13px] font-bold text-pale">Modules completed</span>
            <span className="text-[34px] font-extrabold text-sun">{done} of {total}</span>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="text-[26px] font-extrabold text-deep">Training courses</h2>
          {courses.length === 0 && (
            <div className="card p-12 text-center text-soft">Your training courses will appear here as soon as Greenzone publishes them.</div>
          )}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
            {courses.map((c, i) => {
              const body = (
                <>
                  <div className={`flex aspect-[16/7] items-end p-3.5 ${c.locked ? "bg-[#5e6b63]" : tints[i % tints.length]}`}>
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-xs font-extrabold text-deep">
                      {c.locked && <Lock size={13} />}{c.locked ? "Locked · " : ""}{c.total} module{c.total === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5 px-5 pt-4 pb-5">
                    <span className="text-[19px] font-extrabold text-deep">{c.title}</span>
                    {c.description && <span className="text-sm leading-normal text-soft">{c.description}</span>}
                    <span role="img" aria-label={`${c.done} of ${c.total} completed`} className="h-2 rounded-full bg-line">
                      <span className="block h-2 rounded-full bg-brand" style={{ width: `${c.total ? (c.done / c.total) * 100 : 0}%` }} />
                    </span>
                    <span className="flex justify-between gap-3 text-[13px] font-bold">
                      <span className="text-soft">{c.locked ? "Finish the course before this one to unlock" : `${c.done} of ${c.total} completed`}</span>
                      <span className="text-brand">{c.locked ? "" : c.finished ? "Completed · review" : c.done ? "Continue" : "Start course"}</span>
                    </span>
                  </div>
                </>
              );
              return c.locked ? (
                <div key={c.id} aria-disabled className="flex flex-col overflow-hidden rounded-[18px] border border-dashed border-[#8fa397] bg-white">{body}</div>
              ) : (
                <Link key={c.id} href={`/teachers/${c.id}`} className="card flex flex-col overflow-hidden rounded-[18px] transition hover:shadow-lg">{body}</Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
