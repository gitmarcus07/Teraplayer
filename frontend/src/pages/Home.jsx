import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Seo from "../components/Seo";
import {
  Sparkles,
  ShieldCheck,
  KeyRound,
  Film,
  FolderOpen,
  Puzzle,
  RefreshCw,
  ChevronLeft,
  Loader2,
} from "lucide-react";

import Header from "../components/Header";
import { FooterLegalLinks } from "../components/Footer";
import HeroInput from "../components/HeroInput";
import PreviewCard from "../components/PreviewCard";
import PasswordDialog from "../components/PasswordDialog";
import QualityPicker from "../components/QualityPicker";
import FolderBrowser from "../components/FolderBrowser";
import ExtensionStatus from "../components/ExtensionStatus";
import ExtractionStatus from "../components/ExtractionStatus";
import ExtractionError from "../components/ExtractionError";
import { Button } from "../components/ui/button";

import {
  postPreview,
  streamProxyUrl,
  isRequestCancelled,
} from "../services/api";
import { runExtensionExtraction, EXT_STATUS } from "../services/extension";
import { classifyPreviewError } from "../utils/errorHandling";
import { track } from "../lib/analytics";

// VideoPlayer pulls in hls.js, so it is split out and loaded only when a user
// actually starts watching. Everything above the fold stays in the main chunk.
const VideoPlayer = lazy(() => import("../components/VideoPlayer"));

function PlayerFallback() {
  return (
    <div
      className="flex aspect-video w-full items-center justify-center rounded-2xl border border-border/60 bg-surface-overlay text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
      data-testid="video-player-fallback"
    >
      <span className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Preparing player…
      </span>
    </div>
  );
}

