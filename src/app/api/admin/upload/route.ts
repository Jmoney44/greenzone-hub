import { createWriteStream } from "fs";
import { mkdir, unlink } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { STORAGE, TYPES } from "@/lib/storage";

/** Receives one video file from the admin panel and stores it on the server. */
export async function POST(req: Request) {
  const me = await currentUser();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const original = decodeURIComponent(req.headers.get("x-filename") ?? "");
  const ext = path.extname(original).toLowerCase();
  if (!TYPES[ext]) return NextResponse.json({ error: "Please upload an MP4, WebM or MOV file." }, { status: 400 });
  if (!req.body) return NextResponse.json({ error: "No file received." }, { status: 400 });

  await mkdir(STORAGE, { recursive: true });
  const name = `${randomBytes(12).toString("hex")}${ext}`;
  const target = path.join(STORAGE, name);
  try {
    await pipeline(Readable.fromWeb(req.body as import("stream/web").ReadableStream), createWriteStream(target));
  } catch {
    await unlink(target).catch(() => {});
    return NextResponse.json({ error: "The upload was interrupted. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ file: name });
}
