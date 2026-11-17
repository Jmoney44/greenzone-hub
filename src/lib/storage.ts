/**
 * Uploaded video files live in a private Supabase Storage bucket.
 * The browser uploads straight to Supabase with a one-time upload link, and
 * viewers are handed a short-lived link only after the site has checked they may watch.
 */
export const TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

const BUCKET = process.env.SUPABASE_BUCKET ?? "videos";
const api = () => `${(process.env.SUPABASE_URL ?? "").replace(/\/+$/, "")}/storage/v1`;

export const storageReady = () => !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_KEY;

async function call<T>(method: string, path: string, body: unknown): Promise<T> {
  const key = process.env.SUPABASE_SERVICE_KEY ?? "";
  const res = await fetch(`${api()}${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase Storage ${method} ${path}: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

const clean = (name: string) => name.replace(/[^\w.-]/g, "");

/** A one-time address the browser can send the file to (valid for two hours). */
export async function uploadUrl(name: string) {
  const { url } = await call<{ url: string }>("POST", `/object/upload/sign/${BUCKET}/${clean(name)}`, {});
  return `${api()}${url}`;
}

/** A private address the video can be played from for the next few hours. */
export async function playbackUrl(name: string, seconds = 6 * 60 * 60) {
  const { signedURL } = await call<{ signedURL: string }>("POST", `/object/sign/${BUCKET}/${clean(name)}`, { expiresIn: seconds });
  return `${api()}${signedURL}`;
}

export async function removeFile(name: string) {
  if (!storageReady()) return;
  await call("DELETE", `/object/${BUCKET}`, { prefixes: [clean(name)] }).catch((e) => console.error(e));
}
