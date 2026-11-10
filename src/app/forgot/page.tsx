import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ActionForm, Submit } from "@/components/Form";
import { requestReset } from "@/app/actions/auth";

export const metadata = { title: "Forgot password" };

export default function ForgotPage() {
  return (
    <AuthShell title="Forgot your password?" text="Enter the email you registered with and we will send you a link to choose a new one.">
      <h2 className="text-3xl font-extrabold text-deep">Reset password</h2>
      <ActionForm action={requestReset} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="label">Email address</label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="field" />
        </div>
        <Submit>Send reset link</Submit>
      </ActionForm>
      <Link href="/signin" className="text-center text-sm font-bold text-brand">Back to sign in</Link>
    </AuthShell>
  );
}
