import { motion } from "framer-motion";
import {
  Play,
  Download,
  Copy,
  Share2,
  Star,
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
  onFavorite,
  isFavorite,
}) {
  const Icon = TYPE_ICON[data.file_type || "file"] || FileIcon;
  const canWatch = data.file_type === "video" && (data.stream_url || data.download_url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6"
      data-testid="preview-card"
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card md:col-span-7">
        <div className="relative aspect-video w-full">
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
            <div className="flex h-full w-full items-center justify-center bg-secondary">
              <Icon className="h-16 w-16 text-muted-foreground" strokeWidth={1.25} />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {canWatch && (
            <button
              onClick={onWatch}
              data-testid="thumbnail-play-btn"
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-transform duration-300 hover:scale-110 sm:h-20 sm:w-20"
              aria-label="Play video"
            >
              <Play className="h-6 w-6 fill-white sm:h-8 sm:w-8" strokeWidth={0} />
            </button>
          )}
          {data.file_type && (
            <Badge
              variant="secondary"
              className="absolute left-2 top-2 border border-white/10 bg-black/60 text-[10px] uppercase tracking-wider text-white backdrop-blur-md sm:left-3 sm:top-3 sm:text-xs"
              data-testid="preview-type-badge"
            >
              <Icon className="mr-1 h-3 w-3" /> {data.file_type}
            </Badge>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:gap-5 sm:p-6 md:col-span-5 md:p-8">
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
            TeraBox · via {data.source}
          </div>
          <h2
            className="font-display text-xl font-bold leading-tight tracking-tight sm:text-2xl md:text-3xl"
            data-testid="preview-title"
          >
            {data.title}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
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

        <div className="mt-auto flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            {canWatch && (
              <Button
                onClick={onWatch}
                data-testid="watch-now-btn"
                className="w-full sm:flex-1"
                size="lg"
              >
                <Play className="mr-2 h-4 w-4 fill-current" strokeWidth={0} /> Watch Now
              </Button>
            )}
            <Button
              onClick={onDownload}
              data-testid="download-btn"
              variant={canWatch ? "secondary" : "default"}
              className="w-full sm:flex-1"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={onCopy}
              data-testid="copy-link-btn"
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
            >
              <Copy className="h-3.5 w-3.5 sm:mr-2" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            <Button
              onClick={onShare}
              data-testid="share-btn"
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
            >
              <Share2 className="h-3.5 w-3.5 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button
              onClick={onFavorite}
              data-testid="favorite-btn"
              variant="outline"
              size="sm"
              aria-pressed={isFavorite}
              className="text-xs sm:text-sm"
            >
              <Star
                className={`h-3.5 w-3.5 sm:mr-2 ${isFavorite ? "fill-primary text-primary" : ""}`}
              />
              <span className="hidden sm:inline">{isFavorite ? "Saved" : "Save"}</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const Meta = ({ icon: Icon, label, value, testId }) => (
  <div
    className="rounded-xl border border-border bg-secondary/40 p-2.5 sm:p-3"
    data-testid={testId}
  >
    <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px]">
      <Icon className="h-3 w-3" /> {label}
    </div>
    <div className="line-clamp-1 text-xs font-medium text-foreground sm:text-sm">{value}</div>
  </div>
);

function formatDuration(seconds) {
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s}` : `${m}:${s}`;
}
