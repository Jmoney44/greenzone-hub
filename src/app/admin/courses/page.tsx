import Link from "next/link";
import { Empty, PageHeader, Status } from "@/components/AdminUI";
import { ConfirmButton } from "@/components/Confirm";
import { ActionForm, Submit } from "@/components/Form";
import { deleteCourse, moveCourse, saveCourse, toggleCourse } from "@/app/actions/admin";
import { db } from "@/lib/db";

export default async function AdminCourses() {
  const courses = await db.course.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { videos: true } } },
  });
  return (
    <>
      <PageHeader title="Teacher courses" note="Teachers take courses in this order. Each course unlocks when the one above it is finished.">
        <a href="#new-course" className="btn">Create a course</a>
      </PageHeader>
      {courses.length === 0 && (
        <section className="card"><Empty title="No courses yet"><p className="text-soft">Create the first course below, then add its modules.</p></Empty></section>
      )}
      <div className="flex flex-col gap-4">
        {courses.map((c, i) => (
          <section key={c.id} className="card overflow-hidden">
            <div className="panel-head bg-[#f7faf8]">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand font-extrabold text-white">{i + 1}</span>
                <span className="text-sm font-bold text-soft">Course {i + 1} · {c._count.videos} module{c._count.videos === 1 ? "" : "s"}</span>
                <Status tone={c.published ? "on" : "off"}>{c.published ? "Published" : "Hidden"}</Status>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={moveCourse} className="flex gap-1">
                  <input type="hidden" name="id" value={c.id} />
                  <button name="dir" value="up" aria-label={`Move ${c.title} up`} className="btn-sm min-w-11 px-0">↑</button>
                  <button name="dir" value="down" aria-label={`Move ${c.title} down`} className="btn-sm min-w-11 px-0">↓</button>
                </form>
                <form action={toggleCourse}><input type="hidden" name="id" value={c.id} /><button className="btn-sm">{c.published ? "Hide" : "Publish"}</button></form>
                <Link href="/admin/videos/new?hub=TEACHERS" className="btn-sm">Add module</Link>
                {c._count.videos === 0 && (
                  <form action={deleteCourse}><input type="hidden" name="id" value={c.id} /><ConfirmButton className="btn-danger" message={`Delete the course “${c.title}”?`}>Delete</ConfirmButton></form>
                )}
              </div>
            </div>
            <ActionForm action={saveCourse} className="flex flex-col gap-3 p-6">
              <input type="hidden" name="id" value={c.id} />
              <label htmlFor={`t-${c.id}`} className="sr-only">Course title</label>
              <input id={`t-${c.id}`} name="title" defaultValue={c.title} required className="field font-bold" />
              <label htmlFor={`d-${c.id}`} className="sr-only">Course description</label>
              <textarea id={`d-${c.id}`} name="description" defaultValue={c.description} rows={2} placeholder="Short description" className="field py-3" />
              <Submit className="btn-sm self-start">Save course</Submit>
            </ActionForm>
          </section>
        ))}
      </div>
      <section id="new-course" className="card max-w-[720px] scroll-mt-6 overflow-hidden">
        <div className="panel-head"><h2 className="text-lg font-extrabold text-deep">Create a course</h2></div>
        <ActionForm action={saveCourse} className="flex flex-col gap-3 p-6">
          <label htmlFor="new-title" className="label">Course title</label>
          <input id="new-title" name="title" required className="field" />
          <label htmlFor="new-desc" className="label">Short description</label>
          <textarea id="new-desc" name="description" rows={2} className="field py-3" />
          <Submit className="btn self-start">Create course</Submit>
        </ActionForm>
      </section>
    </>
  );
}
