import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { ActionForm, Submit } from "@/components/Form";
import { Arrow, Card, Check, Clock, Film, Lock, SignOut } from "@/components/icons";
import { changePassword, signOut, updateProfile } from "@/app/actions/auth";
import { db } from "@/lib/db";
import { homeFor, isSubscribed, requireUser } from "@/lib/auth";
import { day, initials } from "@/lib/format";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const me = await requireUser();
  const parent = me.role === "PARENT";
  const hub = me.role === "TEACHER" ? "TEACHERS" : "PARENTS";
  const [payments, watched, total] = await Promise.all([
    db.payment.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" } }),
    db.progress.count({ where: { userId: me.id, completed: true, video: { hub, published: true } } }),
    db.video.count({ where: { hub, published: true } }),
  ]);
  const role = me.role === "TEACHER" ? "Teacher" : me.role === "ADMIN" ? "Administrator" : "Parent";
  const active = !parent || isSubscribed(me);
  const daysLeft = parent && isSubscribed(me) ? Math.max(0, Math.ceil((me.subscriptionEndsAt!.getTime() - Date.now()) / 864e5)) : 0;
  const ending = parent && active && daysLeft <= 30;
  const tile = "card flex items-center gap-4 p-5";
  const icon = "flex size-11 shrink-0 items-center justify-center rounded-xl";
  const label = "text-[13px] font-bold text-muted";
  const value = "text-xl leading-7 font-extrabold text-deep";
  return (
    <div className="hub">
      <SiteHeader user={me} active="account" />
      <main className="page max-w-[1040px] gap-5">
        <section className="hero flex flex-wrap items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-5">
            <span aria-hidden className="flex size-18 shrink-0 items-center justify-center rounded-full bg-sun text-2xl font-extrabold text-deep md:size-20">{initials(me.name)}</span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-[13px] font-bold tracking-widest text-sun uppercase">Your account</span>
              <h1 className="text-[clamp(24px,3vw,32px)] leading-tight font-extrabold tracking-tight">{me.name}</h1>
              <span className="text-[15px] wrap-anywhere text-pale">{me.email}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={homeFor(me)} className="btn min-h-11 bg-white px-5 text-sm text-deep hover:bg-tint">
              {me.role === "ADMIN" ? "Admin panel" : parent && !active ? "Subscribe" : "Go to my hub"} <Arrow size={16} />
            </Link>
            <form action={signOut}>
              <button className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-white/40 px-5 text-sm font-bold hover:bg-white/10"><SignOut /> Sign out</button>
            </form>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className={tile}>
            <span className={`${icon} ${active ? (ending ? "bg-[#fbf3b4] text-[#4a4200]" : "bg-tint text-brand") : "bg-[#eef1ef] text-soft"}`}>{active ? <Check size={22} /> : <Lock size={20} />}</span>
            <span className="flex min-w-0 flex-col"><span className={label}>Access</span><span className={value}>{active ? (ending ? "Ending soon" : "Active") : "Not active"}</span></span>
          </div>
          <div className={tile}>
            <span className={`${icon} bg-tint text-brand`}><Film size={22} /></span>
            <span className="flex min-w-0 flex-col"><span className={label}>{me.role === "TEACHER" ? "Modules completed" : "Videos watched"}</span><span className={`${value} tabular-nums`}>{watched} of {total}</span></span>
          </div>
          <div className={tile}>
            <span className={`${icon} bg-tint text-brand`}><Clock size={22} /></span>
            <span className="flex min-w-0 flex-col"><span className={label}>Member since</span><span className={value}>{day(me.createdAt)}</span></span>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="flex min-w-0 flex-col gap-5">
            <section className="card overflow-hidden">
              <div className="panel-head">
                <h2 className="text-lg font-extrabold text-deep">{parent ? "Subscription" : "Access"}</h2>
                <span className="pill bg-tint text-deep">{role}</span>
              </div>
              <div className="flex flex-col gap-4 p-6 text-[15px] leading-relaxed text-soft">
                {parent ? (
                  isSubscribed(me) ? (
                    <>
                      <p>Your Parents Hub subscription is active until <strong className="text-deep">{day(me.subscriptionEndsAt)}</strong>.</p>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between gap-3 text-sm font-bold"><span className="text-ink">Time left</span><span className={ending ? "text-[#6b5f00]" : "text-brand"}>{daysLeft} day{daysLeft === 1 ? "" : "s"}</span></div>
                        <span role="img" aria-label={`${daysLeft} days left`} className="h-2 rounded-full bg-line"><span className={`block h-2 rounded-full ${ending ? "bg-[#d9c400]" : "bg-brand"}`} style={{ width: `${Math.min(100, Math.max(3, (daysLeft / 365) * 100))}%` }} /></span>
                      </div>
                      <p className="text-[13px] text-muted">When it ends you can renew for another 12 months from this page.</p>
                    </>
                  ) : (
                    <>
                      <p>{me.subscriptionEndsAt ? <>Your subscription ended on <strong className="text-deep">{day(me.subscriptionEndsAt)}</strong>.</> : "You do not have an active subscription."} Subscribe to open every video in the Parents Hub for 12 months.</p>
                      <Link href="/subscribe" className="btn self-start">{me.subscriptionEndsAt ? "Renew now" : "Subscribe now"} <Arrow /></Link>
                    </>
                  )
                ) : (
                  <p>{me.role === "TEACHER" ? "Teachers Hub · free access provided by Greenzone. There is nothing to pay or renew." : "Administrator · full access to both hubs and the admin panel."}</p>
                )}
              </div>
            </section>

            {parent && (
              <section className="card overflow-hidden">
                <div className="panel-head">
                  <h2 className="text-lg font-extrabold text-deep">Payment history</h2>
                  <span className="text-[13px] font-bold text-muted">{payments.length} payment{payments.length === 1 ? "" : "s"}</span>
                </div>
                {payments.length === 0 ? (
                  <p className="px-6 py-8 text-[15px] text-soft">No payments yet. They appear here once Selar confirms them.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-[#eef4f0] px-6">
                    {payments.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 py-3.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-tint text-brand"><Card /></span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-[15px] font-bold text-ink">{p.source === "manual" ? "Access granted by Greenzone" : "Payment received"}</span>
                          <span className="text-[13px] wrap-anywhere text-muted">{day(p.createdAt)} · ref {p.reference}</span>
                        </span>
                        {p.amount && <span className="shrink-0 text-[15px] font-extrabold text-deep tabular-nums">{p.amount}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <section className="card overflow-hidden">
              <div className="panel-head"><h2 className="text-lg font-extrabold text-deep">Your details</h2></div>
              <ActionForm action={updateProfile} className="flex flex-col gap-4 p-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="label">Full name</label>
                  <input id="name" name="name" defaultValue={me.name} required autoComplete="name" className="field" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="label">Email address</label>
                  <input id="email" value={me.email} readOnly className="field bg-mist text-muted" />
                  <p className="text-[13px] text-muted">Your email is your sign-in{parent ? " and how payments are matched to you" : ""}, so it cannot be changed here.</p>
                </div>
                <Submit className="btn self-start">Save name</Submit>
              </ActionForm>
            </section>

            <section className="card overflow-hidden">
              <div className="panel-head">
                <h2 className="text-lg font-extrabold text-deep">Password and security</h2>
                <span className="flex size-9 items-center justify-center rounded-lg bg-tint text-brand"><Lock /></span>
              </div>
              <ActionForm action={changePassword} className="flex flex-col gap-4 p-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="current" className="label">Current password</label>
                  <input id="current" name="current" type="password" required autoComplete="current-password" className="field" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="next" className="label">New password</label>
                  <input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" className="field" />
                  <p className="text-[13px] text-muted">At least 8 characters.</p>
                </div>
                <Submit className="btn self-start">Change password</Submit>
              </ActionForm>
              <p className="border-t border-line bg-[#f7faf8] px-6 py-4 text-[13px] leading-relaxed text-soft">
                For your security, an account can be signed in on one device at a time. Signing in somewhere else signs this device out.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
