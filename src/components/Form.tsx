"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions/auth";

/** A form wired to a server action that shows its error or success message. */
export function ActionForm({
  action, children, className,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, run] = useActionState(action, undefined);
  return (
    <form action={run} className={className}>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{state.error}</p>
      )}
      {state?.ok && (
        <p role="status" className="rounded-xl bg-tint px-4 py-3 text-sm font-semibold text-deep">{state.ok}</p>
      )}
      {children}
    </form>
  );
}

export function Submit({ children, className = "btn w-full" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "Please wait…" : children}
    </button>
  );
}
