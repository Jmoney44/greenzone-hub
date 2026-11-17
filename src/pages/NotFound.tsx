import Link from "@/components/Link";
import { Logo } from "@/components/Logo";
import { useAuth, homeFor } from "@/lib/auth";
import { useTitle } from "@/lib/load";

export function NotFound() {
  useTitle("Page not found");
  const { me } = useAuth();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f4f7f5] px-5 text-center">
      <Logo height={48} />
      <div className="card flex max-w-md flex-col items-center gap-3 p-8">
        <p className="text-[13px] font-bold tracking-widest text-brand uppercase">Page not found</p>
        <h1 className="text-2xl font-extrabold text-deep">We could not find that page</h1>
        <p className="text-soft">The link may be old, or the video may have been removed.</p>
        <Link href={me ? homeFor(me) : "/"} className="btn mt-2">{me ? "Go to my hub" : "Go to the home page"}</Link>
      </div>
    </div>
  );
}
