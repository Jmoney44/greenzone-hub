import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { canWatch } from "@/lib/access";

/** Saves where the viewer is in a video, and marks it completed when the player reports the end. */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const videoId = String(body?.videoId ?? "");
  const position = Math.max(0, Math.floor(Number(body?.position) || 0));
  const duration = Math.max(0, Math.floor(Number(body?.duration) || 0));
  const completed = body?.completed === true;

  const video = await db.video.findUnique({ where: { id: videoId } });
  if (!video || !(await canWatch(me, video))) return NextResponse.json({ error: "no-access" }, { status: 403 });

  // The first real playback tells us how long the video is.
  if (duration > 0 && video.durationSeconds !== duration) {
    await db.video.update({ where: { id: video.id }, data: { durationSeconds: duration } });
  }
  const key = { userId_videoId: { userId: me.id, videoId } };
  const existing = await db.progress.findUnique({ where: key });
  await db.progress.upsert({
    where: key,
    create: { userId: me.id, videoId, positionSeconds: position, completed, completedAt: completed ? new Date() : null },
    update: {
      positionSeconds: position,
      // Once watched, a video stays watched.
      ...(completed && !existing?.completed ? { completed: true, completedAt: new Date() } : {}),
    },
  });
  return NextResponse.json({ ok: true, completed: completed || !!existing?.completed });
}
