import Link from "@/components/Link";
import { AdminNav } from "@/components/AdminNav";
import { Logo } from "@/components/Logo";
import { SignOut } from "@/components/icons";
import { Outlet, useNavigate } from "react-router";
import { useAuth, useMe } from "@/lib/auth";
import { initials } from "@/lib/format";

export default function AdminLayout() {
  const me = useMe();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const leave = async () => {
    await signOut();
    navigate("/");
  };
  return (
    <div className="min-h-screen bg-[#f4f7f5] md:flex">
      <aside className="flex flex-col gap-4 bg-deep px-4 py-4 text-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:gap-8 md:overflow-y-auto md:py-6">
        <div className="flex items-center justify-between gap-3">
          <Logo href="/admin" chip height={36} />
          <span className="rounded-full border border-white/25 px-2.5 py-1 text-[11px] font-bold tracking-widest text-pale uppercase">Admin</span>
        </div>
        <AdminNav />
        <div className="flex items-center gap-3 border-t border-white/15 pt-4 md:mt-auto">
          <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sun text-sm font-extrabold text-deep">{initials(me.name)}</span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-bold">{me.name}</span>
            <Link href="/account" className="text-[13px] text-pale underline-offset-2 hover:underline">Account settings</Link>
          </div>
          <form action={leave}>
            <button aria-label="Sign out" title="Sign out" className="flex size-11 cursor-pointer items-center justify-center rounded-lg text-pale hover:bg-white/10 hover:text-white">
              <SignOut size={18} />
            </button>
          </form>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-6 px-5 py-7 md:px-10 md:py-9 [&_.card]:shadow-[0_1px_2px_rgba(11,61,32,0.06)]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6"><Outlet /></div>
      </main>
    </div>
  );
}
