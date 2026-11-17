import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { canWatch } from "@/lib/access";
import { playbackUrl, storageReady } from "@/lib/storage";

/** Sends people who are allowed to watch a video to a private, short-lived address for the file. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await currentUser();
  if (!me) return new Response("Sign in to watch", { status: 401 });
  const video = await db.video.findUnique({ where: { id } });
  if (!video || video.sourceType !== "FILE" || !(await canWatch(me, video))) return new Response("Not available", { status: 403 });
  if (!storageReady()) return new Response("Video storage is not connected", { status: 503 });
  try {
    return new Response(null, { status: 302, headers: { Location: await playbackUrl(video.source), "Cache-Control": "private, no-store" } });
  } catch (e) {
    console.error(e);
    return new Response("File missing", { status: 404 });
  }
}
