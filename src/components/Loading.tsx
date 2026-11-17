export function Loading({ full = false, label = "Loading…" }: { full?: boolean; label?: string }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-3 text-sm font-semibold text-soft ${full ? "min-h-screen bg-[#f4f7f5]" : "py-20"}`}>
      <span aria-hidden className="size-6 animate-spin rounded-full border-[3px] border-tint border-t-brand" />
      {label}
    </div>
  );
}

export function LoadError({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div role="alert" className="card mx-auto flex max-w-xl flex-col items-center gap-3 p-8 text-center">
      <p className="text-lg font-extrabold text-deep">Something went wrong</p>
      <p className="text-sm break-words text-soft">{message}</p>
      {retry && <button onClick={retry} className="btn-sm">Try again</button>}
    </div>
  );
}
