import Link from "@/components/Link";
import { AuthShell } from "@/components/AuthShell";
import { ActionForm, Submit } from "@/components/Form";
import { Back, Check, Lock } from "@/components/icons";
import { clean, validEmail, type FormState } from "@/lib/form";
import { useLoad, useTitle } from "@/lib/load";
import { getSettings } from "@/lib/settings";
import { supabase } from "@/lib/supabase";

async function requestReset(_: FormState, form: FormData): Promise<FormState> {
  const email = clean(form.get("email")).toLowerCase();
  if (!validEmail(email)) return { error: "Please enter a valid email address." };
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset` });
  // Same answer either way, so nobody can test which emails have accounts.
  return { ok: "If that email has an account, a reset link is on its way." };
}

const tips = ["The link works for one hour.", "No email after a few minutes? Check your spam or junk folder.", "Asking again cancels any earlier link."];

export default function ForgotPage() {
  useTitle("Forgot password");
  const supportEmail = useLoad(getSettings, []).data?.supportEmail;
  return (
    <AuthShell title="Forgot your password?" text="It happens. Enter the email you registered with and we will send you a link to choose a new one.">
      <div className="flex flex-col gap-4">
        <span aria-hidden className="flex size-12 items-center justify-center rounded-2xl bg-tint text-brand"><Lock size={24} /></span>
        <div className="flex flex-col gap-2">
          <h2 className="text-[28px] font-extrabold tracking-tight text-deep">Reset your password</h2>
          <p className="text-[15px] leading-relaxed text-soft">Enter the email you registered with and we will send you a link to choose a new password.</p>
        </div>
      </div>
      <ActionForm action={requestReset} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="label">Email address</label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="field" />
        </div>
        <Submit>Send reset link</Submit>
      </ActionForm>
      <ul className="flex flex-col gap-2.5 rounded-xl border border-line bg-[#f7faf8] px-4 py-4 text-[13px] leading-snug text-soft">
        {tips.map((t) => (
          <li key={t} className="flex items-start gap-2.5"><Check size={15} className="mt-0.5 shrink-0 text-brand" />{t}</li>
        ))}
      </ul>
      <div className="flex flex-col items-center gap-1 border-t border-line pt-4 text-center text-sm">
        <Link href="/signin" className="inline-flex min-h-11 items-center gap-2 font-bold text-brand hover:text-deep"><Back /> Back to sign in</Link>
        {supportEmail && (
          <p className="text-[13px] text-muted">Still stuck? Write to <a href={`mailto:${supportEmail}`} className="font-bold wrap-anywhere text-brand">{supportEmail}</a></p>
        )}
      </div>
    </AuthShell>
  );
}
