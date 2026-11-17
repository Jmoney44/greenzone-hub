import Link from "@/components/Link";
import { AuthShell } from "@/components/AuthShell";
import { ActionForm, Submit } from "@/components/Form";
import { Lock } from "@/components/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { homeFor, useAuth } from "@/lib/auth";
import { plain, type FormState } from "@/lib/form";
import { useTitle } from "@/lib/load";
import { supabase } from "@/lib/supabase";
import { Loading } from "@/components/Loading";

export default function ResetPage() {
  useTitle("Choose a new password");
  const { refresh } = useAuth();
  const navigate = useNavigate();
  // The emailed link signs the person in for a moment so they can choose a new password.
  const [status, setStatus] = useState<"checking" | "ready" | "expired">("checking");
  useEffect(() => {
    const failed = /error_code=|error=/.test(window.location.hash + window.location.search);
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) setStatus("ready");
    });
    const t = setTimeout(async () => {
      const { data: s } = await supabase.auth.getSession();
      setStatus(s.session && !failed ? "ready" : "expired");
    }, 1500);
    return () => {
      clearTimeout(t);
      data.subscription.unsubscribe();
    };
  }, []);

  const resetPassword = async (_: FormState, form: FormData): Promise<FormState> => {
    const password = String(form.get("password") ?? "");
    if (password.length < 8) return { error: "Your password needs at least 8 characters." };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: /session|jwt|expired/i.test(error.message) ? "This reset link has expired. Please request a new one." : plain(error) };
    const me = await refresh();
    navigate(me ? homeFor(me) : "/", { replace: true });
    return undefined;
  };

  if (status === "checking") return <Loading full label="Checking your link…" />;
  if (status === "expired") {
    return (
      <AuthShell title="Choose a new password" text="Pick something you will remember. You will be signed in straight away.">
        <span aria-hidden className="flex size-12 items-center justify-center rounded-2xl bg-tint text-brand"><Lock size={24} /></span>
        <h2 className="text-[28px] font-extrabold tracking-tight text-deep">This link has expired</h2>
        <p className="leading-relaxed text-soft">Reset links work for one hour and only once. Ask for a new one and use the newest email.</p>
        <Link href="/forgot" className="btn">Send a new link</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" text="Pick something you will remember. You will be signed in straight away.">
      <div className="flex flex-col gap-4">
        <span aria-hidden className="flex size-12 items-center justify-center rounded-2xl bg-tint text-brand"><Lock size={24} /></span>
        <div className="flex flex-col gap-2">
          <h2 className="text-[28px] font-extrabold tracking-tight text-deep">New password</h2>
          <p className="text-[15px] leading-relaxed text-soft">Choose a new password for your account. You will be signed in as soon as you save it.</p>
        </div>
      </div>
      <ActionForm action={resetPassword} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="label">New password</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" className="field" />
          <p className="text-[13px] text-muted">Use at least 8 characters. A short phrase is easier to remember than a single word.</p>
        </div>
        <Submit>Save and sign in</Submit>
      </ActionForm>
      <p className="border-t border-line pt-4 text-center text-[13px] leading-relaxed text-muted">
        Reset links work for one hour. If yours has expired, <Link href="/forgot" className="font-bold text-brand">ask for a new one</Link>.
      </p>
    </AuthShell>
  );
}
