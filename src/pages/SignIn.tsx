import Link from "@/components/Link";
import { useLocation, useNavigate } from "react-router";
import { AuthShell } from "@/components/AuthShell";
import { ActionForm, Submit } from "@/components/Form";
import { homeFor, useAuth } from "@/lib/auth";
import { clean, plain, type FormState } from "@/lib/form";
import { useTitle } from "@/lib/load";
import { supabase } from "@/lib/supabase";

export default function SignInPage() {
  useTitle("Sign in");
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;

  const signIn = async (_: FormState, form: FormData): Promise<FormState> => {
    const email = clean(form.get("email")).toLowerCase();
    const password = String(form.get("password") ?? "");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (/email not confirmed/i.test(error.message)) return { error: "Please confirm your email first: open the link we sent you, then sign in." };
      if (/invalid login credentials/i.test(error.message)) return { error: "That email and password do not match. Please try again." };
      return { error: plain(error) };
    }
    // An account can be signed in on one device at a time.
    await supabase.auth.signOut({ scope: "others" }).catch(() => {});
    const me = await refresh();
    if (!me) return { error: "Your account could not be loaded. Please try again in a moment." };
    navigate(from && from !== "/signin" ? from : homeFor(me), { replace: true });
    return undefined;
  };

  return (
    <AuthShell
      title="Welcome back to the Learning Hub"
      text="Sign in to continue your videos. Your watched marks and your place in each video are saved to your account."
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-[28px] font-extrabold tracking-tight text-deep">Sign in</h2>
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
