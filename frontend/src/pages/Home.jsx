import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import {
  AlertTriangle,
  Sparkles,
  Zap,
  ShieldCheck,
  Cloud,
  Cpu,
  KeyRound,
  Film,
  FolderOpen,
  Puzzle,
} from "lucide-react";

import Header from "../components/Header";
import HeroInput from "../components/HeroInput";
import PreviewCard from "../components/PreviewCard";
import VideoPlayer from "../components/VideoPlayer";
import DownloadPanel from "../components/DownloadPanel";
import PasswordDialog from "../components/PasswordDialog";
import QualityPicker from "../components/QualityPicker";
import FolderBrowser from "../components/FolderBrowser";
import ExtensionStatus from "../components/ExtensionStatus";
import { Button } from "../components/ui/button";

import {
  postPreview,
  streamProxyUrl,
} from "../services/api";
import { runExtensionExtraction, EXT_STATUS } from "../services/extension";

// Detect if the file collection looks like alternate resolutions of the same asset.
function buildQualityOptions(preview) {
  if (!preview?.files || preview.files.length < 2) return [];
  const videoFiles = preview.files.filter(
    (f) => (f.file_type === "video" || !f.file_type) && (f.stream_url || f.download_url)
  );
  if (videoFiles.length < 2) return [];
  // Only treat as qualities if names differ mainly by resolution keywords.
  const hasQualityHints = videoFiles.some((f) =>
    /(240p|360p|480p|540p|720p|1080p|1440p|2160p|4k|hd|sd)/i.test(f.name || "")
  );
  if (!hasQualityHints) return [];
  return videoFiles.map((f, idx) => {
    const match = (f.name || "").match(/(240p|360p|480p|540p|720p|1080p|1440p|2160p|4k)/i);
    return {
      id: String(idx),
      label: match ? match[1].toUpperCase() : f.name || `Source ${idx + 1}`,
      file: f,
    };
  });
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [watching, setWatching] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pwdDialog, setPwdDialog] = useState({ open: false, url: "", incorrect: false });
  const [selectedQualityId, setSelectedQualityId] = useState("");
  const [activeFile, setActiveFile] = useState(null);
  const [extStatus, setExtStatus] = useState(null);
  const [extRunning, setExtRunning] = useState(false);
  const [extRetrying, setExtRetrying] = useState(false);
  const extLastRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const submit = useCallback(
    async (url, password = "") => {
      setLoading(true);
      setPreview(null);
      setWatching(false);
      setDownloading(false);
      setActiveFile(null);
      setSelectedQualityId("");
      try {
        const data = await postPreview(url, password);
        const enriched = { ...data, sourceUrl: url, usedPassword: password };
        setPreview(enriched);
        if (!data.ok) {
          if (data.password_required) {
            const wasIncorrect = !!data.password_incorrect;
            if (wasIncorrect) toast.error("Incorrect password. Please try again.");
            setPwdDialog({ open: true, url, incorrect: wasIncorrect });
          } else {
            toast.error(data.error || "Could not extract this link.");
          }
        } else {
          toast.success("Link resolved");
        }
        setSearchParams({ url });
      } catch (e) {
        console.error(e);
        toast.error("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [setSearchParams]
  );

  const runBrowserExtraction = useCallback(
    async (url, password = "") => {
      if (!url) return;
      extLastRef.current = { url, password };
      setLoading(false);
      setPreview(null);
      setWatching(false);
      setDownloading(false);
      setActiveFile(null);
      setSelectedQualityId("");
      setExtRetrying(false);
      setExtRunning(true);
      setExtStatus({ state: EXT_STATUS.CREATING, message: "Preparing browser extraction…" });
      setSearchParams({ url });

      const res = await runExtensionExtraction({
        url,
        password,
        onStatus: (state, message) => setExtStatus({ state, message }),
      });

      if (res.status === EXT_STATUS.DONE && res.preview) {
        const enriched = { ...res.preview, sourceUrl: url, usedPassword: password };
        setPreview(enriched);
        setExtStatus(null);
        if (res.preview.ok) {
          toast.success("Link resolved via browser");
        } else if (res.preview.password_required) {
          setPwdDialog({
            open: true,
            url,
            incorrect: !!res.preview.password_incorrect,
          });
        } else {
          toast.error(res.preview.error || "Could not extract this link via browser.");
        }
      }
      setExtRunning(false);
    },
    [setSearchParams]
  );

  const retryBrowserExtraction = useCallback(() => {
    const last = extLastRef.current;
    if (!last) return;
    setExtRetrying(true);
    runBrowserExtraction(last.url, last.password);
  }, [runBrowserExtraction]);

  useEffect(() => {
    const q = searchParams.get("url");
    if (q && !preview && !loading) {
      submit(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(preview.sourceUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const share = async () => {
    const shareUrl = `${window.location.origin}/?url=${encodeURIComponent(preview.sourceUrl)}`;
    try {
      if (navigator.share) await navigator.share({ title: preview.title, url: shareUrl });
      else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Shareable link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  const qualityOptions = useMemo(() => buildQualityOptions(preview), [preview]);
  const isFolder = preview?.ok && preview?.files && preview.files.length > 1 && qualityOptions.length === 0;

  const selectedQuality = qualityOptions.find((q) => q.id === selectedQualityId) || qualityOptions[0];

  const currentFile = activeFile || selectedQuality?.file || preview;
  const streamUrl = currentFile?.stream_url || currentFile?.download_url;
  const streamViaProxy = streamUrl ? streamProxyUrl(streamUrl) : null;

  const openFolderFile = (file) => {
    setActiveFile(file);
    setWatching(file.file_type === "video");
    setDownloading(false);
  };

  return (
    <div className="App noise min-h-screen">
      <Helmet>
        <title>TeraPlayer | TeraBox Video Downloader, Player &amp; Streaming</title>
        <meta name="description" content="Watch, stream and download TeraBox videos online for free with TeraPlayer. Fast HD streaming, folder support, ZIP downloads and no login required." />
        <link rel="canonical" href="https://www.teraplayer.in/" />
        <meta property="og:title" content="TeraPlayer - Watch &amp; Download TeraBox Videos" />
        <meta property="og:description" content="Watch, stream and download TeraBox videos instantly with TeraPlayer. Fast HD streaming and folder support." />
        <meta property="og:url" content="https://www.teraplayer.in/" />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:image:alt" content="TeraPlayer - Watch &amp; Download TeraBox Videos Free" />
        <meta name="twitter:title" content="TeraPlayer - Watch &amp; Download TeraBox Videos" />
        <meta name="twitter:description" content="Watch, stream and download TeraBox videos instantly with TeraPlayer." />
        <meta name="twitter:image:alt" content="TeraPlayer - Watch &amp; Download TeraBox Videos Free" />
      </Helmet>
      <Header />

      <main id="main" className="tp-container">
        <section className="relative flex flex-col items-center justify-start pt-10 pb-4 md:min-h-0 md:pt-8 md:pb-6">
          <div className="mx-auto w-full max-w-3xl px-5">

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:mb-3 sm:px-3 sm:py-1 sm:text-xs">
                <Sparkles className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">
                  Now with folders, quality picker &amp; ZIP downloads
                </span>
                <span className="sm:hidden">
                  Folders · Quality · ZIP
                </span>
              </div>

              <h1
                className="font-display text-[2.5rem] font-black leading-[0.95] tracking-tighter sm:text-5xl sm:leading-[0.9]"
                data-testid="hero-title"
              >
                Watch &amp; Download
                <br />
                <span className="text-primary">TeraBox</span> Videos
                <br />
                Instantly.
              </h1>

              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base md:mt-3">
                Stream, preview and download public TeraBox links in seconds.{" "}
                <br className="hidden sm:block" />
                No login · HD Streaming · Folder Support
              </p>
            </motion.div>

            <div className="mt-6 md:mt-5">
              <HeroInput
                onSubmit={submit}
                loading={loading}
                defaultValue={searchParams.get("url") || ""}
              />
            </div>

            {!loading && !preview && searchParams.get("url") && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => runBrowserExtraction(searchParams.get("url"))}
                  disabled={extRunning}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-primary hover:underline"
                  data-testid="browser-extraction-link"
                >
                  <Puzzle className="h-3 w-3" />
                  Link not resolving? Extract with Browser
                </button>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mx-auto mt-5 flex max-w-sm flex-wrap items-center justify-center gap-2 sm:max-w-xl sm:gap-3 md:mt-4"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-[10px] text-muted-foreground sm:text-xs">
                <Film className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
                HD Streaming
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-[10px] text-muted-foreground sm:text-xs">
                <FolderOpen className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
                Folder Support
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-[10px] text-muted-foreground sm:text-xs">
                <ShieldCheck className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
                No Login Required
              </span>
            </motion.div>
          </div>
        </section>

        {loading && <LoadingSkeleton />}

        {extStatus && (
          <ExtensionStatus
            status={extStatus.state}
            message={extStatus.message}
            onRetry={retryBrowserExtraction}
            retrying={extRetrying}
          />
        )}

        {!loading && preview && preview.ok === false && !preview.password_required && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto mb-6 max-w-3xl rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-destructive sm:mb-10 sm:p-6"
            data-testid="error-panel"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <div className="font-semibold">We couldn't extract this link</div>
                <p className="mt-1 text-sm opacity-90">
                  {preview.error ||
                    "The link may be private, expired, or the extractor mirrors are temporarily unavailable."}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {!loading && preview && preview.ok === false && preview.password_required && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto mb-6 max-w-3xl rounded-2xl border border-primary/40 bg-primary/5 p-4 sm:mb-10 sm:p-6"
            data-testid="password-required-panel"
          >
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1">
                <div className="font-semibold">This link is password protected</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the password to unlock the file preview.
                </p>
                <Button
                  className="mt-3"
                  size="sm"
                  onClick={() => setPwdDialog({ open: true, url: preview.sourceUrl, incorrect: false })}
                  data-testid="open-password-btn"
                >
                  Enter password
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {!loading && preview && preview.ok && (
          <div className="mx-auto mb-6 max-w-[650px] space-y-3 sm:mb-8 sm:space-y-4">
            {watching && streamViaProxy ? (
              <div className="space-y-3">
                <VideoPlayer
                  src={streamViaProxy}
                  poster={currentFile?.thumbnail || preview.thumbnail}
                  title={currentFile?.name || preview.title}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                  <Button variant="outline" size="sm" onClick={() => setWatching(false)} data-testid="close-player-btn">
                    ← Back
                  </Button>
                  <QualityPicker
                    options={qualityOptions}
                    value={selectedQuality?.id || ""}
                    onChange={(id) => {
                      setSelectedQualityId(id);
                      setActiveFile(null);
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="md:mx-auto md:max-w-[470px]">
                <PreviewCard
                  data={{ ...preview, ...(selectedQuality?.file || {}) }}
                  onWatch={() => {
                    if (!streamViaProxy) {
                      toast.error("No stream URL available");
                      return;
                    }
                    setWatching(true);
                  }}
                  onDownload={() => setDownloading(true)}
                  onCopy={copyLink}
                  onShare={share}
                />
              </div>
            )}

            {qualityOptions.length > 1 && !watching && (
              <div className="flex items-center justify-end">
                <QualityPicker
                  options={qualityOptions}
                  value={selectedQuality?.id || ""}
                  onChange={(id) => {
                    setSelectedQualityId(id);
                    setActiveFile(null);
                  }}
                />
              </div>
            )}

            {downloading && streamUrl && (
              <DownloadPanel
                url={streamViaProxy}
                filename={currentFile?.name || preview.title}
                sizeHint={currentFile?.size || preview.size || 0}
                onClose={() => setDownloading(false)}
              />
            )}

            {isFolder && (
              <FolderBrowser
                files={preview.files}
                folderName={preview.title}
                onPlayFile={openFolderFile}
              />
            )}
          </div>
        )}

        <div className="mx-auto mt-8 flex flex-col items-center justify-center gap-2 text-center md:mt-10">
          <p className="text-xs text-muted-foreground sm:text-sm">
            Need to{" "}
            <Link
              to="/terabox-video-downloader"
              className="text-primary hover:underline"
            >
              download TeraBox videos
            </Link>
            ?
          </p>
        </div>

        <section
          aria-labelledby="terabox-guides-heading"
          className="mx-auto mt-10 max-w-4xl px-5 md:mt-8"
        >
          <h2
            id="terabox-guides-heading"
            className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:text-sm"
          >
            TeraBox Guides
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-muted-foreground sm:text-sm">
            Learn more about watching, downloading, sharing, and troubleshooting TeraBox links with TeraPlayer.
          </p>

          <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <li>
              <Link
                to="/terabox-video-downloader"
                className="flex items-center rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:text-sm"
              >
                TeraBox Video Downloader
              </Link>
            </li>
            <li>
              <Link
                to="/terabox-video-player"
                className="flex items-center rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:text-sm"
              >
                TeraBox Video Player
              </Link>
            </li>
            <li>
              <Link
                to="/how-to-download-terabox-videos"
                className="flex items-center rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:text-sm"
              >
                How to Download TeraBox Videos
              </Link>
            </li>
            <li>
              <Link
                to="/how-to-watch-terabox-videos"
                className="flex items-center rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:text-sm"
              >
                How to Watch TeraBox Videos
              </Link>
            </li>
            <li>
              <Link
                to="/terabox-video-link-not-working"
                className="flex items-center rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:text-sm"
              >
                TeraBox Link Troubleshooting
              </Link>
            </li>
            <li>
              <Link
                to="/how-to-download-terabox-folder"
                className="flex items-center rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:text-sm"
              >
                How to Download a TeraBox Folder
              </Link>
            </li>
            <li>
              <Link
                to="/terabox-zip-download"
                className="flex items-center rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:text-sm"
              >
                TeraBox ZIP Download
              </Link>
            </li>
            <li>
              <Link
                to="/terabox-public-link"
                className="flex items-center rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:text-sm"
              >
                TeraBox Public Link Guide
              </Link>
            </li>
            <li>
              <Link
                to="/terabox-download-mobile"
                className="flex items-center rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:text-sm"
              >
                TeraBox Download on Mobile
              </Link>
            </li>
            <li>
              <Link
                to="/terabox-download-pc"
                className="flex items-center rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:text-sm"
              >
                TeraBox Downloader for PC
              </Link>
            </li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-border/80 py-5 sm:py-8">
        <div className="tp-container flex flex-col items-center justify-between gap-2 text-center text-[10px] text-muted-foreground sm:flex-row sm:gap-3 sm:text-left sm:text-sm">
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="font-display text-sm font-semibold text-foreground sm:text-lg">
              Tera<span className="text-primary">Player</span>
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="text-[10px] sm:text-sm">Free to use — no account required</span>
          </div>            <div className="text-[9px] opacity-70 sm:text-sm">
            Only supports public TeraBox links<span className="hidden sm:inline">. Respect the original owners</span>.
          </div>
        </div>
      </footer>

      <PasswordDialog
        open={pwdDialog.open}
        incorrect={pwdDialog.incorrect}
        onOpenChange={(v) => setPwdDialog((prev) => ({ ...prev, open: v }))}
        url={pwdDialog.url}
        onSubmit={(pwd) => {
          setPwdDialog({ open: false, url: pwdDialog.url, incorrect: false });
          submit(pwdDialog.url, pwd);
        }}
      />
    </div>
  );
}

const FEATURES = [
  { icon: Zap, title: "Instant Preview", body: "Native + fallback extractors resolve links in under 2 seconds." },
  { icon: Cpu, title: "Beautiful Player", body: "Full keyboard controls, PIP, speed, and cinematic overlay." },
  { icon: Cloud, title: "Folder & ZIP", body: "Browse shared folders and grab everything as a single ZIP." },
  { icon: ShieldCheck, title: "Sign in optional", body: "Sign in with Google to save your preferences across devices." },
];

const FeaturesStrip = () => (<div className="mx-auto mt-8 w-full max-w-md px-5 grid grid-cols-1 gap-3 sm:mt-14 sm:max-w-5xl sm:px-0 sm:grid-cols-2 md:grid-cols-4">
  {FEATURES.map((f, i) => (
    <motion.div
      key={f.title}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.05 * i }}
      className="rounded-2xl border border-border bg-surface-raised p-4 transition-[border-color,box-shadow] duration-300 ease-out hover:border-primary/50 hover:brightness-110 sm:p-5"
    >
      <f.icon className="mb-2 h-4 w-4 text-primary sm:mb-3 sm:h-5 sm:w-5" strokeWidth={1.75} />
      <div className="text-xs font-semibold sm:text-sm">{f.title}</div>
      <div className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{f.body}</div>
    </motion.div>
  ))}
</div >
);

const LoadingSkeleton = () => (
  <div className="mx-auto mt-4 max-w-[650px] sm:mt-12">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
      <div className="md:col-span-7">
        <div className="aspect-video w-full animate-pulse rounded-2xl bg-secondary shimmer" />
      </div>
      <div className="space-y-3 md:col-span-5">
        <div className="h-5 w-1/2 animate-pulse rounded-full bg-secondary shimmer" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-secondary shimmer" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 animate-pulse rounded-xl bg-secondary shimmer" />
          <div className="h-16 animate-pulse rounded-xl bg-secondary shimmer" />
          <div className="h-16 animate-pulse rounded-xl bg-secondary shimmer" />
          <div className="h-16 animate-pulse rounded-xl bg-secondary shimmer" />
        </div>
        <div className="h-12 w-full animate-pulse rounded-xl bg-secondary shimmer" />
      </div>
    </div>
  </div>
);
