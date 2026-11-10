import { SiteHeader } from "@/components/SiteHeader";
import { ActionForm, Submit } from "@/components/Form";
import { changePassword, updateProfile } from "@/app/actions/auth";
import { db } from "@/lib/db";
import { isSubscribed, requireUser } from "@/lib/auth";
import { day } from "@/lib/format";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const me = await requireUser();
  const payments = await db.payment.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" } });
  return (
    <div className="min-h-screen bg-mist">
      <SiteHeader user={me} active="account" />
      <main className="mx-auto flex max-w-[760px] flex-col gap-6 px-[5%] py-11">
        <h1 className="text-[34px] font-extrabold tracking-tight text-deep">Your account</h1>

        <section className="card flex flex-col gap-2 p-7">
          <h2 className="text-xl font-extrabold text-deep">Access</h2>
          {me.role === "PARENT" ? (
            isSubscribed(me) ? (
              <p className="text-soft">Parents Hub subscription active until <strong className="text-deep">{day(me.subscriptionEndsAt)}</strong>.</p>
            ) : (
              <p className="text-soft">You do not have an active subscription. <a href="/subscribe" className="font-bold text-brand">Subscribe now</a></p>
            )
          ) : (
            <p className="text-soft">{me.role === "TEACHER" ? "Teachers Hub · free access provided by Greenzone." : "Administrator · full access."}</p>
          )}
          {payments.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 text-sm text-soft">
              {payments.map((p) => (
                <li key={p.id}>Payment received {day(p.createdAt)}{p.amount ? ` · ${p.amount}` : ""} · ref {p.reference}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-7">
          <h2 className="mb-4 text-xl font-extrabold text-deep">Your details</h2>
          <ActionForm action={updateProfile} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="label">Full name</label>
              <input id="name" name="name" defaultValue={me.name} required className="field" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="label">Email address</label>
              <input id="email" value={me.email} readOnly className="field bg-mist text-muted" />
            </div>
            <Submit className="btn self-start">Save name</Submit>
          </ActionForm>
        </section>

        <section className="card p-7">
          <h2 className="mb-4 text-xl font-extrabold text-deep">Change password</h2>
          <ActionForm action={changePassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="current" className="label">Current password</label>
              <input id="current" name="current" type="password" required autoComplete="current-password" className="field" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="next" className="label">New password</label>
              <input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" className="field" />
            </div>
            <Submit className="btn self-start">Change password</Submit>
          </ActionForm>
        </section>
      </main>
    </div>
  );
}
