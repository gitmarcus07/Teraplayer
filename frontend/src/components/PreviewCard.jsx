import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Download,
  Copy,
  Check,
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
  FolderOpen,
  Loader2,
  XCircle,
  VideoOff,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { useDownload, humanBytes, humanSpeed } from "./DownloadPanel";
import { truncateName } from "../utils/format";

const TYPE_ICON = {
  video: FileVideo,
  image: ImageIcon,
  audio: Music,
  document: FileText,
  archive: FileArchive,
  file: FileIcon,
};

const TYPE_LABELS = {
  video: "Video",
  image: "Image",
  audio: "Audio",
  document: "Document",
  archive: "Archive",
  folder: "Folder",
  file: "File",
};

export default function PreviewCard({
  data,
  onWatch,
  onDownload,
  onOpenFolder,
  onCopy,
  onShare,
  downloadUrl,
  downloadFilename,
  downloadSize,
}) {
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(copiedTimerRef.current), []);

  const download = useDownload({
    url: downloadUrl,
    filename: downloadFilename,
    sizeHint: downloadSize,
  });
  const hasInlineDownload = !!downloadUrl;

  const handleDownload = () => {
    if (hasInlineDownload) {
      if (download.start()) onDownload?.();
    } else {
      onDownload?.();
    }
  };

  const isFolder = Array.isArray(data.files) && data.files.length > 1;
  const Icon = TYPE_ICON[data.file_type || "file"] || FileIcon;
  const typeLabel = isFolder ? "Folder" : TYPE_LABELS[data.file_type] || "File";
  const canWatch = data.file_type === "video" && (data.stream_url || data.download_url);
  const hasDownloadSource = !!downloadUrl || !!data.download_url || !!data.stream_url;
  const videoUnavailable = data.file_type === "video" && !canWatch && hasDownloadSource;
  const fullTitle = data.title || "TeraBox file";

  const handleCopy = async () => {
    try {
      await onCopy?.();
      setCopied(true);
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      /* failure is reported by the caller */
    }
  };

  const metas = isFolder
    ? [
        {
          icon: FolderOpen,
          label: "Files",
          value: `${data.files.length} ${data.files.length === 1 ? "item" : "items"}`,
          testId: "meta-files",
        },
      ]
    : [
        data.size_str && { icon: HardDrive, label: "Size", value: data.size_str, testId: "meta-size" },
        data.duration && { icon: Clock, label: "Duration", value: formatDuration(data.duration), testId: "meta-duration" },
        data.resolution && { icon: Layers, label: "Resolution", value: data.resolution, testId: "meta-resolution" },
        { icon: Icon, label: "Type", value: typeLabel, testId: "meta-type" },
      ].filter(Boolean);

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
            alt={data.title || "TeraBox preview"}
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
              {isFolder ? <FolderOpen className="mr-1 h-3 w-3" /> : <Icon className="mr-1 h-3 w-3" />}{" "}
              {typeLabel}
            </Badge>
            {data.size_str && !isFolder && (
              <Badge
                variant="secondary"
                className="border border-white/10 bg-black/60 text-[10px] uppercase tracking-wider text-white backdrop-blur-md"
                data-testid="preview-size-badge"
              >
                <HardDrive className="mr-1 h-3 w-3" /> {data.size_str}
              </Badge>
            )}
          </div>
          {canWatch && !isFolder && (
            <button
              onClick={onWatch}
              data-testid="thumbnail-play-btn"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-[background-color,transform] duration-300 ease-out hover:scale-110 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:h-14 sm:w-14"
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
          title={fullTitle}
        >
          {truncateName(fullTitle, 42)}
        </h2>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {metas.map((m) => (
            <Meta key={m.label} icon={m.icon} label={m.label} value={m.value} testId={m.testId} />
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {videoUnavailable && (
            <div
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
              data-testid="video-unavailable-note"
            >
              <VideoOff className="h-3.5 w-3.5 shrink-0" />
              Video preview isn't available for this file.
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            {isFolder && onOpenFolder ? (
              <Button
                onClick={onOpenFolder}
                data-testid="open-folder-btn"
                size="lg"
                className="h-11 w-full text-white"
              >
                <FolderOpen className="mr-1.5 h-4 w-4" /> Open Folder
              </Button>
            ) : (
              <>
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
                {download.status === "downloading" ? (
                  <>
                    <Button
                      size="lg"
                      disabled
                      data-testid="downloading-btn"
                      className="h-11 w-full text-white sm:flex-1"
                    >
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Downloading…
                    </Button>
                    <Button
                      onClick={download.cancel}
                      variant="secondary"
                      size="lg"
                      data-testid="download-cancel-btn"
                      className="h-11 w-full sm:flex-1"
                    >
                      <XCircle className="mr-1.5 h-4 w-4" /> Cancel
                    </Button>
                  </>
                ) : download.status === "error" ? (
                  <Button
                    onClick={download.start}
                    variant="destructive"
                    size="lg"
                    data-testid="download-retry-btn"
                    className="h-11 w-full sm:flex-1"
                  >
                    <XCircle className="mr-1.5 h-4 w-4" /> Retry
                  </Button>
                ) : !hasDownloadSource ? (
                  <div
                    className="flex h-11 w-full items-center justify-center rounded-xl border border-dashed border-border px-3 text-center text-xs text-muted-foreground sm:flex-1"
                    data-testid="download-unavailable"
                  >
                    Download isn't available for this file.
                  </div>
                ) : (
                  <Button
                    onClick={handleDownload}
                    data-testid="download-btn"
                    variant={canWatch ? "secondary" : "default"}
                    size="lg"
                    className="h-11 w-full sm:flex-1"
                  >
                    <Download className="mr-1.5 h-4 w-4" /> Download
                  </Button>
                )}
              </>
            )}
          </div>

          {download.status !== "idle" && (
            <div
              className="space-y-1.5 rounded-lg border border-border bg-surface-overlay/50 p-2.5"
              aria-live="polite"
              data-testid="download-status"
            >
              {download.status === "downloading" && (
                <>
                  <Progress value={download.progress} data-testid="download-progress" />
                  <div className="text-xs text-muted-foreground">
                    {humanBytes(download.received)}
                    {download.total ? ` / ${humanBytes(download.total)}` : ""}
                    {download.speed ? ` · ${humanSpeed(download.speed)}` : ""}
                    {download.eta ? ` · ETA ${Math.max(0, Math.round(download.eta))}s` : ""}
                    {download.total > 0 ? ` · ${Math.min(100, Math.round(download.progress))}%` : ""}
                  </div>
                </>
              )}
              {download.status === "done" && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Check className="h-3.5 w-3.5" /> Download complete
                </div>
              )}
              {download.status === "error" && (
                <div className="text-xs text-destructive">{download.error}</div>
              )}
            </div>
          )}
          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={handleCopy}
              data-testid="copy-link-btn"
              variant="outline"
              size="sm"
              className="text-xs"
              aria-label="Copy source link"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-primary sm:mr-1.5" />
              ) : (
                <Copy className="h-3.5 w-3.5 sm:mr-1.5" />
              )}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
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
            <span className="sr-only" aria-live="polite">
              {copied ? "Source link copied" : ""}
            </span>
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
