import Link from "next/link";
import { Empty, PageHeader, Status } from "@/components/AdminUI";
import { ConfirmButton } from "@/components/Confirm";
import { ActionForm, Submit } from "@/components/Form";
import { addTeacher, grantAccess, removePerson, revokeAccess, setPassword } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { day, initials } from "@/lib/format";

export default async function AdminPeople({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const role = sp.role === "TEACHER" || sp.role === "PARENT" ? sp.role : "";
  const now = new Date();
  const soon = new Date(Date.now() + 30 * 864e5);
  const [people, parentVideos, teacherVideos] = await Promise.all([
    db.user.findMany({
      where: {
        role: role || { not: "ADMIN" },
        ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { _count: { select: { progress: { where: { completed: true } } } } },
    }),
    db.video.count({ where: { hub: "PARENTS", published: true } }),
    db.video.count({ where: { hub: "TEACHERS", published: true } }),
  ]);
  const tab = (on: boolean) => `tab ${on ? "tab-on" : ""}`;
  return (
    <>
      <PageHeader title="Parents and teachers" note="See who has access, extend or remove a subscription, and reset passwords.">
        <a href="#add-teacher" className="btn">Add a teacher</a>
      </PageHeader>

      <section className="card overflow-hidden">
        <div className="panel-head">
          <div className="tabs">
            <Link href="/admin/people" className={tab(!role)}>Everyone</Link>
            <Link href="/admin/people?role=PARENT" className={tab(role === "PARENT")}>Parents</Link>
            <Link href="/admin/people?role=TEACHER" className={tab(role === "TEACHER")}>Teachers</Link>
          </div>
          <form className="flex min-w-0 gap-2">
            {role && <input type="hidden" name="role" value={role} />}
            <label htmlFor="q" className="sr-only">Search by name or email</label>
            <input id="q" name="q" type="search" defaultValue={q} placeholder="Search name or email" className="field min-h-11 w-64 min-w-0 text-sm" />
            <button className="btn-sm">Search</button>
          </form>
        </div>
        {people.length === 0 ? (
          <Empty title="Nobody matches">{q && <Link href={role ? `/admin/people?role=${role}` : "/admin/people"} className="btn-sm">Clear the search</Link>}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl min-w-[940px]">
              <thead>
                <tr><th>Person</th><th>Access</th><th>Expires</th><th>Progress</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {people.map((p) => {
                  const teacher = p.role === "TEACHER";
                  const activeSub = !!p.subscriptionEndsAt && p.subscriptionEndsAt > now;
                  const ending = activeSub && p.subscriptionEndsAt! < soon;
                  const total = teacher ? teacherVideos : parentVideos;
                  const done = Math.min(p._count.progress, total);
                  const [label, tone]: [string, "on" | "warn" | "off"] = teacher ? ["Teacher · free access", "on"]
                    : ending ? ["Parent · expiring soon", "warn"]
                    : activeSub ? ["Parent · active", "on"]
                    : p.subscriptionEndsAt ? ["Parent · expired", "off"]
                    : ["Parent · not subscribed", "off"];
                  return (
                    <tr key={p.id} className="align-top">
                      <td>
                        <div className="flex items-center gap-3">
                          <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tint text-xs font-extrabold text-deep">{initials(p.name)}</span>
                          <div className="min-w-0"><div className="font-bold text-ink">{p.name}</div><div className="text-[13px] text-muted">{p.email}</div></div>
                        </div>
                      </td>
                      <td><Status tone={tone}>{label}</Status></td>
                      <td className="whitespace-nowrap text-soft">{teacher ? "No expiry" : day(p.subscriptionEndsAt)}</td>
                      <td>
                        <div className="flex w-36 flex-col gap-1.5">
                          <span className="text-[13px] text-soft">{p._count.progress} of {total} watched</span>
                          <span aria-hidden className="h-1.5 rounded-full bg-line"><span className="block h-1.5 rounded-full bg-brand" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></span>
                        </div>
                      </td>
                      <td className="w-[264px]">
                        <details className="group">
                          <summary className="btn-sm w-fit list-none group-open:bg-mist [&::-webkit-details-marker]:hidden">Manage</summary>
                          <div className="mt-2 flex w-58 flex-col gap-2 rounded-xl border border-line bg-[#f7faf8] p-3">
                            {!teacher && (
                              <form action={grantAccess}><input type="hidden" name="id" value={p.id} /><button className="btn-sm w-full">{activeSub ? "Add another year" : "Grant 1 year of access"}</button></form>
                            )}
                            {!teacher && activeSub && (
                              <form action={revokeAccess}><input type="hidden" name="id" value={p.id} /><ConfirmButton className="btn-sm w-full" message={`Remove ${p.name}'s access?`}>Remove access</ConfirmButton></form>
                            )}
                            <form action={setPassword} className="flex gap-2">
                              <input type="hidden" name="id" value={p.id} />
                              <label htmlFor={`pw-${p.id}`} className="sr-only">New password for {p.name}</label>
                              <input id={`pw-${p.id}`} name="password" minLength={8} required placeholder="New password" className="field min-h-11 min-w-0 flex-1 px-3 text-sm" />
                              <button className="btn-sm">Set</button>
                            </form>
                            <form action={removePerson}><input type="hidden" name="id" value={p.id} /><ConfirmButton className="btn-danger w-full" message={`Delete ${p.name}'s account and progress for good?`}>Delete account</ConfirmButton></form>
                          </div>
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {people.length === 200 && <p className="border-t border-line px-6 py-3 text-sm text-muted">Showing the newest 200. Search to find anyone else.</p>}
      </section>

      <section id="add-teacher" className="card scroll-mt-6 overflow-hidden">
        <div className="panel-head">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-extrabold text-deep">Add a teacher (free access)</h2>
            <p className="text-sm text-soft">Create the account here, then give the teacher their email and starting password. They can change the password after signing in.</p>
          </div>
        </div>
        <ActionForm action={addTeacher} className="flex flex-col gap-4 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="t-name" className="label">Full name</label>
              <input id="t-name" name="name" required className="field" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="t-email" className="label">Email address</label>
              <input id="t-email" name="email" type="email" required className="field" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="t-pass" className="label">Starting password</label>
              <input id="t-pass" name="password" required minLength={8} className="field" />
            </div>
          </div>
          <Submit className="btn self-start">Add teacher</Submit>
        </ActionForm>
      </section>
    </>
  );
}
