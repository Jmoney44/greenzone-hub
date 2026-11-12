import Link from "next/link";
import { Logo } from "./Logo";
import { SignOut } from "./icons";
import { signOut } from "@/app/actions/auth";
import { homeFor, type Me } from "@/lib/auth";
import { initials } from "@/lib/format";

/** Top bar for signed-in pages. Each person only sees the links for their own hub. */
export function SiteHeader({ user, active }: { user: Me; active?: "hub" | "teachers" | "account" | "admin" }) {
  const admin = user.role === "ADMIN";
  const links: [string, string, boolean][] = admin
    ? [["/admin", "Admin panel", active === "admin"], ["/library", "Parents Hub", active === "hub"], ["/teachers", "Teachers Hub", active === "teachers"]]
    : [[homeFor(user), user.role === "TEACHER" ? "Teachers Hub" : "Parents Hub", active === "hub" || active === "teachers"]];
  links.push(["/account", "Account", active === "account"]);
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-6 px-5 md:px-8">
        <div className="flex h-16 items-center"><Logo href={homeFor(user)} height={40} /></div>
        <nav aria-label="Main" className="order-3 -mx-5 flex w-screen gap-1 overflow-x-auto border-t border-line px-3 md:order-none md:mx-0 md:mr-auto md:w-auto md:border-0 md:px-0">
          {links.map(([href, label, on]) => (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              className={`inline-flex h-12 shrink-0 items-center border-b-[3px] px-3 text-[15px] font-bold whitespace-nowrap md:h-16 ${on ? "border-brand text-deep" : "border-transparent text-soft hover:text-deep"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/account" className="flex items-center gap-2.5" aria-label="Your account">
            <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-deep text-sm font-extrabold text-white">{initials(user.name)}</span>
            <span className="hidden max-w-40 truncate text-sm font-bold text-ink sm:block">{user.name}</span>
          </Link>
          <form action={signOut}>
            <button className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-[1.5px] border-edge px-3 text-sm font-bold text-deep hover:bg-mist">
              <SignOut /> <span className="hidden sm:inline">Sign out</span><span className="sr-only sm:hidden">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
