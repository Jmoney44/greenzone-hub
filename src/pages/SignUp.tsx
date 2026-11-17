import Link from "@/components/Link";
import { useState } from "react";
import { useNavigate } from "react-router";
import { AuthShell } from "@/components/AuthShell";
import { ActionForm, Submit } from "@/components/Form";
import { Check } from "@/components/icons";
import { homeFor, useAuth } from "@/lib/auth";
import { clean, plain, validEmail, type FormState } from "@/lib/form";
import { useTitle } from "@/lib/load";
import { supabase } from "@/lib/supabase";

export default function SignUpPage() {
  useTitle("Create account");
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [confirmTo, setConfirmTo] = useState("");

  const signUp = async (_: FormState, form: FormData): Promise<FormState> => {
    const name = clean(form.get("name"));
    const email = clean(form.get("email")).toLowerCase();
    const password = String(form.get("password") ?? "");
    if (name.length < 2) return { error: "Please enter your full name." };
    if (!validEmail(email)) return { error: "Please enter a valid email address." };
    if (password.length < 8) return { error: "Your password needs at least 8 characters." };
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { name }, emailRedirectTo: `${window.location.origin}/signin` },
    });
    if (error) {
      if (/already registered|already exists/i.test(error.message)) return { error: "An account with this email already exists. Sign in instead." };
      return { error: plain(error) };
    }
    if (!data.session) {
      setConfirmTo(email); // Supabase is set to confirm emails first
      return undefined;
    }
    const me = await refresh();
    navigate(me ? homeFor(me) : "/subscribe", { replace: true });
    return undefined;
  };

  if (confirmTo) {
    return (
      <AuthShell title="Join the Parents Hub" text="Create your account first. On the next step you subscribe for the year and the whole library opens.">
        <span aria-hidden className="flex size-12 items-center justify-center rounded-2xl bg-tint text-brand"><Check size={24} /></span>
        <h2 className="text-[28px] font-extrabold tracking-tight text-deep">Check your email</h2>
        <p className="leading-relaxed text-soft">We sent a link to <strong className="text-deep">{confirmTo}</strong>. Open it to confirm your account, then sign in.</p>
        <Link href="/signin" className="btn">Go to sign in</Link>
      </AuthShell>
    );
  }

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
        Teachers: sign up here with the email you gave Greenzone, and your account opens the Teachers Hub.
      </p>
    </AuthShell>
  );
}
