import { useEffect, useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Check, Loader2, XCircle, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

export function humanBytes(n) {
  if (!n && n !== 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let x = n;
  while (x >= 1024 && i < units.length - 1) {
    x /= 1024;
    i += 1;
  }
  return `${x.toFixed(1)} ${units[i]}`;
}

export function humanSpeed(bytesPerSec) {
  return `${humanBytes(bytesPerSec)}/s`;
}

/**
 * useDownload
 * Shared download engine. Streams the URL, reports real byte progress, and
 * hands the resulting Blob to the browser. `start()` returns `false` if a
 * download is already running or no URL is available, so callers can avoid
 * duplicate work / duplicate analytics on rapid clicks.
 */
export function useDownload({ url, filename, sizeHint }) {
  const [status, setStatus] = useState("idle"); // idle|downloading|done|error
  const [progress, setProgress] = useState(0);
  const [received, setReceived] = useState(0);
  const [total, setTotal] = useState(sizeHint || 0);
  const [speed, setSpeed] = useState(0);
  const [eta, setEta] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const startingRef = useRef(false);

  const start = useCallback(() => {
    if (!url || startingRef.current) return false;
    startingRef.current = true;
    setStatus("downloading");
    setProgress(0);
    setReceived(0);
    setTotal(sizeHint || 0);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;
    const startedAt = Date.now();

    (async () => {
      try {
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) throw new Error("bad-response");
        const contentLength = Number(resp.headers.get("content-length") || 0);
        if (contentLength) setTotal(contentLength);

        const reader = resp.body.getReader();
        const chunks = [];
        let done = false;
        let bytes = 0;
        while (!done) {
          const { value, done: rd } = await reader.read();
          done = rd;
          if (value) {
            chunks.push(value);
            bytes += value.length;
            setReceived(bytes);
            const elapsed = (Date.now() - startedAt) / 1000;
            const sp = elapsed > 0 ? bytes / elapsed : 0;
            setSpeed(sp);
            if (contentLength) {
              const p = (bytes / contentLength) * 100;
              setProgress(p);
              const remaining = (contentLength - bytes) / sp;
              setEta(Number.isFinite(remaining) ? remaining : null);
            }
          }
        }
        const blob = new Blob(chunks);
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename || "teraplayer-download";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
        setStatus("done");
        setProgress(100);
      } catch (e) {
        if (e.name === "AbortError") {
          setStatus("idle");
          return;
        }
        setStatus("error");
        setError("Download couldn't be completed.");
      } finally {
        startingRef.current = false;
      }
    })();

    return true;
  }, [url, filename, sizeHint]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { status, progress, received, total, speed, eta, error, start, cancel };
}

export default function DownloadPanel({ url, filename, sizeHint, onClose, autoStart = false }) {
  const dl = useDownload({ url, filename, sizeHint });
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (autoStart && !autoStartedRef.current) {
      autoStartedRef.current = true;
      dl.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-border bg-surface-raised p-5 shadow-lg"
      data-testid="download-panel"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Download
          </div>
          <div className="truncate font-medium" data-testid="download-filename">
            {filename || "TeraBox file"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground" aria-live="polite">
            {dl.status === "downloading" && (
              <>
                <span className="font-medium text-foreground">Downloading…</span>{" "}
                {humanBytes(dl.received)} {dl.total ? `/ ${humanBytes(dl.total)}` : ""} · {humanSpeed(dl.speed)}
                {dl.eta ? ` · ETA ${Math.max(0, Math.round(dl.eta))}s` : ""}
              </>
            )}
            {dl.status === "idle" && (dl.total ? humanBytes(dl.total) : "Ready to start")}
            {dl.status === "done" && "Download complete"}
            {dl.status === "error" && (
              <span className="text-destructive">{dl.error}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {dl.status === "idle" && (
            <>
              <Button onClick={dl.start} size="sm" data-testid="download-start-btn" className="flex-1 sm:flex-none">
                <Download className="mr-1.5 h-4 w-4" /> Start
              </Button>
              <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-none">
                <a href={url} target="_blank" rel="noreferrer" data-testid="download-direct-link">
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Direct
                </a>
              </Button>
            </>
          )}
          {dl.status === "downloading" && (
            <Button
              onClick={dl.cancel}
              variant="secondary"
              size="sm"
              data-testid="download-cancel-btn"
            >
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Cancel
            </Button>
          )}
          {dl.status === "done" && (
            <Button variant="outline" size="sm" onClick={onClose} data-testid="download-close-btn">
              <Check className="mr-1.5 h-4 w-4 text-primary" /> Close
            </Button>
          )}
          {dl.status === "error" && (
            <Button onClick={dl.start} size="sm" variant="destructive" data-testid="download-retry-btn">
              <XCircle className="mr-1.5 h-4 w-4" /> Retry
            </Button>
          )}
        </div>
      </div>
      {(dl.status === "downloading" || dl.status === "done") && (
        <div className="mt-3">
          <Progress value={dl.progress} data-testid="download-progress" />
        </div>
      )}
    </motion.div>
  );
}