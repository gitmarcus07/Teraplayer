import { motion } from "framer-motion";
import {
  Play,
  Download,
  Copy,
   Share2,
   FileVideo,
  Image as ImageIcon,
  FileText,
  FileArchive,
  Music,
  File as FileIcon,
  Clock,
  HardDrive,
  Layers,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const TYPE_ICON = {
  video: FileVideo,
  image: ImageIcon,
  audio: Music,
  document: FileText,
  archive: FileArchive,
  file: FileIcon,
};

export default function PreviewCard({
  data,
  onWatch,
  onDownload,
  onCopy,
  onShare,
}) {
  const Icon = TYPE_ICON[data.file_type || "file"] || FileIcon;
  const canWatch = data.file_type === "video" && (data.stream_url || data.download_url);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-border bg-surface-raised overflow-hidden"
      data-testid="preview-card"
    >
      {/* Media Tile */}
      <div className="relative aspect-video w-full overflow-hidden">
        {data.thumbnail ? (
          <img
            src={data.thumbnail}
            alt={data.title}
            className="h-full w-full object-cover"
            data-testid="preview-thumbnail"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-overlay">
            <Icon className="h-16 w-16 text-muted-foreground" strokeWidth={1.25} />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3 sm:p-4">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Badge
              variant="secondary"
              className="border border-white/10 bg-black/60 text-[10px] uppercase tracking-wider text-white backdrop-blur-md"
              data-testid="preview-type-badge"
            >
              <Icon className="mr-1 h-3 w-3" /> {data.file_type}
            </Badge>
            {data.size_str && (
              <Badge
                variant="secondary"
                className="border border-white/10 bg-black/60 text-[10px] uppercase tracking-wider text-white backdrop-blur-md"
                data-testid="preview-size-badge"
              >
                <HardDrive className="mr-1 h-3 w-3" /> {data.size_str}
              </Badge>
            )}
          </div>
          {canWatch && (
            <button
              onClick={onWatch}
              data-testid="thumbnail-play-btn"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-[background-color,transform] duration-300 ease-out hover:scale-110 hover:bg-white/20 sm:h-14 sm:w-14"
              aria-label="Play video"
            >
              <Play className="h-5 w-5 fill-white sm:h-5 sm:w-5" strokeWidth={0} />
            </button>
          )}
        </div>
      </div>

      {/* Metadata & Actions */}
      <div className="p-3.5">
        <h2
          className="font-display text-lg font-bold leading-tight tracking-tight break-words"
          data-testid="preview-title"
        >
          {data.title}
        </h2>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Meta icon={HardDrive} label="Size" value={data.size_str || "—"} testId="meta-size" />
          <Meta
            icon={Clock}
            label="Duration"
            value={data.duration ? formatDuration(data.duration) : "—"}
            testId="meta-duration"
          />
          <Meta icon={Layers} label="Resolution" value={data.resolution || "—"} testId="meta-resolution" />
          <Meta icon={Icon} label="Type" value={data.file_type || "file"} testId="meta-type" />
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            {canWatch && (
              <Button
                onClick={onWatch}
                data-testid="watch-now-btn"
                size="lg"
                className="h-11 w-full text-white sm:flex-1"
              >
                <Play className="mr-1.5 h-4 w-4 fill-current" strokeWidth={0} /> Watch Now
              </Button>
            )}
            <Button
              onClick={onDownload}
              data-testid="download-btn"
              variant={canWatch ? "secondary" : "default"}
              size="lg"
              className="h-11 w-full sm:flex-1"
            >
              <Download className="mr-1.5 h-4 w-4" /> Download
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={onCopy}
              data-testid="copy-link-btn"
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Copy className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            <Button
              onClick={onShare}
              data-testid="share-btn"
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Share2 className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const Meta = ({ icon: Icon, label, value, testId }) => (
  <div
    className="rounded-lg border border-border bg-surface-overlay/50 p-2"
    data-testid={testId}
  >
    <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px]">
      <Icon className="h-3 w-3" /> {label}
    </div>
    <div className="line-clamp-1 text-xs font-medium text-foreground">{value}</div>
  </div>
);

function formatDuration(seconds) {
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s}` : `${m}:${s}`;
}
