import Link from "next/link";
import { Logo } from "./Logo";
import { signOut } from "@/app/actions/auth";
import { homeFor, type Me } from "@/lib/auth";
import { initials } from "@/lib/format";

/** Top bar for signed-in pages. Each person only sees the links for their own hub. */
export function SiteHeader({ user, active }: { user: Me; active?: "hub" | "account" | "admin" }) {
  const hubLabel = user.role === "TEACHER" ? "Teachers Hub" : user.role === "ADMIN" ? "Admin panel" : "Parents Hub";
  const link = (on: boolean) =>
    `inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-bold ${on ? "bg-tint text-deep" : "text-soft hover:bg-mist"}`;
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-white px-[5%] py-3">
      <Logo href={homeFor(user)} />
      <nav className="flex flex-wrap items-center gap-2">
        <Link href={homeFor(user)} className={link(active === "hub" || active === "admin")}>{hubLabel}</Link>
        {user.role === "ADMIN" && (
          <>
            <Link href="/library" className={link(false)}>View Parents Hub</Link>
            <Link href="/teachers" className={link(false)}>View Teachers Hub</Link>
          </>
        )}
        <Link href="/account" className={link(active === "account")}>Account</Link>
        <form action={signOut}>
          <button className="inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 text-[15px] font-bold text-soft hover:bg-mist">
            Sign out
          </button>
        </form>
        <span aria-hidden className="inline-flex size-11 items-center justify-center rounded-full bg-deep text-[15px] font-bold text-white">
          {initials(user.name)}
        </span>
      </nav>
    </header>
  );
}
