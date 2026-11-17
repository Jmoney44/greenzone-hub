import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ActionForm, Submit } from "@/components/Form";
import { Lock } from "@/components/icons";
import { resetPassword } from "@/app/actions/auth";

export const metadata = { title: "Choose a new password" };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
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
        <input type="hidden" name="token" value={token} />
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
