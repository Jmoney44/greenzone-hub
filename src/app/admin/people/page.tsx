import Link from "next/link";
import { ConfirmButton } from "@/components/Confirm";
import { ActionForm, Submit } from "@/components/Form";
import { addTeacher, grantAccess, removePerson, revokeAccess, setPassword } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { day } from "@/lib/format";

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
  const tab = (on: boolean) =>
    `inline-flex min-h-11 items-center rounded-full border-[1.5px] px-4 text-sm font-bold ${on ? "border-deep bg-deep text-white" : "border-edge bg-white text-soft"}`;
  const th = "border-b border-line px-3 py-2.5";
  const td = "border-b border-[#eef4f0] px-3 py-3 align-top";
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight text-deep">Parents and teachers</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/people" className={tab(!role)}>Everyone</Link>
          <Link href="/admin/people?role=PARENT" className={tab(role === "PARENT")}>Parents</Link>
          <Link href="/admin/people?role=TEACHER" className={tab(role === "TEACHER")}>Teachers</Link>
        </div>
        <form className="flex gap-2">
          {role && <input type="hidden" name="role" value={role} />}
          <label htmlFor="q" className="sr-only">Search by name or email</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Name or email" className="field min-h-11 w-60" />
          <button className="btn-sm">Search</button>
        </form>
      </div>

      <section className="card p-6">
        {people.length === 0 ? <p className="text-soft">Nobody matches.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-[15px]">
              <thead>
                <tr className="text-left text-xs tracking-wider text-muted uppercase">
                  <th className={th}>Person</th><th className={th}>Access</th><th className={th}>Expires</th><th className={th}>Progress</th><th className={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {people.map((p) => {
                  const teacher = p.role === "TEACHER";
                  const activeSub = !!p.subscriptionEndsAt && p.subscriptionEndsAt > now;
                  const ending = activeSub && p.subscriptionEndsAt! < soon;
                  const total = teacher ? teacherVideos : parentVideos;
                  const [label, tone] = teacher ? ["Teacher · free access", "bg-tint text-deep"]
                    : ending ? ["Parent · expiring soon", "bg-[#fbf3b4] text-[#4a4200]"]
                    : activeSub ? ["Parent · active", "bg-tint text-deep"]
                    : p.subscriptionEndsAt ? ["Parent · expired", "bg-[#eef1ef] text-soft"]
                    : ["Parent · not subscribed", "bg-[#eef1ef] text-soft"];
                  return (
                    <tr key={p.id}>
                      <td className={td}><div className="font-bold">{p.name}</div><div className="text-[13px] text-muted">{p.email}</div></td>
                      <td className={td}><span className={`pill ${tone}`}>{label}</span></td>
                      <td className={`${td} text-soft`}>{teacher ? "No expiry" : day(p.subscriptionEndsAt)}</td>
                      <td className={`${td} text-soft`}>{p._count.progress} of {total} watched</td>
                      <td className={td}>
                        <details>
                          <summary className="btn-sm w-fit list-none">Manage</summary>
                          <div className="mt-2 flex flex-col gap-2">
                            {!teacher && (
                              <form action={grantAccess}><input type="hidden" name="id" value={p.id} /><button className="btn-sm">{activeSub ? "Add another year" : "Grant 1 year of access"}</button></form>
                            )}
                            {!teacher && activeSub && (
                              <form action={revokeAccess}><input type="hidden" name="id" value={p.id} /><ConfirmButton message={`Remove ${p.name}'s access?`}>Remove access</ConfirmButton></form>
                            )}
                            <form action={setPassword} className="flex gap-2">
                              <input type="hidden" name="id" value={p.id} />
                              <label htmlFor={`pw-${p.id}`} className="sr-only">New password for {p.name}</label>
                              <input id={`pw-${p.id}`} name="password" minLength={8} required placeholder="New password" className="field min-h-11 w-40 text-sm" />
                              <button className="btn-sm">Set</button>
                            </form>
                            <form action={removePerson}><input type="hidden" name="id" value={p.id} /><ConfirmButton message={`Delete ${p.name}'s account and progress for good?`}>Delete account</ConfirmButton></form>
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
      </section>

      <section className="card flex max-w-[640px] flex-col gap-4 p-6">
        <h2 className="text-xl font-extrabold text-deep">Add a teacher (free access)</h2>
        <p className="text-sm text-soft">Create the account here, then give the teacher their email and starting password. They can change the password after signing in.</p>
        <ActionForm action={addTeacher} className="flex flex-col gap-3">
          <label htmlFor="t-name" className="label">Full name</label>
          <input id="t-name" name="name" required className="field" />
          <label htmlFor="t-email" className="label">Email address</label>
          <input id="t-email" name="email" type="email" required className="field" />
          <label htmlFor="t-pass" className="label">Starting password</label>
          <input id="t-pass" name="password" required minLength={8} className="field" />
          <Submit className="btn self-start">Add teacher</Submit>
        </ActionForm>
      </section>
    </>
  );
}
