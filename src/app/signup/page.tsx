import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { ActionForm, Submit } from "@/components/Form";
import { signUp } from "@/app/actions/auth";
import { currentUser, homeFor } from "@/lib/auth";

export const metadata = { title: "Create account" };

export default async function SignUpPage() {
  const me = await currentUser();
  if (me) redirect(homeFor(me));
  return (
    <AuthShell
      title="Join the Parents Hub"
      text="Create your account first. On the next step you subscribe for the year and the whole library opens."
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-[28px] font-extrabold tracking-tight text-deep">Create your account</h2>
        <p className="text-[15px] text-muted">
          Already registered? <Link href="/signin" className="font-bold text-brand">Sign in</Link>
        </p>
      </div>
      <ActionForm action={signUp} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="label">Full name</label>
          <input id="name" name="name" required autoComplete="name" placeholder="Your name" className="field" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="label">Email address</label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="field" />
          <p className="text-[13px] text-muted">Use the same email when you pay on Selar, so we can match your payment.</p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="label">Password</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" className="field" />
        </div>
        <Submit>Create account</Submit>
      </ActionForm>
      <p className="text-center text-[13px] leading-relaxed text-muted">
        Teachers do not sign up here. Greenzone creates teacher accounts and sends you your sign-in details.
      </p>
    </AuthShell>
  );
}
