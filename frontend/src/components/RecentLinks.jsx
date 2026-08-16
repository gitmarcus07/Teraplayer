import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  History,
  X,
  FolderOpen,
  FileVideo,
  Image as ImageIcon,
  Music,
  FileText,
  FileArchive,
  File as FileIcon,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "./ui/button";
import { relativeTime } from "../utils/history";

export const TYPE_LABELS = {
  video: "Video",
  image: "Image",
  audio: "Audio",
  document: "Document",
  archive: "Archive",
  folder: "Folder",
  file: "File",
};

const TYPE_ICON = {
  video: FileVideo,
  image: ImageIcon,
  audio: Music,
  document: FileText,
  archive: FileArchive,
  folder: FolderOpen,
  file: FileIcon,
};

export default function RecentLinks({ items, onOpen, onRemove, onClearAll }) {
  const [confirmingClear, setConfirmingClear] = useState(false);

  useEffect(() => {
    if (!confirmingClear) return;
    const id = setTimeout(() => setConfirmingClear(false), 4000);
    return () => clearTimeout(id);
  }, [confirmingClear]);

  const handleClear = () => {
    setConfirmingClear(false);
    onClearAll?.();
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto mt-4 w-full max-w-3xl px-5"
      aria-label="Recent links"
      data-testid="recent-links"
    >
      <div className="rounded-2xl border border-border bg-surface-raised p-3 sm:p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <History className="h-3.5 w-3.5 text-primary" />
            Recent links
          </div>
          {confirmingClear ? (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleClear}
                data-testid="recent-clear-confirm-btn"
                className="text-xs"
              >
                <Check className="mr-1 h-3.5 w-3.5" /> Clear all
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmingClear(false)}
                data-testid="recent-clear-cancel-btn"
                className="text-xs text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmingClear(true)}
              data-testid="recent-clear-btn"
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear all
            </Button>
          )}
        </div>

        <ul className="divide-y divide-border">
          {items.map((item) => {
            const Icon = TYPE_ICON[item.type] || FileIcon;
            return (
              <li key={item.url} className="flex items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => onOpen?.(item.url)}
                  className="group flex min-w-0 flex-1 items-center gap-3 text-left"
                  data-testid="recent-link-item"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-overlay">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium group-hover:text-primary">
                      {item.title || "TeraBox link"}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {TYPE_LABELS[item.type] || "Link"}
                      {item.size_str ? ` · ${item.size_str}` : ""}
                      {relativeTime(item.timestamp) ? ` · ${relativeTime(item.timestamp)}` : ""}
                    </span>
                  </span>
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemove?.(item.url)}
                  aria-label={`Remove ${item.title || "link"} from recent links`}
                  data-testid="recent-remove-btn"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.section>
  );
}