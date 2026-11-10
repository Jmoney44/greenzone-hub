import { Play } from "./icons";
import { clock, youtubeId } from "@/lib/format";

const tints = ["bg-leaf", "bg-[#1e6b3c]", "bg-deep", "bg-[#2b7a4b]"];

/** Video picture: the YouTube still when there is one, otherwise a brand-coloured tile. */
export function Thumb({
  video, index = 0, children,
}: {
  video: { sourceType: string; source: string; durationSeconds: number };
  index?: number;
  children?: React.ReactNode;
}) {
  const yt = video.sourceType === "YOUTUBE" ? youtubeId(video.source) : null;
  return (
    <div className={`relative flex aspect-video items-center justify-center overflow-hidden ${tints[index % tints.length]}`}>
      {yt && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      )}
      <span className="relative flex size-13 items-center justify-center rounded-full bg-white text-deep"><Play /></span>
      {video.durationSeconds > 0 && (
        <span className="absolute right-2.5 bottom-2.5 rounded-md bg-deep px-2 py-1 text-xs font-bold text-white">{clock(video.durationSeconds)}</span>
      )}
      {children}
    </div>
  );
}
