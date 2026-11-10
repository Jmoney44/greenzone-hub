"use client";

/** A submit button that asks before doing something that cannot be undone. */
export function ConfirmButton({ message, children, className = "btn-sm" }: { message: string; children: React.ReactNode; className?: string }) {
  return (
    <button type="submit" className={className} onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
