import { createClient, type Session } from "@supabase/supabase-js";

declare global {
  interface Window {
    GREENZONE_CONFIG?: { supabaseUrl?: string; supabaseAnonKey?: string };
  }
}

// Settings come from /config.js on the server (editable without a rebuild), or from VITE_ variables when building.
// A value still holding the example text from config.js counts as not filled in.
const filled = (v: unknown) => (typeof v === "string" && v.trim() && !/YOUR-PROJECT|YOUR-PUBLIC/.test(v) ? v.trim() : "");
const cfg = window.GREENZONE_CONFIG ?? {};
export const SUPABASE_URL = (filled(cfg.supabaseUrl) || filled(import.meta.env.VITE_SUPABASE_URL)).replace(/\/+$/, "");
const KEY = filled(cfg.supabaseAnonKey) || filled(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isConfigured = /^https?:\/\//.test(SUPABASE_URL) && !!KEY;

export const supabase = createClient(isConfigured ? SUPABASE_URL : "http://localhost", isConfigured ? KEY : "missing", {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true, flowType: "implicit" },
});

// The latest session, kept so progress can still be saved while the page is closing.
let current: Session | null = null;
supabase.auth.onAuthStateChange((_event, session) => {
  current = session;
});

/** Saves the viewer's place in a video. Uses a plain request so it also works while the page is closing. */
export function saveProgress(videoId: string, position: number, duration: number, completed: boolean, keepalive = false) {
  const token = current?.access_token;
  if (!token) return Promise.resolve(null);
  return fetch(`${SUPABASE_URL}/rest/v1/rpc/save_progress`, {
    method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ vid: videoId, pos: Math.floor(position), dur: Math.floor(duration), done: completed }),
    keepalive,
  })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
}

/** Throws the Supabase error, if any, and returns the data. */
export function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}
