import { useMemo, useState } from "react";
import {
  Grid3x3,
  List as ListIcon,
  Search,
  ArrowUpDown,
  Download,
  ChevronRight,
  Home as HomeIcon,
  FileVideo,
  FileText,
  Image as ImageIcon,
  Music,
  FileArchive,
  File as FileIcon,
  Play,
  CheckSquare,
  Square,
  Loader2,
  FolderOpen,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { streamProxyUrl } from "../services/api";
import { track } from "../lib/analytics";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";

const ICONS = {
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

const SORTS = [
  { id: "name-asc", label: "Name A–Z" },
  { id: "name-desc", label: "Name Z–A" },
  { id: "size-desc", label: "Largest first" },
  { id: "size-asc", label: "Smallest first" },
  { id: "type", label: "Type" },
];

function sizeToNum(entry) {
  if (typeof entry.size === "number") return entry.size;
  const s = (entry.size_str || "").toString();
  const m = s.match(/([\d.]+)\s*(B|KB|MB|GB|TB)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  const mult = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 }[unit] || 1;
  return n * mult;
}

export default function FolderBrowser({ files, onPlayFile, folderName, activeIdx }) {
  const [view, setView] = useState("grid"); // grid | list
  const [query, setQuery] = useState("");
  const [sortId, setSortId] = useState("name-asc");
  const [selected, setSelected] = useState(new Set());
  const [zipping, setZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Defensive: never crash on a missing/malformed files payload.
  const safeFiles = useMemo(() => (Array.isArray(files) ? files : []), [files]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = safeFiles.map((f, idx) => ({ ...f, _idx: idx }));
    if (q) arr = arr.filter((f) => (f.name || "").toLowerCase().includes(q));
    arr.sort((a, b) => {
      switch (sortId) {
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "size-desc":
          return sizeToNum(b) - sizeToNum(a);
        case "size-asc":
          return sizeToNum(a) - sizeToNum(b);
        case "type":
          return (a.file_type || "").localeCompare(b.file_type || "");
        default:
          return (a.name || "").localeCompare(b.name || "");
      }
    });
    return arr;
  }, [safeFiles, query, sortId]);

  const allSelected = filtered.length > 0 && filtered.every((f) => selected.has(f._idx));
  const someSelected = selected.size > 0 && !allSelected;

  const toggle = (idx) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
      track("folder_selection_cleared");
    } else {
      setSelected(new Set(filtered.map((f) => f._idx)));
      track("folder_select_all");
    }
  };

  const clearSelection = () => {
    setSelected(new Set());
    track("folder_selection_cleared");
  };

  const downloadZip = async () => {
    const items = safeFiles
      .map((f, i) => ({ ...f, _idx: i }))
      .filter((f) => selected.has(f._idx) && (f.download_url || f.stream_url));

    if (!items.length) {
      toast.error("Select at least one file with a direct link");
      return;
    }

    track("zip_download_started");
    setZipping(true);
    setZipProgress(0);
    const zip = new JSZip();
    try {
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        toast.info(`Downloading ${item.name || "file"} (${i + 1}/${items.length})…`);
        const resp = await fetch(streamProxyUrl(item.download_url || item.stream_url));
        if (!resp.ok) throw new Error(`Failed on ${item.name}`);
        const blob = await resp.blob();
        zip.file(item.name || `file-${i + 1}`, blob);
        setZipProgress(Math.round(((i + 1) / items.length) * 60));
      }
      const content = await zip.generateAsync({ type: "blob" }, (meta) => {
        setZipProgress(60 + Math.round(meta.percent * 0.4));
      });
      saveAs(content, `${folderName || "TeraPlayer"}.zip`);
      toast.success("ZIP ready");
      setSelected(new Set());
    } catch (e) {
      console.error(e.message || "ZIP failed");
      toast.error(e.message || "ZIP failed");
    } finally {
      setZipping(false);
      setZipProgress(0);
    }
  };

  const downloadOne = (item) => {
    const url = item.download_url || item.stream_url;
    if (!url) {
      toast.error("No direct link for this file");
      return;
    }
    const a = document.createElement("a");
    a.href = streamProxyUrl(url);
    a.download = item.name || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const currentSort = SORTS.find((s) => s.id === sortId) || SORTS[0];

  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-3 sm:p-4 md:p-6" data-testid="folder-browser">
      {/* Breadcrumbs */}
      <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground sm:mb-4 sm:text-xs" aria-label="Breadcrumb">
        <HomeIcon className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">TeraBox</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="line-clamp-1 max-w-[150px] font-medium text-foreground sm:max-w-none" title={folderName || "Shared folder"}>{folderName || "Shared folder"}</span>
        <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs">
          {safeFiles.length} items
        </Badge>
      </nav>

      {/* Toolbar */}
      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in this folder…"
            className="pl-9"
            data-testid="folder-search"
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-testid="folder-sort-btn" className="flex-1 text-xs sm:flex-none">
                <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" /> <span className="truncate">{currentSort.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SORTS.map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => setSortId(s.id)}
                  data-testid={`sort-${s.id}`}
                >
                  {s.label} {s.id === sortId && "•"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex shrink-0 overflow-hidden rounded-lg border border-border">
            <button
              onClick={() => setView("grid")}
              data-testid="view-grid-btn"
              className={`px-2.5 py-1.5 text-xs transition-colors duration-200 ${
                view === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"
              }`}
              aria-label="Grid view"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              data-testid="view-list-btn"
              className={`px-2.5 py-1.5 text-xs transition-colors duration-200 ${
                view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60"
              }`}
              aria-label="List view"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2" data-testid="folder-bulk-bar">
        <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {selected.size > 0 ? (
            <>
              <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate" data-testid="selected-count">
                {selected.size} {selected.size === 1 ? "file" : "files"} selected
              </span>
            </>
          ) : (
            <span>Select files to download as ZIP</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleAll}
            aria-pressed={allSelected}
            data-testid="select-all-btn"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : someSelected ? (
              <CheckSquare className="h-4 w-4 text-primary/50" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {allSelected ? "Deselect all" : "Select all"}
          </button>
          {selected.size > 0 && (
            <button
              onClick={clearSelection}
              data-testid="clear-selection-btn"
              className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear
            </button>
          )}
          <Button
            size="sm"
            disabled={selected.size === 0 || zipping}
            onClick={downloadZip}
            data-testid="download-zip-btn"
            className="text-xs sm:text-sm"
            aria-live="polite"
          >
            {zipping ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> {zipProgress}%
              </>
            ) : (
              <>
                <Download className="mr-1.5 h-4 w-4" /> ZIP
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Grid / list */}
      {safeFiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <FolderOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground" strokeWidth={1.25} />
          <div className="text-sm font-medium">This folder is empty</div>
          <p className="mt-1 text-xs text-muted-foreground">
            No files were found in this shared folder.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No files match your search.
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => {
            const Icon = ICONS[f.file_type || "file"] || FileIcon;
            const isSel = selected.has(f._idx);
            const isActive = activeIdx != null && f._idx === activeIdx;
            const canPlay = f.file_type === "video" && (f.stream_url || f.download_url);
            return (
              <div
                key={f._idx}
                data-testid="folder-item"
                className={`group relative overflow-hidden rounded-xl border ${
                  isActive
                    ? "border-primary ring-1 ring-primary"
                    : isSel
                      ? "border-primary"
                      : "border-border"
                } bg-surface-overlay/50 transition-[border-color,brightness] duration-200 hover:border-primary/60 hover:brightness-115`}
              >
                <button
                  onClick={() => toggle(f._idx)}
                  className="absolute left-2 top-2 z-10 rounded-md bg-black/50 p-1 text-white backdrop-blur-md transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  aria-label={isSel ? "Deselect file" : "Select file"}
                  aria-pressed={isSel}
                  data-testid="folder-select-btn"
                >
                  {isSel ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                </button>
                <div className="relative aspect-video w-full bg-surface-overlay">
                  {f.thumbnail ? (
                    <img src={f.thumbnail} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Icon className="h-10 w-10" strokeWidth={1.25} />
                    </div>
                  )}
                  {canPlay && (
                    <button
                      onClick={() => onPlayFile?.(f)}
                      className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-[background-color,opacity] duration-200 hover:bg-black/40 hover:opacity-100 focus-visible:bg-black/40 focus-visible:opacity-100"
                      aria-label="Play"
                    >
                      <span className="rounded-full bg-white/20 p-3 backdrop-blur-md transition-transform duration-200 hover:scale-110">
                        <Play className="h-5 w-5 fill-white text-white" strokeWidth={0} />
                      </span>
                    </button>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <div className="line-clamp-1 text-xs font-medium text-white">{f.name || "Untitled"}</div>
                    {isActive && (
                      <span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-white">
                        Previewing
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="text-xs text-muted-foreground">
                    {f.size_str || "—"}
                    {f.file_type ? ` · ${TYPE_LABELS[f.file_type] || f.file_type}` : ""}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => downloadOne(f)}
                    aria-label="Download"
                    data-testid="folder-download-btn"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {filtered.map((f) => {
            const Icon = ICONS[f.file_type || "file"] || FileIcon;
            const isSel = selected.has(f._idx);
            const isActive = activeIdx != null && f._idx === activeIdx;
            return (
              <div
                key={f._idx}
                data-testid="folder-item"
                className={`flex items-center gap-3 p-3 transition-colors duration-200 ${
                  isActive ? "bg-primary/5 ring-1 ring-inset ring-primary" : isSel ? "bg-primary/5" : "hover:bg-surface-overlay/40"
                }`}
              >
                <button onClick={() => toggle(f._idx)} data-testid="folder-select-btn" aria-label={isSel ? "Deselect file" : "Select file"} aria-pressed={isSel}>
                  {isSel ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-surface-overlay">
                  {f.thumbnail ? (
                    <img src={f.thumbnail} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onPlayFile?.(f)}
                  className="min-w-0 flex-1 text-left"
                  data-testid="folder-open-btn"
                >
                  <div className="line-clamp-1 text-sm font-medium" title={f.name || "Untitled"}>{f.name || "Untitled"}</div>
                  <div className="text-xs text-muted-foreground">
                    {f.size_str || "—"}
                    {f.file_type ? ` · ${TYPE_LABELS[f.file_type] || f.file_type}` : ""}
                  </div>
                </button>
                {isActive && (
                  <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                    Previewing
                  </span>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => downloadOne(f)}
                  aria-label="Download"
                  data-testid="folder-download-btn"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
