import Link from "@/components/Link";
import { Empty, PageHeader, Status } from "@/components/AdminUI";
import { ConfirmButton } from "@/components/Confirm";
import { ActionForm, Submit } from "@/components/Form";
import { useSearchParams } from "react-router";
import { Loading, LoadError } from "@/components/Loading";
import { addTeacher, grantAccess, removeInvite, removePerson, revokeAccess, setPassword } from "@/lib/actions";
import { count as countRows, toUser } from "@/lib/api";
import type { FormState } from "@/lib/form";
import { useLoad, useTitle } from "@/lib/load";
import { must, supabase } from "@/lib/supabase";
import { day, initials } from "@/lib/format";

type Invite = { email: string; name: string; created_at: string };

async function loadPeople(q: string, role: string) {
  const [rows, parentVideos, teacherVideos, invites] = await Promise.all([
    supabase.rpc("admin_people", { search: q, only_role: role }).then(must) as Promise<Record<string, unknown>[]>,
    countRows("videos", (x) => x.eq("hub", "PARENTS").eq("published", true)),
    countRows("videos", (x) => x.eq("hub", "TEACHERS").eq("published", true)),
    supabase.from("role_invites").select("email,name,created_at").eq("role", "TEACHER").order("created_at", { ascending: false }).then(must) as Promise<Invite[]>,
  ]);
  const people = rows.map((r) => ({ ...toUser(r), _count: { progress: Number(r.done ?? 0) } }));
  return { people, parentVideos, teacherVideos, invites };
}

export default function AdminPeople() {
  useTitle("Parents and teachers");
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const r = params.get("role");
  const role = r === "TEACHER" || r === "PARENT" ? r : "";
  const now = new Date();
  const soon = new Date(Date.now() + 30 * 864e5);
  const load = useLoad(() => loadPeople(q, role), [q, role]);
  if (load.error) return <LoadError message={load.error} retry={load.reload} />;
  if (!load.data) return <Loading />;
  const { people, parentVideos, teacherVideos, invites } = load.data;
  const after = (fn: () => Promise<FormState>) => async () => {
    const res = await fn();
    if (res?.error) window.alert(res.error);
    load.reload();
  };
  const add = async (s: FormState, f: FormData) => {
    const res = await addTeacher(s, f);
    if (res?.ok) load.reload();
    return res;
  };
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
                              <form action={after(() => grantAccess(p.id))}><button className="btn-sm w-full">{activeSub ? "Add another year" : "Grant 1 year of access"}</button></form>
                            )}
                            {!teacher && activeSub && (
                              <form action={after(() => revokeAccess(p.id))}><ConfirmButton className="btn-sm w-full" message={`Remove ${p.name}'s access?`}>Remove access</ConfirmButton></form>
                            )}
                            <form action={async (f) => { const res = await setPassword(p.id, String(f.get("password") ?? "")); window.alert(res?.error ?? `New password set for ${p.name}. They have been signed out everywhere.`); }} className="flex gap-2">
                              <label htmlFor={`pw-${p.id}`} className="sr-only">New password for {p.name}</label>
                              <input id={`pw-${p.id}`} name="password" minLength={8} required placeholder="New password" className="field min-h-11 min-w-0 flex-1 px-3 text-sm" />
                              <button className="btn-sm">Set</button>
                            </form>
                            <form action={after(() => removePerson(p.id))}><ConfirmButton className="btn-danger w-full" message={`Delete ${p.name}'s account and progress for good?`}>Delete account</ConfirmButton></form>
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
            <p className="text-sm text-soft">Add the teacher&apos;s name and email, then ask them to create their account on the Sign up page with that email. It opens the Teachers Hub straight away, free. If the email already has an account, it is switched to a teacher account now.</p>
          </div>
        </div>
        <ActionForm action={add} className="flex flex-col gap-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="t-name" className="label">Full name</label>
              <input id="t-name" name="name" required className="field" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="t-email" className="label">Email address</label>
              <input id="t-email" name="email" type="email" required className="field" />
            </div>
          </div>
          <Submit className="btn self-start">Add teacher</Submit>
        </ActionForm>
        {invites.length > 0 && (
          <div className="border-t border-line">
            <h3 className="px-6 pt-5 text-[13px] font-bold tracking-wider text-muted uppercase">Waiting to sign up</h3>
            <ul className="flex flex-col divide-y divide-[#eef4f0] px-6 pb-2">
              {invites.map((i) => (
                <li key={i.email} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-bold text-ink">{i.name || i.email}</span>
                    <span className="text-[13px] wrap-anywhere text-muted">{i.email}</span>
                  </span>
                  <form action={after(() => removeInvite(i.email))}>
                    <ConfirmButton className="btn-sm" message={`Cancel the teacher invite for ${i.email}?`}>Cancel</ConfirmButton>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}
