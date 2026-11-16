import path from "path";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { storageReady, TYPES, uploadUrl } from "@/lib/storage";

/** Gives the admin panel a one-time address to send a video file to. The file goes straight to Supabase Storage. */
export async function POST(req: Request) {
  const me = await currentUser();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const original = decodeURIComponent(req.headers.get("x-filename") ?? "");
  const ext = path.extname(original).toLowerCase();
  if (!TYPES[ext]) return NextResponse.json({ error: "Please upload an MP4, WebM or MOV file." }, { status: 400 });
  if (!storageReady()) {
    return NextResponse.json({ error: "Video storage is not connected yet. Add SUPABASE_URL and SUPABASE_SERVICE_KEY to the site settings." }, { status: 503 });
  }
  const file = `${randomBytes(12).toString("hex")}${ext}`;
  try {
    return NextResponse.json({ file, url: await uploadUrl(file), type: TYPES[ext] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not reach video storage. Check that the \u201cvideos\u201d bucket exists in Supabase." }, { status: 502 });
  }
}
