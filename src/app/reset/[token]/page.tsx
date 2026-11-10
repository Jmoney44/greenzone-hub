import { AuthShell } from "@/components/AuthShell";
import { ActionForm, Submit } from "@/components/Form";
import { resetPassword } from "@/app/actions/auth";

export const metadata = { title: "Choose a new password" };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthShell title="Choose a new password" text="Pick something you will remember. You will be signed in straight away.">
      <h2 className="text-3xl font-extrabold text-deep">New password</h2>
      <ActionForm action={resetPassword} className="flex flex-col gap-5">
        <input type="hidden" name="token" value={token} />
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="label">New password</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" className="field" />
        </div>
        <Submit>Save and sign in</Submit>
      </ActionForm>
    </AuthShell>
  );
}
