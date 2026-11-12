import { SiteHeader } from "@/components/SiteHeader";
import { ActionForm, Submit } from "@/components/Form";
import { changePassword, updateProfile } from "@/app/actions/auth";
import { db } from "@/lib/db";
import { isSubscribed, requireUser } from "@/lib/auth";
import { day, initials } from "@/lib/format";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const me = await requireUser();
  const payments = await db.payment.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" } });
  const role = me.role === "TEACHER" ? "Teacher" : me.role === "ADMIN" ? "Administrator" : "Parent";
  const active = me.role !== "PARENT" || isSubscribed(me);
  return (
    <div className="hub">
      <SiteHeader user={me} active="account" />
      <main className="page max-w-[1000px] gap-6">
        <h1 className="text-[28px] font-extrabold tracking-tight text-deep">Your account</h1>
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-5">
            <section className="card flex flex-col items-center gap-3 p-7 text-center">
              <span aria-hidden className="flex size-20 items-center justify-center rounded-full bg-deep text-2xl font-extrabold text-white">{initials(me.name)}</span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-lg font-extrabold text-deep">{me.name}</span>
                <span className="text-sm break-all text-muted">{me.email}</span>
              </div>
              <span className="pill bg-tint text-deep">{role}</span>
            </section>
            <section className="card overflow-hidden">
              <div className="panel-head">
                <h2 className="text-lg font-extrabold text-deep">Access</h2>
                <span className={`pill gap-1.5 ${active ? "bg-tint text-deep" : "bg-[#eef1ef] text-soft"}`}>
                  <span aria-hidden className={`size-1.5 rounded-full ${active ? "bg-brand" : "bg-[#8a9a90]"}`} />{active ? "Active" : "Not active"}
                </span>
              </div>
              <div className="flex flex-col gap-3 p-6 text-[15px] leading-relaxed text-soft">
                {me.role === "PARENT" ? (
                  isSubscribed(me) ? (
                    <p>Parents Hub subscription active until <strong className="text-deep">{day(me.subscriptionEndsAt)}</strong>.</p>
                  ) : (
                    <>
                      <p>You do not have an active subscription.</p>
                      <a href="/subscribe" className="btn self-start">Subscribe now</a>
                    </>
                  )
                ) : (
                  <p>{me.role === "TEACHER" ? "Teachers Hub · free access provided by Greenzone." : "Administrator · full access."}</p>
                )}
              </div>
              {payments.length > 0 && (
                <ul className="flex flex-col divide-y divide-[#eef4f0] border-t border-line px-6 text-sm">
                  {payments.map((p) => (
                    <li key={p.id} className="flex flex-col gap-0.5 py-3">
                      <span className="flex justify-between gap-3 font-bold text-ink"><span>Payment received</span><span>{p.amount}</span></span>
                      <span className="text-[13px] break-all text-muted">{day(p.createdAt)} · ref {p.reference}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <section className="card overflow-hidden">
              <div className="panel-head"><h2 className="text-lg font-extrabold text-deep">Your details</h2></div>
              <ActionForm action={updateProfile} className="flex flex-col gap-4 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="label">Full name</label>
                    <input id="name" name="name" defaultValue={me.name} required className="field" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="label">Email address</label>
                    <input id="email" value={me.email} readOnly className="field bg-mist text-muted" />
                  </div>
                </div>
                <Submit className="btn self-start">Save name</Submit>
              </ActionForm>
            </section>

            <section className="card overflow-hidden">
              <div className="panel-head"><h2 className="text-lg font-extrabold text-deep">Change password</h2></div>
              <ActionForm action={changePassword} className="flex flex-col gap-4 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="current" className="label">Current password</label>
                    <input id="current" name="current" type="password" required autoComplete="current-password" className="field" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="next" className="label">New password</label>
                    <input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" className="field" />
                    <p className="text-[13px] text-muted">At least 8 characters.</p>
                  </div>
                </div>
                <Submit className="btn self-start">Change password</Submit>
              </ActionForm>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
