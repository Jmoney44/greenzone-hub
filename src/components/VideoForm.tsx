
import { useState } from "react";
import { useNavigate } from "react-router";
import { ActionForm, Submit } from "./Form";
import { saveVideo } from "@/lib/actions";
import { TYPES, uploadTicket } from "@/lib/upload";

type Option = { id: string; name: string };
type Video = {
  id: string; title: string; description: string; hub: string; topicId: string | null; courseId: string | null;
  sourceType: string; source: string; resourceUrl: string; resourceLabel: string; published: boolean;
};

export function VideoForm({ video, topics, courses, defaultHub }: { video?: Video; topics: Option[]; courses: Option[]; defaultHub: string }) {
  const navigate = useNavigate();
  const save = async (_: unknown, form: FormData) => {
    const r = await saveVideo(form);
    if (r.hub) navigate(`/admin/videos?hub=${r.hub}`);
    return r.error ? { error: r.error } : undefined;
  };
  const [hub, setHub] = useState(video?.hub ?? defaultHub);
  const [type, setType] = useState(video?.sourceType ?? "FILE");
  const [source, setSource] = useState(video?.source ?? "");
  const [upload, setUpload] = useState<{ percent: number; name: string; error?: string } | null>(null);

  const pick = (kind: string) => {
    setType(kind);
    setSource(kind === video?.sourceType ? video.source : "");
    setUpload(null);
  };

  const send = async (file: File) => {
    setSource("");
    setUpload({ percent: 0, name: file.name });
    const fail = (error: string) => setUpload({ percent: 0, name: file.name, error });
    // 1. Get a one-time upload address from video storage.
    let ticket: { file?: string; url?: string; type?: string; error?: string } = {};
    try {
      ticket = await uploadTicket(file.name);
    } catch {}
    if (!ticket.file || !ticket.url) return fail(ticket.error ?? "The upload could not start. Please try again.");
    // 2. Send the file straight to video storage.
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", ticket.url);
    xhr.setRequestHeader("content-type", ticket.type ?? file.type);
    xhr.setRequestHeader("cache-control", "max-age=3600");
    xhr.upload.onprogress = (e) => e.lengthComputable && setUpload({ percent: Math.min(99, Math.round((e.loaded / e.total) * 100)), name: file.name });
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) { setSource(ticket.file!); setUpload({ percent: 100, name: file.name }); }
      else if (xhr.status === 413 || /maximum allowed size|too large/i.test(xhr.responseText)) fail("This file is larger than your video storage allows. Make the file smaller, raise the limit in Supabase, or use a YouTube link instead.");
      else fail("The upload failed. Please try again.");
    };
    xhr.onerror = () => fail("The upload failed. Please check your connection and try again.");
    xhr.send(file);
  };

  const uploading = !!upload && !upload.error && upload.percent < 100;
  const tab = (on: boolean) => `tab ${on ? "tab-on" : ""}`;

  return (
    <ActionForm action={save} className="card flex max-w-[820px] flex-col gap-6 p-6 md:p-8">
      {video && <input type="hidden" name="id" value={video.id} />}
      <input type="hidden" name="hub" value={hub} />
      <input type="hidden" name="sourceType" value={type} />
      {type === "FILE" && <input type="hidden" name="source" value={source} />}

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="label">Title</label>
        <input id="title" name="title" defaultValue={video?.title} required className="field" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="label">Description</label>
        <textarea id="description" name="description" defaultValue={video?.description} rows={4} className="field py-3" />
      </div>

      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="label mb-2">Where does this video go?</legend>
        <div className="tabs self-start">
          <button type="button" onClick={() => setHub("PARENTS")} className={tab(hub === "PARENTS")}>Parents Hub</button>
          <button type="button" onClick={() => setHub("TEACHERS")} className={tab(hub === "TEACHERS")}>Teachers Hub</button>
        </div>
      </fieldset>

      {hub === "PARENTS" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="topicId" className="label">Topic</label>
            <select id="topicId" name="topicId" defaultValue={video?.topicId ?? ""} className="field">
              <option value="">No topic</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="newTopic" className="label">Or create a new topic</label>
            <input id="newTopic" name="newTopic" placeholder="New topic name" className="field" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label htmlFor="courseId" className="label">Course</label>
          <select id="courseId" name="courseId" defaultValue={video?.courseId ?? ""} required className="field">
            <option value="">Choose a course</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {courses.length === 0 && <p className="text-sm text-muted">Create a course first on the Teacher courses page.</p>}
        </div>
      )}

      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="label mb-2">The video</legend>
        <div className="tabs self-start">
          <button type="button" onClick={() => pick("FILE")} className={tab(type === "FILE")}>Upload a file</button>
          <button type="button" onClick={() => pick("YOUTUBE")} className={tab(type === "YOUTUBE")}>YouTube link</button>
          <button type="button" onClick={() => pick("URL")} className={tab(type === "URL")}>Video host link</button>
        </div>
        {type === "FILE" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="file" className="sr-only">Video file</label>
            <input id="file" type="file" accept={Object.values(TYPES).join(",") + "," + Object.keys(TYPES).join(",")}
              onChange={(e) => e.target.files?.[0] && send(e.target.files[0])}
              className="field py-3 file:mr-4 file:rounded-full file:border-0 file:bg-tint file:px-4 file:py-1.5 file:font-bold file:text-deep" />
            {upload && !upload.error && (
              <div role="status" className="flex flex-col gap-1.5">
                <div className="h-2 rounded-full bg-line"><div className="h-2 rounded-full bg-brand" style={{ width: `${upload.percent}%` }} /></div>
                <span className="text-sm text-soft">{upload.percent < 100 ? `Uploading ${upload.name}… ${upload.percent}%` : `${upload.name} uploaded.`}</span>
              </div>
            )}
            {upload?.error && <p role="alert" className="text-sm font-semibold text-red-800">{upload.error}</p>}
            {!upload && source && <p className="text-sm text-soft">A file is already uploaded. Choose a new one only to replace it.</p>}
            <p className="text-[13px] text-muted">MP4 works on every phone and computer.</p>
          </div>
        )}
        {type === "YOUTUBE" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="yt" className="sr-only">YouTube link</label>
            <input id="yt" name="source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" className="field" />
            <p className="text-[13px] text-muted">Set the video to Unlisted on YouTube so only hub members find it.</p>
          </div>
        )}
        {type === "URL" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="url" className="sr-only">Video link</label>
            <input id="url" name="source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="https://…/video.mp4" className="field" />
            <p className="text-[13px] text-muted">A direct link to the MP4 file from your video host.</p>
          </div>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="resourceUrl" className="label">Resource link (optional)</label>
          <input id="resourceUrl" name="resourceUrl" defaultValue={video?.resourceUrl} placeholder="https://… notes or worksheet" className="field" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="resourceLabel" className="label">Resource name</label>
          <input id="resourceLabel" name="resourceLabel" defaultValue={video?.resourceLabel} placeholder="e.g. Lesson notes (PDF)" className="field" />
        </div>
      </div>

      <label className="flex items-center gap-3 text-[15px] font-semibold">
        <input type="checkbox" name="published" defaultChecked={video?.published ?? true} className="size-5 accent-brand" />
        Published (visible in the hub)
      </label>

      <div className="flex border-t border-line pt-6">
        {uploading ? (
          <button type="button" disabled className="btn">Wait for the upload to finish…</button>
        ) : (
          <Submit className="btn">{video ? "Save changes" : "Add video"}</Submit>
        )}
      </div>
    </ActionForm>
  );
}
