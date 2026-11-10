import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { ActionForm, Submit } from "@/components/Form";
import { signIn } from "@/app/actions/auth";
import { currentUser, homeFor } from "@/lib/auth";

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
  const me = await currentUser();
  if (me) redirect(homeFor(me));
  return (
    <AuthShell
      title="Welcome back to the Learning Hub"
      text="Sign in to continue your videos. Your watched marks and your place in each video are saved to your account."
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold text-deep">Sign in</h2>
        <p className="text-[15px] text-muted">
          New parent? <Link href="/signup" className="font-bold text-brand">Create an account</Link>
        </p>
      </div>
      <ActionForm action={signIn} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="label">Email address</label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="field" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="password" className="label">Password</label>
            <Link href="/forgot" className="text-sm font-semibold text-brand">Forgot password?</Link>
          </div>
          <input id="password" name="password" type="password" required autoComplete="current-password" placeholder="Your password" className="field" />
        </div>
        <Submit>Sign in</Submit>
      </ActionForm>
      <p className="text-center text-[13px] leading-relaxed text-muted">
        For your security, an account can be signed in on one device at a time.
      </p>
    </AuthShell>
  );
}
