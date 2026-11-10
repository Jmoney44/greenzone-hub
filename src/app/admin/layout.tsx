import Link from "next/link";
import { Logo } from "@/components/Logo";
import { signOut } from "@/app/actions/auth";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Admin" };

const links = [
  ["/admin", "Overview"],
  ["/admin/videos", "Videos"],
  ["/admin/courses", "Teacher courses"],
  ["/admin/people", "Parents and teachers"],
  ["/admin/payments", "Payments"],
  ["/admin/settings", "Settings"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();
  return (
    <div className="flex min-h-screen flex-wrap bg-mist">
      <aside className="flex flex-[1_1_230px] flex-col gap-7 bg-deep px-5 py-6 text-white md:max-w-[260px]">
        <div><Logo href="/admin" chip height={40} /></div>
        <nav className="flex flex-col gap-1.5 text-[15px] font-bold">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="flex min-h-11 items-center rounded-xl px-4 text-[#e4f0e8] hover:bg-leaf">{label}</Link>
          ))}
          <Link href="/library" className="mt-4 flex min-h-11 items-center rounded-xl px-4 text-pale hover:bg-leaf">View Parents Hub</Link>
          <Link href="/teachers" className="flex min-h-11 items-center rounded-xl px-4 text-pale hover:bg-leaf">View Teachers Hub</Link>
        </nav>
        <div className="mt-auto flex flex-col gap-2 text-[13px] text-pale">
          <span>Signed in as {me.name}</span>
          <Link href="/account" className="font-bold text-white underline">Account</Link>
          <form action={signOut}><button className="cursor-pointer font-bold text-white underline">Sign out</button></form>
        </div>
      </aside>
      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-7 px-[4%] py-9">{children}</main>
    </div>
  );
}
