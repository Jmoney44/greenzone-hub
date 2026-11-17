export type FormState = { error?: string; ok?: string } | undefined;

export const clean = (v: FormDataEntryValue | null) => String(v ?? "").trim();
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** Turns an error from Supabase into a sentence for the person using the site. */
export function plain(e: unknown) {
  const m = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
  if (/failed to fetch|networkerror|load failed/i.test(m)) return "Could not reach the server. Please check your connection and try again.";
  return m;
}
