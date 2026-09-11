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
import { useLang } from "../i18n/LanguageContext";

const TYPE_ICON = {
  video: FileVideo,
  image: ImageIcon,
  audio: Music,
  document: FileText,
  archive: FileArchive,
  file: FileIcon,
};

const TYPE_LABEL_KEYS = {
  video: "pc.type.video",
  image: "pc.type.image",
  audio: "pc.type.audio",
  document: "pc.type.document",
  archive: "pc.type.archive",
  folder: "pc.type.folder",
  file: "pc.type.file",
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
  const { t } = useLang();
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
  const typeLabel = isFolder ? t("pc.type.folder") : t(TYPE_LABEL_KEYS[data.file_type] || "pc.type.file");
  const canWatch = data.file_type === "video" && (data.stream_url || data.download_url);
  const hasDownloadSource = !!downloadUrl || !!data.download_url || !!data.stream_url;
  const videoUnavailable = data.file_type === "video" && !canWatch && hasDownloadSource;
  const fullTitle = data.title || t("pc.fallback");

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
          label: t("pc.meta.files"),
          value: `${data.files.length} ${t("pc.items")}`,
          testId: "meta-files",
        },
      ]
    : [
        data.size_str && { icon: HardDrive, label: t("pc.meta.size"), value: data.size_str, testId: "meta-size" },
        data.duration && { icon: Clock, label: t("pc.meta.duration"), value: formatDuration(data.duration), testId: "meta-duration" },
        data.resolution && { icon: Layers, label: t("pc.meta.resolution"), value: data.resolution, testId: "meta-resolution" },
        { icon: Icon, label: t("pc.meta.type"), value: typeLabel, testId: "meta-type" },
      ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="ds-card overflow-hidden"
      data-testid="preview-card"
    >
      {/* Media Tile */}
      <div className="relative aspect-video w-full overflow-hidden bg-surface-overlay">
        {data.thumbnail ? (
          <img
            src={data.thumbnail}
            alt={data.title ? `${t("pc.thumbFor")} ${data.title}` : t("pc.thumbGen")}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            data-testid="preview-thumbnail"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-overlay" role="img" aria-label={typeLabel}>
            <Icon className="h-16 w-16 text-muted-foreground" strokeWidth={1.25} aria-hidden="true" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
          <div className="flex min-w-0 flex-wrap gap-1.5 sm:gap-2">
            <Badge
              variant="secondary"
              className="border border-white/10 bg-black/60 text-[10px] uppercase tracking-wider text-white backdrop-blur-md"
              data-testid="preview-type-badge"
            >
              {isFolder ? <FolderOpen className="mr-1 h-3 w-3" aria-hidden="true" /> : <Icon className="mr-1 h-3 w-3" aria-hidden="true" />}{" "}
              {typeLabel}
            </Badge>
            {data.size_str && !isFolder && (
              <Badge
                variant="secondary"
                className="border border-white/10 bg-black/60 text-[10px] uppercase tracking-wider text-white backdrop-blur-md"
                data-testid="preview-size-badge"
              >
                <HardDrive className="mr-1 h-3 w-3" aria-hidden="true" /> {data.size_str}
              </Badge>
            )}
          </div>
          {canWatch && !isFolder && (
<button
               onClick={onWatch}
               data-testid="thumbnail-play-btn"
               className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-[background-color,transform] duration-normal ease-out hover:scale-110 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95 sm:h-16 sm:w-16"
               aria-label={`${t("pc.play")} ${fullTitle}`}
             >
               <Play className="h-6 w-6 fill-white sm:h-8 sm:w-8" strokeWidth={0} aria-hidden="true" />
             </button>
          )}
        </div>
      </div>

      {/* Metadata & Actions */}
      <div className="p-4 sm:p-5">
        <h2
          className="break-words font-display text-lg font-bold leading-tight tracking-tight sm:text-xl"
          data-testid="preview-title"
          title={fullTitle}
        >
          {truncateName(fullTitle, 60)}
        </h2>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {metas.map((m) => (
            <Meta key={m.label} icon={m.icon} label={m.label} value={m.value} testId={m.testId} />
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {videoUnavailable && (
            <div
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
              data-testid="video-unavailable-note"
            >
              <VideoOff className="h-3.5 w-3.5 shrink-0" />
              {t("pc.videoUnavailable")}
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
                <FolderOpen className="mr-1.5 h-4 w-4" /> {t("pc.openFolder")}
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
                    <Play className="mr-1.5 h-4 w-4 fill-current" strokeWidth={0} /> {t("pc.watch")}
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
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> {t("pc.downloading")}
                    </Button>
                    <Button
                      onClick={download.cancel}
                      variant="secondary"
                      size="lg"
                      data-testid="download-cancel-btn"
                      className="h-11 w-full sm:flex-1"
                    >
                      <XCircle className="mr-1.5 h-4 w-4" /> {t("pc.cancel")}
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
                    <XCircle className="mr-1.5 h-4 w-4" /> {t("pc.retry")}
                  </Button>
                ) : !hasDownloadSource ? (
                  <div
                    className="flex h-11 w-full items-center justify-center rounded-xl border border-dashed border-border px-3 text-center text-xs text-muted-foreground sm:flex-1"
                    data-testid="download-unavailable"
                  >
                    {t("pc.dlUnavailable")}
                  </div>
                ) : (
                  <Button
                    onClick={handleDownload}
                    data-testid="download-btn"
                    variant={canWatch ? "secondary" : "default"}
                    size="lg"
                    className="h-11 w-full sm:flex-1"
                  >
                    <Download className="mr-1.5 h-4 w-4" /> {t("pc.download")}
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
                  <Check className="h-3.5 w-3.5" /> {t("pc.done")}
                </div>
              )}
              {download.status === "error" && (
                <div className="text-xs text-destructive">{t("dlp.errFailed")}</div>
              )}
            </div>
          )}
<div className="flex flex-wrap items-center justify-center gap-2 sm:flex-row sm:justify-start">
             <Button
               onClick={handleCopy}
               data-testid="copy-link-btn"
               variant="outline"
               size="sm"
               className="h-10 w-full text-xs sm:w-auto"
               aria-label={t("pc.copyAria")}
             >
               {copied ? (
                 <Check className="h-3.5 w-3.5 text-primary sm:mr-1.5" />
               ) : (
                 <Copy className="h-3.5 w-3.5 sm:mr-1.5" />
               )}
               <span className="hidden sm:inline">{copied ? t("pc.copied") : t("pc.copy")}</span>
             </Button>
             <Button
               onClick={onShare}
               data-testid="share-btn"
               variant="outline"
               size="sm"
               className="h-10 w-full text-xs sm:w-auto"
               aria-label={t("pc.shareAria")}
             >
               <Share2 className="h-3.5 w-3.5 sm:mr-1.5" />
               <span className="hidden sm:inline">{t("pc.share")}</span>
             </Button>
             <span className="sr-only" aria-live="polite">
               {copied ? t("pc.copiedLive") : ""}
             </span>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

const Meta = ({ icon: Icon, label, value, testId }) => (
  <div
    className="rounded-xl border border-border bg-surface-overlay/50 p-2.5"
    data-testid={testId}
  >
    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" /> {label}
    </div>
    <div className="line-clamp-1 text-sm font-medium text-foreground" title={String(value)}>{value}</div>
  </div>
);

function formatDuration(seconds) {
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s}` : `${m}:${s}`;
}