// Detect if the file collection looks like alternate resolutions of the same asset.
function buildQualityOptions(preview) {
  if (!Array.isArray(preview?.files) || preview.files.length < 2) return [];
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
  const [errorInfo, setErrorInfo] = useState(null);
  const [watching, setWatching] = useState(false);
  const [pwdDialog, setPwdDialog] = useState({ open: false, url: "", incorrect: false });
  const [selectedQualityId, setSelectedQualityId] = useState("");
  const [activeFile, setActiveFile] = useState(null);
  const [extStatus, setExtStatus] = useState(null);
  const [extRunning, setExtRunning] = useState(false);
  const [extRetrying, setExtRetrying] = useState(false);
  const extLastRef = useRef(null);
  const submittedUrlRef = useRef(null);
  const submittingRef = useRef(false);
  const extAbortRef = useRef(null);
  const previewAbortRef = useRef(null);
  const requestIdRef = useRef(0);
  const heroInputRef = useRef(null);
  const folderBrowserRef = useRef(null);
  const playerAreaRef = useRef(null);
  const wasWatchingRef = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const submit = useCallback(
    async (url, password = "") => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      const gen = ++requestIdRef.current;
      submittedUrlRef.current = url;

      // Cancel any in-flight preview so the newest submission always wins and
      // a slow/late response can never overwrite a newer result.
      previewAbortRef.current?.abort();
      const controller = new AbortController();
      previewAbortRef.current = controller;

      setLoading(true);
      setPreview(null);
      setErrorInfo(null);
      setWatching(false);
      setActiveFile(null);
      setSelectedQualityId("");
      track("core_url_submitted");
      try {
        const data = await postPreview(url, password, { signal: controller.signal });
        if (gen !== requestIdRef.current) return;

        // Defensive: never let a malformed payload crash the result UI.
        if (data === null || data === undefined || typeof data !== "object" || Array.isArray(data)) {
          track("core_extraction_failure");
          setErrorInfo(classifyPreviewError(null, data));
          return;
        }

        const enriched = { ...data, sourceUrl: url, usedPassword: password };
        setPreview(enriched);
        if (!data.ok) {
          if (data.password_required) {
            const wasIncorrect = !!data.password_incorrect;
            if (wasIncorrect) toast.error("Incorrect password. Please try again.");
            setPwdDialog({ open: true, url, incorrect: wasIncorrect });
          } else {
            track("core_extraction_failure");
            setErrorInfo(classifyPreviewError(null, data));
          }
        } else {
          track("core_extraction_success");
          track("result_viewed");
          toast.success("Link resolved");
        }
        setSearchParams({ url });
      } catch (e) {
        // User-initiated cancellation or a superseded request is not an error.
        if (gen !== requestIdRef.current || isRequestCancelled(e)) return;
        if (e.code === "ECONNABORTED") {
          track("request_timeout", { operation: "preview" });
        } else if (!e.response) {
          track("network_error", { operation: "preview" });
        }
        console.error(e.message);
        track("core_extraction_failure");
        setErrorInfo(classifyPreviewError(e, null));
      } finally {
        // Only the newest request may release the loading state / submit guard.
        if (gen === requestIdRef.current) {
          setLoading(false);
          submittingRef.current = false;
        }
      }
    },
    [setSearchParams]
  );

  const retry = useCallback(() => {
    const last = submittedUrlRef.current;
    if (!last || submittingRef.current) return;
    track("core_retry");
    submit(last);
  }, [submit]);

  const runBrowserExtraction = useCallback(
    async (url, password = "") => {
      if (!url) return;
      const gen = ++requestIdRef.current;
      extLastRef.current = { url, password };
      submittingRef.current = false;
      setLoading(false);
      setPreview(null);
      setErrorInfo(null);
      setWatching(false);
      setActiveFile(null);
      setSelectedQualityId("");
      setExtRetrying(false);
      setExtRunning(true);
      setExtStatus({ state: EXT_STATUS.CREATING, message: "Preparing browser extraction…" });
      setSearchParams({ url });

      // Let the browser-extraction poll loop be cancelled if the user navigates
      // away or processes another link, so it never keeps polling in the background.
      const controller = new AbortController();
      extAbortRef.current?.abort();
      extAbortRef.current = controller;

      const res = await runExtensionExtraction({
        url,
        password,
        signal: controller.signal,
        onStatus: (state, message) => {
          if (gen === requestIdRef.current) setExtStatus({ state, message });
        },
      });

      // A newer submission / process-another has superseded this one.
      if (gen !== requestIdRef.current) return;

      if (res.status === EXT_STATUS.DONE && res.preview) {
        const enriched = { ...res.preview, sourceUrl: url, usedPassword: password };
        setPreview(enriched);
        setExtStatus(null);
        if (res.preview.ok) {
          track("core_extraction_success");
          track("result_viewed");
          toast.success("Link resolved via browser");
        } else if (res.preview.password_required) {
          setPwdDialog({
            open: true,
            url,
            incorrect: !!res.preview.password_incorrect,
          });
        } else {
          track("core_extraction_failure");
          setErrorInfo(classifyPreviewError(null, res.preview));
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

  // Stop any in-flight browser-extraction polling / preview request when Home
  // unmounts, so nothing keeps running in the background after navigation.
  useEffect(() => () => {
    extAbortRef.current?.abort();
    previewAbortRef.current?.abort();
  }, []);

  // When Watch Now (or a folder video) activates the player, scroll it into
  // view so it sits fully below the sticky header — exactly once per
  // activation, never during extraction or on page load.
  useEffect(() => {
    if (watching && !wasWatchingRef.current && playerAreaRef.current) {
      const el = playerAreaRef.current;
      const rect = el.getBoundingClientRect();
      const header = document.querySelector('[data-testid="app-header"]');
      const headerH = header ? header.getBoundingClientRect().height : 0;
      const fullyVisible = rect.top >= headerH && rect.bottom <= window.innerHeight;
      if (!fullyVisible) {
        el.style.scrollMarginTop = `${headerH + 12}px`;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    wasWatchingRef.current = watching;
  }, [watching]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(preview.sourceUrl);
      track("copy_link_clicked");
    } catch (e) {
      toast.error("Could not copy link");
      throw e;
    }
  };

  const share = async () => {
    const shareUrl = `${window.location.origin}/?url=${encodeURIComponent(preview.sourceUrl)}`;
    try {
      if (navigator.share) await navigator.share({ title: preview.title, url: shareUrl });
      else {
        await navigator.clipboard.writeText(shareUrl);
        track("share_fallback_used");
        toast.success("Shareable link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  const qualityOptions = useMemo(() => buildQualityOptions(preview), [preview]);
  const isFolder = preview?.ok && Array.isArray(preview?.files) && preview.files.length > 1 && qualityOptions.length === 0;

  const selectedQuality = qualityOptions.find((q) => q.id === selectedQualityId) || qualityOptions[0];

  const currentFile = activeFile || selectedQuality?.file || preview;
  const streamUrl = currentFile?.stream_url || currentFile?.download_url;
  const streamViaProxy = streamUrl ? streamProxyUrl(streamUrl) : null;

  const openFolderFile = (file) => {
    setActiveFile(file);
    setWatching(file.file_type === "video");
  };

  const handleQualityChange = useCallback(
    (id) => {
      setSelectedQualityId(id);
      setActiveFile(null);
      const opt = qualityOptions.find((q) => q.id === id);
      track("quality_selected", opt ? { quality: opt.label } : {});
      track("quality_changed", opt ? { quality: opt.label } : {});
    },
    [qualityOptions]
  );

  // If the selected quality disappears (e.g. a re-extracted preview), fall back
  // to the first available option instead of holding a stale selection.
  useEffect(() => {
    if (qualityOptions.length === 0) {
      setSelectedQualityId("");
      return;
    }
    if (selectedQualityId && !qualityOptions.some((q) => q.id === selectedQualityId)) {
      setSelectedQualityId(qualityOptions[0].id);
    }
  }, [qualityOptions, selectedQualityId]);

  const openFolder = useCallback(() => {
    folderBrowserRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const backToFolder = useCallback(() => {
    setActiveFile(null);
    setSelectedQualityId("");
    setWatching(false);
  }, []);

  const processAnother = useCallback(() => {
    track("process_another_clicked");
    // Supersede any in-flight extraction (native or browser) so its late
    // response can never repaint the screen after the reset.
    requestIdRef.current += 1;
    previewAbortRef.current?.abort();
    extAbortRef.current?.abort();
    submittingRef.current = false;
    setLoading(false);
    setPreview(null);
    setErrorInfo(null);
    setWatching(false);
    setActiveFile(null);
    setSelectedQualityId("");
    setExtStatus(null);
    setExtRunning(false);
    setExtRetrying(false);
    setPwdDialog({ open: false, url: "", incorrect: false });
    submittedUrlRef.current = null;
    extLastRef.current = null;
    setSearchParams({});
    heroInputRef.current?.focus();
  }, [setSearchParams]);

  return (
    <div className="App noise min-h-screen">
      <Seo
        title="TeraPlayer | TeraBox Video Downloader, Player & Streaming"
        description="Watch, stream and download TeraBox videos online for free with TeraPlayer. Fast HD streaming, folder support, ZIP downloads and no login required."
        path="/"
        ogTitle="TeraPlayer - Watch & Download TeraBox Videos"
        ogDescription="Watch, stream and download TeraBox videos instantly with TeraPlayer. Fast HD streaming and folder support."
        imageAlt="TeraPlayer - Watch & Download TeraBox Videos Free"
        twitterDescription="Watch, stream and download TeraBox videos instantly with TeraPlayer."
      />
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
                ref={heroInputRef}
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

        {loading && <ExtractionStatus />}

        {extStatus && (
          <ExtensionStatus
            status={extStatus.state}
            message={extStatus.message}
            onRetry={retryBrowserExtraction}
            retrying={extRetrying}
          />
        )}

        {!loading && errorInfo && !(preview && preview.password_required) && (
          <ExtractionError
            error={errorInfo}
            onRetry={retry}
            onCheckLink={() => heroInputRef.current?.focus()}
            onProcessAnother={processAnother}
          />
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
            {activeFile && (
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={backToFolder}
                  data-testid="back-to-folder-btn"
                  className="text-xs"
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Back to folder
                </Button>
              </div>
            )}

            {watching && streamViaProxy ? (
              <motion.div
                ref={playerAreaRef}
                key="player"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3"
              >
                <Suspense fallback={<PlayerFallback />}>
                  <VideoPlayer
                    src={streamViaProxy}
                    poster={currentFile?.thumbnail || preview.thumbnail}
                    title={currentFile?.name || preview.title}
                    autoPlay
                    onDownloadInstead={() => setWatching(false)}
                    onProcessAnother={processAnother}
                    onRefreshSource={() => {
                      if (preview?.sourceUrl) submit(preview.sourceUrl);
                    }}
                  />
                </Suspense>
                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                  <Button variant="outline" size="sm" onClick={() => setWatching(false)} data-testid="close-player-btn">
                    ← Back
                  </Button>
                  <QualityPicker
                    options={qualityOptions}
                    value={selectedQuality?.id || ""}
                    onChange={handleQualityChange}
                  />
                </div>
              </motion.div>
            ) : (
              <div className="md:mx-auto md:max-w-[470px]">
                <PreviewCard
                  data={{ ...preview, ...(activeFile || selectedQuality?.file || {}) }}
                  onOpenFolder={openFolder}
                  onWatch={() => {
                    if (!streamViaProxy) {
                      toast.error("No stream URL available");
                      return;
                    }
                    track("core_watch_clicked");
                    setWatching(true);
                  }}
                  onDownload={() => track("core_download_clicked")}
                  onCopy={copyLink}
                  onShare={share}
                  downloadUrl={streamViaProxy}
                  downloadFilename={currentFile?.name || preview.title}
                  downloadSize={currentFile?.size || preview.size || 0}
                />
              </div>
            )}

            {qualityOptions.length > 1 && !watching && (
              <div className="flex items-center justify-end">
                <QualityPicker
                  options={qualityOptions}
                  value={selectedQuality?.id || ""}
                  onChange={handleQualityChange}
                />
              </div>
            )}

            {isFolder && (
              <div ref={folderBrowserRef} className="scroll-mt-4">
                <FolderBrowser
                  files={preview.files}
                  folderName={preview.title}
                  onPlayFile={openFolderFile}
                  activeIdx={activeFile?._idx}
                />
              </div>
            )}

            <div className="flex flex-col items-center gap-2 pt-1">
              <Button
                variant="secondary"
                size="default"
                onClick={processAnother}
                data-testid="process-another-btn"
                className="h-11 w-full max-w-xs text-sm sm:text-sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Process another link
              </Button>
              <p className="text-center text-[11px] text-muted-foreground sm:text-xs">
                Your link is processed to retrieve the requested content. No account required.
              </p>
            </div>
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
        <div className="tp-container">
          <div className="flex flex-col items-center justify-between gap-2 text-center text-[10px] text-muted-foreground sm:flex-row sm:gap-3 sm:text-left sm:text-sm">
            <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-2">
              <span className="font-display text-sm font-semibold text-foreground sm:text-lg">
                Tera<span className="text-primary">Player</span>
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="text-[10px] sm:text-sm">Free to use — no account required</span>
            </div>
            <div className="text-[9px] opacity-70 sm:text-sm">
              Only supports public TeraBox links<span className="hidden sm:inline">. Respect the original owners</span>.
            </div>
          </div>
          <FooterLegalLinks />
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
