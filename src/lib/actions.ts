import { removeFile, videoSource } from "./api";
import { clean, plain, validEmail, type FormState } from "./form";
import { KEYS, type SettingKey } from "./settings";
import { must, supabase } from "./supabase";
import { youtubeId } from "./format";

const run = async (fn: () => Promise<unknown>): Promise<FormState> => {
  try {
    await fn();
    return undefined;
  } catch (e) {
    return { error: plain(e) };
  }
};

// ---------- Videos ----------

async function nextPosition(hub: string, courseId: string | null) {
  let q = supabase.from("videos").select("position").eq("hub", hub).order("position", { ascending: false }).limit(1);
  q = courseId ? q.eq("course_id", courseId) : q.is("course_id", null);
  const rows = must(await q) as { position: number }[];
  return (rows[0]?.position ?? 0) + 1;
}

/** Saves the add / edit video form. Returns the hub to go back to, or an error. */
export async function saveVideo(form: FormData): Promise<{ error?: string; hub?: string }> {
  try {
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
      if (!courseId) return { error: "Please choose the course this module belongs to." };
    } else {
      const newTopic = clean(form.get("newTopic"));
      if (newTopic) {
        const t = must(await supabase.from("topics").upsert({ name: newTopic }, { onConflict: "name" }).select("id").single()) as { id: string };
        topicId = t.id;
      } else {
        topicId = clean(form.get("topicId")) || null;
      }
    }
    const resourceUrl = clean(form.get("resourceUrl"));
    if (resourceUrl && !/^https:\/\//i.test(resourceUrl)) return { error: "The resource link must start with https://" };

    const data = {
      title, hub, source_type: sourceType, source, course_id: courseId, topic_id: topicId, resource_url: resourceUrl,
      description: clean(form.get("description")),
      resource_label: clean(form.get("resourceLabel")),
      published: form.get("published") === "on",
    };
    if (id) {
      const before = must(await supabase.from("videos").select("hub,course_id,source_type").eq("id", id).maybeSingle()) as
        | { hub: string; course_id: string | null; source_type: string }
        | null;
      if (!before) return { error: "This video no longer exists." };
      const beforeSource = (await videoSource(id)) ?? "";
      const moved = before.hub !== hub || before.course_id !== courseId;
      const replaced = before.source_type !== sourceType || beforeSource !== source;
      must(
        await supabase
          .from("videos")
          .update({ ...data, ...(moved ? { position: await nextPosition(hub, courseId) } : {}), ...(replaced ? { duration_seconds: 0 } : {}) })
          .eq("id", id),
      );
      if (replaced && before.source_type === "FILE") await removeFile(beforeSource);
    } else {
      must(await supabase.from("videos").insert({ ...data, position: await nextPosition(hub, courseId) }));
    }
    return { hub };
  } catch (e) {
    return { error: plain(e) };
  }
}

export const toggleVideo = (id: string, published: boolean) =>
  run(async () => must(await supabase.from("videos").update({ published: !published }).eq("id", id)));

export const deleteVideo = (id: string, sourceType: string) =>
  run(async () => {
    const source = sourceType === "FILE" ? await videoSource(id) : null;
    must(await supabase.from("videos").delete().eq("id", id));
    if (source) await removeFile(source);
  });

export const moveVideo = (id: string, dir: string) => run(async () => must(await supabase.rpc("move_video", { vid: id, dir })));

// ---------- Courses ----------

export async function saveCourse(_: FormState, form: FormData): Promise<FormState> {
  const id = clean(form.get("id"));
  const title = clean(form.get("title"));
  const description = clean(form.get("description"));
  if (!title) return { error: "Please give the course a title." };
  try {
    if (id) must(await supabase.from("courses").update({ title, description }).eq("id", id));
    else {
      const last = must(await supabase.from("courses").select("position").order("position", { ascending: false }).limit(1)) as { position: number }[];
      must(await supabase.from("courses").insert({ title, description, position: (last[0]?.position ?? 0) + 1 }));
    }
  } catch (e) {
    return { error: plain(e) };
  }
  return { ok: id ? "Course updated." : "Course created. Add its modules from the Videos page." };
}

export const toggleCourse = (id: string, published: boolean) =>
  run(async () => must(await supabase.from("courses").update({ published: !published }).eq("id", id)));

export const moveCourse = (id: string, dir: string) => run(async () => must(await supabase.rpc("move_course", { cid: id, dir })));

export const deleteCourse = (id: string) =>
  run(async () => {
    // Only an empty course can be removed, so modules are never lost by accident.
    const { count } = await supabase.from("videos").select("id", { count: "exact", head: true }).eq("course_id", id);
    if (!count) must(await supabase.from("courses").delete().eq("id", id));
  });

// ---------- People ----------

export async function addTeacher(_: FormState, form: FormData): Promise<FormState> {
  const name = clean(form.get("name"));
  const email = clean(form.get("email")).toLowerCase();
  if (name.length < 2) return { error: "Please enter the teacher's name." };
  if (!validEmail(email)) return { error: "Please enter a valid email address." };
  try {
    const result = must(await supabase.rpc("add_teacher", { teacher_name: name, teacher_email: email })) as string;
    if (result === "converted") return { ok: `${email} already had an account. It now opens the Teachers Hub.` };
    return { ok: `Done. Ask ${name} to create their account on the Sign up page with ${email}. It will open the Teachers Hub straight away.` };
  } catch (e) {
    return { error: plain(e) };
  }
}

export const removeInvite = (email: string) => run(async () => must(await supabase.from("role_invites").delete().eq("email", email)));
export const grantAccess = (id: string) => run(async () => must(await supabase.rpc("grant_year", { uid: id })));
export const revokeAccess = (id: string) => run(async () => must(await supabase.rpc("revoke_access", { uid: id })));
export const setPassword = (id: string, password: string) =>
  password.length < 8
    ? Promise.resolve<FormState>({ error: "The password needs at least 8 characters." })
    : run(async () => must(await supabase.rpc("set_user_password", { uid: id, new_password: password })));
export const removePerson = (id: string) => run(async () => must(await supabase.rpc("remove_person", { uid: id })));

// ---------- Settings ----------

export async function saveSettings(_: FormState, form: FormData): Promise<FormState> {
  const selarUrl = clean(form.get("selarUrl"));
  if (selarUrl && !/^https:\/\//i.test(selarUrl)) return { error: "The Selar link must start with https://" };
  try {
    const rows = (Object.entries(KEYS) as [SettingKey, string][]).map(([k, key]) => ({ key, value: clean(form.get(k)) }));
    must(await supabase.from("settings").upsert(rows, { onConflict: "key" }));
  } catch (e) {
    return { error: plain(e) };
  }
  return { ok: "Settings saved." };
}

// ---------- Your account ----------

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const name = clean(form.get("name"));
  if (name.length < 2) return { error: "Please enter your full name." };
  const r = await run(async () => must(await supabase.rpc("update_my_name", { new_name: name })));
  return r ?? { ok: "Your name has been updated." };
}

export async function changePassword(email: string, form: FormData): Promise<FormState> {
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 8) return { error: "Your new password needs at least 8 characters." };
  const check = await supabase.auth.signInWithPassword({ email, password: current });
  if (check.error) return { error: "Your current password is not correct." };
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: plain(error) };
  return { ok: "Your password has been changed." };
}
