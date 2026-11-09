import { LinkIcon } from "@heroicons/react/24/outline";
import { MusicalNoteIcon, PlayCircleIcon } from "@heroicons/react/24/solid";
import { linkPlatform } from "@/lib/linkPlatform";

const LINK_STYLE: Record<string, string> = {
  tiktok: "bg-black text-white",
  youtube: "bg-[#FF0000] text-white",
  other:
    "bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-strong)]",
};
const LINK_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  other: "Link",
};

export default function LinkButton({ link }: { link: string }) {
  const platform = linkPlatform(link);
  const Icon =
    platform === "tiktok"
      ? MusicalNoteIcon
      : platform === "youtube"
        ? PlayCircleIcon
        : LinkIcon;
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${LINK_STYLE[platform]}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{LINK_LABEL[platform]}</span>
    </a>
  );
}
