import { supabase } from "./supabase";

export const TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

const random = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");

/** A one-time address in the private "videos" bucket that the browser can send a file to (admins only). */
export async function uploadTicket(original: string): Promise<{ file?: string; url?: string; type?: string; error?: string }> {
  const ext = (original.match(/\.[^.]+$/)?.[0] ?? "").toLowerCase();
  if (!TYPES[ext]) return { error: "Please upload an MP4, WebM or MOV file." };
  const file = `${random()}${ext}`;
  const { data, error } = await supabase.storage.from("videos").createSignedUploadUrl(file);
  if (error || !data) {
    return { error: /bucket not found/i.test(error?.message ?? "") ? "The “videos” storage bucket is missing. Run supabase/setup.sql in Supabase again." : "Could not start the upload. Please try again." };
  }
  return { file, url: data.signedUrl, type: TYPES[ext] };
}
