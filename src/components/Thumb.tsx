import { Play } from "./icons";
import { clock, youtubeId } from "@/lib/format";

const tints = [
  "bg-linear-to-br from-[#1e6b3c] to-deep", "bg-linear-to-br from-[#2b7a4b] to-leaf",
  "bg-linear-to-br from-leaf to-[#072a16]", "bg-linear-to-br from-brand to-leaf",
];

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
      <span className="relative flex size-13 items-center justify-center rounded-full bg-white text-deep shadow-lg transition group-hover:scale-110"><Play /></span>
      {video.durationSeconds > 0 && (
        <span className="absolute right-2.5 bottom-2.5 rounded-md bg-black/70 px-2 py-1 text-xs font-bold text-white tabular-nums">{clock(video.durationSeconds)}</span>
      )}
      {children}
    </div>
  );
}
