"use server";

import { unlink } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { grantYear } from "@/lib/access";
import { youtubeId } from "@/lib/format";
import { DEFAULTS } from "@/lib/settings";
import { STORAGE } from "@/lib/storage";
import type { FormState } from "./auth";

const clean = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const removeFile = (name: string) => unlink(path.join(STORAGE, path.basename(name))).catch(() => {});

// ---------- Videos ----------

export async function saveVideo(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = clean(form.get("id"));
  const title = clean(form.get("title"));
  const hub = clean(form.get("hub")) === "TEACHERS" ? "TEACHERS" : "PARENTS";
  const sourceType = clean(form.get("sourceType"));
  let source = clean(form.get("source"));
  if (!title) return { error: "Please give the video a title." };
  if (!["FILE", "URL", "YOUTUBE"].includes(sourceType)) return { error: "Please choose where the video comes from." };
  if (!source) return { error: sourceType === "FILE" ? "Please upload the video file first." : "Please paste the video link." };
  if (sourceType === "YOUTUBE") {
    const yt = youtubeId(source);
    if (!yt) return { error: "That does not look like a YouTube link." };
    source = yt;
  }
  if (sourceType === "URL" && !/^https:\/\//i.test(source)) return { error: "The video link must start with https://" };

  let courseId: string | null = null;
  let topicId: string | null = null;
  if (hub === "TEACHERS") {
    courseId = clean(form.get("courseId")) || null;
    if (!courseId) return { error: "Please choose which course this module belongs to." };
  } else {
    const newTopic = clean(form.get("newTopic"));
    if (newTopic) {
      topicId = (await db.topic.upsert({ where: { name: newTopic }, create: { name: newTopic }, update: {} })).id;
    } else {
      topicId = clean(form.get("topicId")) || null;
    }
  }
  const resourceUrl = clean(form.get("resourceUrl"));
  if (resourceUrl && !/^https:\/\//i.test(resourceUrl)) return { error: "The resource link must start with https://" };

  const data = {
    title, hub, sourceType, source, courseId, topicId, resourceUrl,
    description: clean(form.get("description")),
    resourceLabel: clean(form.get("resourceLabel")),
    published: form.get("published") === "on",
  };
  if (id) {
    const before = await db.video.findUnique({ where: { id } });
    if (!before) return { error: "This video no longer exists." };
    const moved = before.hub !== hub || before.courseId !== courseId;
    const replaced = before.sourceType !== sourceType || before.source !== source;
    await db.video.update({
      where: { id },
      data: { ...data, ...(moved ? { position: await nextPosition(hub, courseId) } : {}), ...(replaced ? { durationSeconds: 0 } : {}) },
    });
    if (replaced && before.sourceType === "FILE") await removeFile(before.source);
  } else {
    await db.video.create({ data: { ...data, position: await nextPosition(hub, courseId) } });
  }
  revalidatePath("/admin/videos");
  redirect(`/admin/videos?hub=${hub}`);
}

async function nextPosition(hub: string, courseId: string | null) {
  const last = await db.video.aggregate({ where: { hub, courseId }, _max: { position: true } });
  return (last._max.position ?? 0) + 1;
}

export async function toggleVideo(form: FormData) {
  await requireAdmin();
  const v = await db.video.findUnique({ where: { id: clean(form.get("id")) } });
  if (v) await db.video.update({ where: { id: v.id }, data: { published: !v.published } });
  revalidatePath("/admin/videos");
}

export async function deleteVideo(form: FormData) {
  await requireAdmin();
  const v = await db.video.findUnique({ where: { id: clean(form.get("id")) } });
  if (v) {
    await db.video.delete({ where: { id: v.id } });
    if (v.sourceType === "FILE") await removeFile(v.source);
  }
  revalidatePath("/admin/videos");
}

/** Moves a video one place up or down among the videos it sits with. */
export async function moveVideo(form: FormData) {
  await requireAdmin();
  const v = await db.video.findUnique({ where: { id: clean(form.get("id")) } });
  if (!v) return;
  const group = await db.video.findMany({
    where: { hub: v.hub, courseId: v.courseId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  await reorder(group.map((g) => g.id), v.id, clean(form.get("dir")), (id, position) =>
    db.video.update({ where: { id }, data: { position } }),
  );
  revalidatePath("/admin/videos");
}

async function reorder(ids: string[], id: string, dir: string, set: (id: string, position: number) => Promise<unknown>) {
  const i = ids.indexOf(id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((x, n) => set(x, n + 1)));
}

// ---------- Courses ----------

export async function saveCourse(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = clean(form.get("id"));
  const title = clean(form.get("title"));
  const description = clean(form.get("description"));
  if (!title) return { error: "Please give the course a title." };
  if (id) await db.course.update({ where: { id }, data: { title, description } });
  else {
    const last = await db.course.aggregate({ _max: { position: true } });
    await db.course.create({ data: { title, description, position: (last._max.position ?? 0) + 1 } });
  }
  revalidatePath("/admin/courses");
  return { ok: id ? "Course updated." : "Course created. Add its modules from the Videos page." };
}

export async function toggleCourse(form: FormData) {
  await requireAdmin();
  const c = await db.course.findUnique({ where: { id: clean(form.get("id")) } });
  if (c) await db.course.update({ where: { id: c.id }, data: { published: !c.published } });
  revalidatePath("/admin/courses");
}

export async function moveCourse(form: FormData) {
  await requireAdmin();
  const all = await db.course.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }], select: { id: true } });
  await reorder(all.map((c) => c.id), clean(form.get("id")), clean(form.get("dir")), (id, position) =>
    db.course.update({ where: { id }, data: { position } }),
  );
  revalidatePath("/admin/courses");
}

export async function deleteCourse(form: FormData) {
  await requireAdmin();
  const id = clean(form.get("id"));
  // Only an empty course can be removed, so modules are never lost by accident.
  if ((await db.video.count({ where: { courseId: id } })) === 0) await db.course.deleteMany({ where: { id } });
  revalidatePath("/admin/courses");
}

// ---------- People ----------

export async function addTeacher(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const name = clean(form.get("name"));
  const email = clean(form.get("email")).toLowerCase();
  const password = String(form.get("password") ?? "");
  if (name.length < 2) return { error: "Please enter the teacher's name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };
  if (password.length < 8) return { error: "The starting password needs at least 8 characters." };
  if (await db.user.findUnique({ where: { email } })) return { error: "Someone with this email already has an account." };
  await db.user.create({ data: { name, email, role: "TEACHER", passwordHash: await hashPassword(password) } });
  revalidatePath("/admin/people");
  return { ok: `${name} can now sign in to the Teachers Hub with ${email} and the password you set.` };
}

export async function grantAccess(form: FormData) {
  await requireAdmin();
  const u = await db.user.findUnique({ where: { id: clean(form.get("id")) } });
  if (u?.role === "PARENT") {
    await grantYear(u.id);
    await db.payment.create({ data: { reference: `manual-${Date.now()}`, email: u.email, userId: u.id, source: "manual" } });
  }
  revalidatePath("/admin/people");
}

export async function revokeAccess(form: FormData) {
  await requireAdmin();
  await db.user.updateMany({ where: { id: clean(form.get("id")), role: "PARENT" }, data: { subscriptionEndsAt: null } });
  revalidatePath("/admin/people");
}

export async function setPassword(form: FormData) {
  await requireAdmin();
  const password = String(form.get("password") ?? "");
  const id = clean(form.get("id"));
  if (password.length < 8) return;
  await db.user.update({ where: { id }, data: { passwordHash: await hashPassword(password) } });
  await db.session.deleteMany({ where: { userId: id } });
  revalidatePath("/admin/people");
}

export async function removePerson(form: FormData) {
  const me = await requireAdmin();
  const id = clean(form.get("id"));
  if (id !== me.id) await db.user.deleteMany({ where: { id, role: { not: "ADMIN" } } });
  revalidatePath("/admin/people");
}

// ---------- Settings ----------

export async function saveSettings(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const selarUrl = clean(form.get("selarUrl"));
  if (selarUrl && !/^https:\/\//i.test(selarUrl)) return { error: "The Selar link must start with https://" };
  for (const key of Object.keys(DEFAULTS)) {
    const value = clean(form.get(key));
    await db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
  revalidatePath("/", "layout");
  return { ok: "Settings saved." };
}
