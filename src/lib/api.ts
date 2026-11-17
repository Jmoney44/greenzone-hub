import { must, supabase } from "./supabase";
import type { Course, Payment, Progress, User, Video } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;
const date = (v: unknown) => (v ? new Date(String(v)) : null);

export const VIDEO_COLS =
  "id,title,description,hub,topic_id,course_id,position,source_type,thumb_id,duration_seconds,resource_url,resource_label,published,created_at";
export const COURSE_COLS = "id,title,description,position,published,created_at";
export const VIDEO_WITH = `${VIDEO_COLS},topic:topics(id,name),course:courses(${COURSE_COLS})`;

export const toUser = (r: Row): User => ({
  id: r.id, name: r.name, email: r.email, role: r.role,
  subscriptionEndsAt: date(r.subscription_ends_at), createdAt: date(r.created_at) ?? new Date(),
});
export const toCourse = (r: Row): Course => ({
  id: r.id, title: r.title, description: r.description ?? "", position: r.position ?? 0, published: !!r.published, createdAt: date(r.created_at) ?? new Date(),
});
export const toVideo = (r: Row): Video => ({
  id: r.id, title: r.title, description: r.description ?? "", hub: r.hub, topicId: r.topic_id, courseId: r.course_id,
  position: r.position ?? 0, sourceType: r.source_type, source: r.thumb_id ?? "", durationSeconds: r.duration_seconds ?? 0,
  resourceUrl: r.resource_url ?? "", resourceLabel: r.resource_label ?? "", published: !!r.published, createdAt: date(r.created_at) ?? new Date(),
  topic: r.topic ? { id: r.topic.id, name: r.topic.name } : null,
  course: r.course ? toCourse(r.course) : null,
});
export const toProgress = (r: Row): Progress => ({
  userId: r.user_id, videoId: r.video_id, positionSeconds: r.position_seconds ?? 0, completed: !!r.completed,
  completedAt: date(r.completed_at), updatedAt: date(r.updated_at) ?? new Date(),
});
export const toPayment = (r: Row): Payment => ({
  id: r.id, reference: r.reference, email: r.email, userId: r.user_id, amount: r.amount ?? "", source: r.source,
  createdAt: date(r.created_at) ?? new Date(), user: r.user ? { name: r.user.name } : null,
});

export async function count(table: string, filter?: (q: any) => any) {
  let q = supabase.from(table).select(table === "progress" ? "user_id" : "id", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count: n, error } = await q;
  if (error) throw new Error(error.message);
  return n ?? 0;
}

export async function myProgress(userId: string) {
  return must(await supabase.from("progress").select("*").eq("user_id", userId)).map(toProgress);
}

/** The real file name, link or YouTube id, only if the signed-in person may watch the video. */
export async function videoSource(videoId: string) {
  return must(await supabase.rpc("video_source", { vid: videoId })) as string | null;
}

/** Turns a stored video file name into an address the player can stream from (valid for six hours). */
export async function fileUrl(name: string) {
  const { data, error } = await supabase.storage.from("videos").createSignedUrl(name, 6 * 60 * 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function removeFile(name: string) {
  if (name) await supabase.storage.from("videos").remove([name]);
}
