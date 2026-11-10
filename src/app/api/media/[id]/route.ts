import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { canWatch } from "@/lib/access";
import { STORAGE, TYPES } from "@/lib/storage";

/** Streams an uploaded video file, only to people allowed to watch it. Supports seeking. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await currentUser();
  if (!me) return new Response("Sign in to watch", { status: 401 });
  const video = await db.video.findUnique({ where: { id } });
  if (!video || video.sourceType !== "FILE" || !(await canWatch(me, video))) return new Response("Not available", { status: 403 });

  const file = path.join(STORAGE, path.basename(video.source));
  const info = await stat(file).catch(() => null);
  if (!info) return new Response("File missing", { status: 404 });

  const size = info.size;
  const headers: Record<string, string> = {
    "Content-Type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "Content-Disposition": "inline",
  };
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    let start = range[1] ? parseInt(range[1], 10) : size - parseInt(range[2], 10);
    let end = range[1] && range[2] ? parseInt(range[2], 10) : size - 1;
    start = Math.max(0, start);
    end = Math.min(end, size - 1);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "Content-Length": String(size) } });
}
