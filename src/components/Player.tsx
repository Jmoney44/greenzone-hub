"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Arrow, Check } from "./icons";

type Props = {
  videoId: string;
  kind: "native" | "youtube";
  src: string; // file/stream address, or the YouTube video id
  startAt: number;
  alreadyCompleted: boolean;
  nextHref: string | null;
};

type YTPlayer = { getCurrentTime(): number; getDuration(): number; seekTo(s: number, a: boolean): void; playVideo(): void; destroy(): void };
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, o: unknown) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Share of the video that must really be played before it counts as watched. */
const REQUIRED = 0.8;

export function Player({ videoId, kind, src, startAt, alreadyCompleted, nextHref }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytHost = useRef<HTMLDivElement>(null);
  const yt = useRef<YTPlayer | null>(null);
  const playing = useRef(false);
  const watched = useRef(0);
  const [state, setState] = useState<"watching" | "done" | "skipped">("watching");

  const now = useCallback(() => {
    if (kind === "native") return { t: videoRef.current?.currentTime ?? 0, d: videoRef.current?.duration || 0 };
    return { t: yt.current?.getCurrentTime?.() ?? 0, d: yt.current?.getDuration?.() ?? 0 };
  }, [kind]);

  const save = useCallback(
    (completed = false) => {
      const { t, d } = now();
      return fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, position: completed ? 0 : t, duration: d, completed }),
        keepalive: true,
      }).catch(() => {});
    },
    [now, videoId],
  );

  const ended = useCallback(async () => {
    playing.current = false;
    const { d } = now();
    if (alreadyCompleted || d === 0 || watched.current >= d * REQUIRED) {
      await save(true);
      setState("done");
      router.refresh();
    } else {
      setState("skipped");
    }
  }, [alreadyCompleted, now, router, save]);

  // Count seconds actually played, and save the position every 10 seconds.
  useEffect(() => {
    let ticks = 0;
    const timer = setInterval(() => {
      if (!playing.current) return;
      watched.current += 1;
      if (++ticks % 10 === 0) save();
    }, 1000);
    const leave = () => { if (playing.current) save(); };
    window.addEventListener("pagehide", leave);
    return () => { clearInterval(timer); window.removeEventListener("pagehide", leave); };
  }, [save]);

  // YouTube player
  useEffect(() => {
    if (kind !== "youtube") return;
    let cancelled = false;
    const build = () => {
      if (cancelled || !ytHost.current || !window.YT) return;
      yt.current = new window.YT.Player(ytHost.current, {
        videoId: src,
        playerVars: { start: Math.floor(startAt), rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onStateChange: (e: { data: number }) => {
            playing.current = e.data === 1;
            if (e.data === 2) save();
            if (e.data === 0) ended();
          },
        },
      });
    };
    if (window.YT?.Player) build();
    else {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { previous?.(); build(); };
      if (!document.querySelector("script[data-yt]")) {
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        s.dataset.yt = "1";
        document.head.appendChild(s);
      }
    }
    return () => { cancelled = true; yt.current?.destroy?.(); yt.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, src]);

  const again = () => {
    watched.current = 0;
    setState("watching");
    if (kind === "native" && videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play(); }
    else { yt.current?.seekTo(0, true); yt.current?.playVideo(); }
  };

  return (
    <div className="relative aspect-video overflow-hidden rounded-[20px] bg-deep">
      {kind === "native" ? (
        <video
          ref={videoRef}
          src={src}
          controls
          playsInline
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          onLoadedMetadata={(e) => { if (startAt > 0 && startAt < e.currentTarget.duration - 5) e.currentTarget.currentTime = startAt; }}
          onPlay={() => { playing.current = true; }}
          onPause={() => { playing.current = false; if (!videoRef.current?.ended) save(); }}
          onEnded={ended}
          className="size-full bg-black"
        />
      ) : (
        <div className="size-full [&>iframe]:size-full"><div ref={ytHost} /></div>
      )}

      {state !== "watching" && (
        <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-deep/95 p-6 text-center text-white">
          {state === "done" ? (
            <>
              <span className="flex size-20 items-center justify-center rounded-full bg-sun text-deep"><Check size={40} /></span>
              <p className="text-2xl font-extrabold">Video completed</p>
              <p className="text-[15px] text-pale">Marked as watched in your hub</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-extrabold">Not marked as watched yet</p>
              <p className="max-w-sm text-[15px] text-pale">It looks like parts of this video were skipped. Watch it through to get your tick.</p>
            </>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            {state === "done" && nextHref && (
              <Link href={nextHref} className="btn bg-sun text-deep hover:bg-white">Next video <Arrow size={16} /></Link>
            )}
            <button type="button" onClick={again} className="inline-flex min-h-12 cursor-pointer items-center rounded-full border-[1.5px] border-white px-5 font-bold">
              Watch again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
