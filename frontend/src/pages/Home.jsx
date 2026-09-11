import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Seo from "../components/Seo";
import { useLang } from "../i18n/LanguageContext";
import {
  ShieldCheck,
  KeyRound,
  Puzzle,
  RefreshCw,
  ChevronLeft,
  Loader2,
  Play,
  HelpCircle,
  Info,
  Mail,
  TriangleAlert,
  Clapperboard,
  Rocket,
} from "lucide-react";

import Header from "../components/Header";
import Logo from "../components/Logo";
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
  const { t } = useLang();
  return (
    <div
      className="flex aspect-video w-full items-center justify-center rounded-2xl border border-border/60 bg-surface-overlay text-sm text-muted-foreground cursor-pointer"
      role="status"
      aria-live="polite"
      data-testid="video-player-fallback"
      onClick={() => window.location.reload(true)}
    >
      <span className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        {t("vp.fallback")}
      </span>
    </div>
  );
}

function FaqCard({ q, a }) {
  return (
    <li className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:bg-white/60">
      <h3 className="mb-3 flex items-start gap-3 text-lg font-bold text-slate-900">
        <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-600">?</span>
        {q}
      </h3>
      <p className="pl-9 text-sm leading-relaxed text-slate-600">{a}</p>
    </li>
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
  const { t, lang } = useLang();
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
            if (wasIncorrect) toast.error(t("toast.incorrectPw"));
            setPwdDialog({ open: true, url, incorrect: wasIncorrect });
          } else {
            track("core_extraction_failure");
            setErrorInfo(classifyPreviewError(null, data));
          }
        } else {
          track("core_extraction_success");
          track("result_viewed");
          toast.success(t("toast.linkResolved"));
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
      setExtStatus({ state: EXT_STATUS.CREATING, message: "extm.preparing" });
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
          toast.success(t("toast.linkResolvedBrowser"));
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
  // activation, never during extraction or on page load. Scroll on every
  // activation (no visibility guess): on Chrome Android `window.innerHeight`
  // shifts as the URL bar collapses, so a "fully visible" check can wrongly
  // skip. Wait two frames so the player has mounted and the browser has
  // painted it at its final size before scrolling.
  useEffect(() => {
    if (watching && !wasWatchingRef.current) {
      const el = playerAreaRef.current;
      if (el) {
        const header = document.querySelector('[data-testid="app-header"]');
        const headerH = header ? header.getBoundingClientRect().height : 0;
        el.style.scrollMarginTop = `${headerH + 12}px`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        });
      }
    }
    wasWatchingRef.current = watching;
  }, [watching]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(preview.sourceUrl);
      track("copy_link_clicked");
    } catch (e) {
      toast.error(t("toast.copyFail"));
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
        toast.success(t("toast.shareCopied"));
      }
    } catch {
      /* cancelled */
    }
  };

  const qualityOptions = useMemo(() => buildQualityOptions(preview), [preview]);
  const homeFaqs = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        q: t(`faq.f${i + 1}q`),
        a: t(`faq.f${i + 1}a`),
      })),
    [t]
  );
  const formatWords = useMemo(() => {
    const map = {
      hi: ["HD", "फ़ोल्डर", "ZIP"],
      id: ["HD", "folder", "ZIP"],
      bn: ["HD", "ফোল্ডার", "ZIP"],
      ur: ["HD", "فولڈرز", "ZIP"],
      ar: ["HD", "مجلدات", "ZIP"],
      ne: ["HD", "फोल्डरहरू", "ZIP"],
      es: ["HD", "carpetas", "ZIP"],
    };
    return map[lang] || ["HD", "folders", "ZIP"];
  }, [lang]);
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
        title="TeraPlayer — TeraBox Online Player & Downloader"
        description="TeraPlayer is a free TeraBox online player and downloader. Open TeraBox links, watch TeraBox videos online, and download supported files straight from your browser — no login."
        path="/"
        ogTitle="TeraPlayer — TeraBox Online Player & Downloader"
        ogDescription="Watch TeraBox videos online and download supported files with TeraPlayer — a free TeraBox online player and downloader. No login required."
        imageAlt="TeraPlayer - TeraBox Online Player & Downloader"
        twitterDescription="Watch TeraBox videos online and download supported files with TeraPlayer."
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: homeFaqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          })}
        </script>
      </Seo>
      <Header />

      <main id="main">
        {/* Hero — reference-style: glow, gradient headline, gray subhead, pill input. */}
        <div className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-full max-w-3xl -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-6 md:py-12">
            <div className="mb-12 w-full max-w-3xl text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1
                  id="hero-title"
                  className="text-2xl font-bold tracking-tight text-slate-900 drop-shadow-sm sm:mb-6 sm:text-4xl md:text-5xl"
                  data-testid="hero-title"
                >
                  <span className="text-gradient">{t("hero.titleA")}</span> {t("hero.titleB")}
                </h1>

                <p className="mx-auto mb-8 mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-lg">
                  {t("hero.sub1")}
                  <br />
                  {t("hero.sub2")}
                </p>
              </motion.div>

              <div className="mx-auto w-full max-w-2xl">
                <HeroInput
                  ref={heroInputRef}
                  onSubmit={submit}
                  loading={loading}
                  defaultValue={searchParams.get("url") || ""}
                />
              </div>

              {!loading && !preview && searchParams.get("url") ? (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => runBrowserExtraction(searchParams.get("url"))}
                    disabled={extRunning}
                    className="flex items-center gap-1.5 text-xs text-slate-400 transition-colors duration-200 hover:text-indigo-500"
                    data-testid="browser-extraction-link"
                  >
                    <Puzzle className="h-3.5 w-3.5" />
                    {t("hero.extract")}
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex justify-center">
                <Link
                  to="/help-center"
                  className="flex items-center gap-1.5 text-xs text-slate-400 transition-colors duration-200 hover:text-indigo-500"
                >
                    <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("hero.report")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

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
                <div className="font-semibold">{t("result.protected")}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("result.protectedBody")}
                </p>
                <Button
                  className="mt-3"
                  size="sm"
                  onClick={() => setPwdDialog({ open: true, url: preview.sourceUrl, incorrect: false })}
                  data-testid="open-password-btn"
                >
                  {t("result.enterPw")}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {!loading && preview && preview.ok && (
          <div className="mx-auto mb-6 max-w-[680px] space-y-4 px-2 sm:mb-10 sm:px-0">
            {activeFile && (
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={backToFolder}
                  data-testid="back-to-folder-btn"
                  className="text-xs"
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> {t("result.backFolder")}
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
                    ← {t("result.back")}
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
                      toast.error(t("toast.noStream"));
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

            <div className="flex flex-col items-center gap-2 pt-2">
              <Button
                variant="secondary"
                size="default"
                onClick={processAnother}
                data-testid="process-another-btn"
                className="h-11 w-full max-w-xs text-sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" /> {t("result.processAnother")}
              </Button>
              <p className="ds-body-sm text-center text-muted-foreground">
                {t("result.processedNote")}
              </p>
            </div>
          </div>
        )}

        {/* Intro paragraph — centered gray, like the reference. */}
        <section aria-label={t("explore.aboutTp")} className="mx-auto mt-8 max-w-3xl px-4 sm:px-6">
          <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-slate-500 sm:text-[15px]">
            {t("intro.body")}
          </p>
        </section>

        {/* Steps — bold slate heading, ringed number circles with connector. */}
<section
          aria-labelledby="steps-heading"
          className="mx-auto mt-24 w-full max-w-5xl px-4 sm:px-6"
        >
          <div className="mb-12 text-center">
          <h2
            id="steps-heading"
            className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl"
          >
            {t("steps.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-slate-600">
            {t("steps.sub")}
          </p>
          </div>
          <ol className="relative grid grid-cols-1 gap-8 sm:grid-cols-3">
            <span aria-hidden="true" className="absolute left-1/2 right-1/2 top-12 z-0 hidden h-[2px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent md:block" />
            <li className="relative z-10 flex flex-col items-center rounded-2xl p-4 text-center transition-colors duration-300 hover:bg-white/40">
              <span aria-hidden="true" className="ref-step-ring mb-4 flex h-14 w-14 items-center justify-center rounded-full !border-indigo-200 text-lg font-bold text-indigo-600 sm:h-16 sm:text-xl">1</span>
              <p className="text-sm font-medium text-slate-600">{t("steps.s1")}</p>
            </li>
            <li className="relative z-10 flex flex-col items-center rounded-2xl p-4 text-center transition-colors duration-300 hover:bg-white/40">
              <span aria-hidden="true" className="ref-step-ring mb-4 flex h-14 w-14 items-center justify-center rounded-full !border-purple-200 text-lg font-bold text-purple-600 sm:h-16 sm:text-xl">2</span>
              <p className="text-sm font-medium text-slate-600">{t("steps.s2")}</p>
            </li>
            <li className="relative z-10 flex flex-col items-center rounded-2xl p-4 text-center transition-colors duration-300 hover:bg-white/40">
              <span aria-hidden="true" className="ref-step-ring mb-4 flex h-14 w-14 items-center justify-center rounded-full !border-pink-200 text-lg font-bold text-pink-600 sm:h-16 sm:text-xl">3</span>
              <p className="text-sm font-medium text-slate-600">{t("steps.s3")}</p>
            </li>
          </ol>
        </section>

        <div aria-hidden="true" className="mx-auto my-20 h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* How it works — glass card, text + checks left, glow visual right. */}
        <section
          aria-labelledby="how-it-works-heading"
          className="mx-auto w-full max-w-4xl px-4 sm:px-6"
        >
          <div className="glass-panel overflow-hidden rounded-3xl p-8 shadow-sm transition-all duration-300 hover:shadow-md sm:p-10">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
              <div className="space-y-6 lg:col-span-7">
            <h2
              id="how-it-works-heading"
              className="text-2xl font-bold text-slate-900 sm:text-3xl"
            >
              {t("how.title")}
            </h2>
                <p className="text-base leading-relaxed text-slate-600">
                  {t("how.intro")}
                </p>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <li className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                    <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] text-indigo-600">✓</span>
                    <span>{t("how.b1")}</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                    <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] text-indigo-600">✓</span>
                    <span>{t("how.b2")}</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                    <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] text-indigo-600">✓</span>
                    <span>{t("how.b3")}</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                    <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] text-indigo-600">✓</span>
                    <span>{t("how.b4")}</span>
                  </li>
                </ul>
                <p className="pt-2 text-sm leading-relaxed text-slate-600">
                  {t("how.outro")}
                </p>
              </div>
              <figure className="flex flex-col items-center justify-center lg:col-span-5">
                <div className="group relative w-full max-w-sm lg:max-w-none">
                  <div aria-hidden="true" className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-lg transition duration-500 group-hover:opacity-50" />
                  <div className="ref-glow-visual relative flex aspect-[4/3] items-center justify-center rounded-2xl border border-white/60 bg-white/80 p-3 shadow-xl backdrop-blur-md">
                    <span className="flex h-24 w-24 items-center justify-center rounded-full bg-white/70 shadow-xl backdrop-blur">
                      <Play className="ml-1 h-10 w-10 fill-indigo-600 text-indigo-600" aria-hidden="true" />
                    </span>
                  </div>
                </div>
                <figcaption className="mt-3 text-center text-xs font-medium text-slate-400">
                  {t("how.caption")}
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* Feature cards — what this tool supports: player + formats. */}
        <section aria-label={t("section.featAria")} className="mx-auto mt-12 grid w-full max-w-4xl grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-2">
          <article className="glass-panel group flex flex-col justify-between rounded-3xl border-l-4 border-l-indigo-600 p-8 shadow-sm transition-all duration-300 hover:shadow-md">
            <div>
              <div className="ref-glow-visual relative mb-6 aspect-[16/10] flex items-center justify-center gap-4 overflow-hidden rounded-2xl border border-indigo-100/60 bg-indigo-50/50">
                <Clapperboard className="h-12 w-12 text-indigo-700 transition-transform duration-500 group-hover:scale-105" aria-hidden="true" />
                <Rocket className="h-10 w-10 text-violet-600 transition-transform duration-500 group-hover:scale-105" aria-hidden="true" />
                <Play className="h-14 w-14 fill-white text-white drop-shadow-lg transition-transform duration-500 group-hover:scale-105" aria-hidden="true" />
              </div>
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
                <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-indigo-600" />
                {t("feat1.title")}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                {t("feat1.body")}
              </p>
            </div>
          </article>
          <article className="glass-panel group flex flex-col justify-between rounded-3xl border-l-4 border-l-purple-600 p-8 shadow-sm transition-all duration-300 hover:shadow-md">
            <div>
              <div className="relative mb-6 flex aspect-[16/10] flex-wrap items-center justify-center gap-3 overflow-hidden rounded-2xl border border-purple-100/60 bg-purple-50/50 p-6">
                <span className="rounded-xl bg-white/80 px-3 py-1.5 text-xs font-extrabold text-indigo-700 shadow">HD</span>
                <span className="rounded-xl bg-white/80 px-3 py-1.5 text-xs font-extrabold text-violet-700 shadow">MP4</span>
                <span className="rounded-xl bg-white/80 px-3 py-1.5 text-xs font-extrabold text-pink-600 shadow">ZIP</span>
                <span className="rounded-xl bg-white/80 px-3 py-1.5 text-xs font-extrabold text-indigo-700 shadow">{formatWords[1]}</span>
              </div>
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
                <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-purple-600" />
                {t("feat2.title")}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                {t("feat2.a")} <strong>{formatWords[0]}</strong>{t("feat2.b")} <strong>{formatWords[1]}</strong>{t("feat2.c")} <strong>{formatWords[2]}</strong>{t("feat2.d")}
              </p>
            </div>
          </article>
        </section>

        {/* Why panel — indigo tint with note card. */}
        <section
          aria-labelledby="why-teraplayer-heading"
          className="mx-auto mt-12 w-full max-w-4xl px-4 sm:px-6"
        >
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-8 shadow-sm">
            <h2 id="why-teraplayer-heading" className="mb-6 text-center text-2xl font-bold text-slate-900">
              {t("why.title")}
            </h2>
            <p className="mb-8 text-center text-base leading-relaxed text-slate-600">
              {t("why.a")}{" "}
              <strong>{t("why.brand")}</strong> {t("why.b")}
            </p>
            <div className="rounded-2xl border border-indigo-100 bg-white/60 p-6 text-center backdrop-blur-sm">
              <p className="mx-auto max-w-2xl text-sm text-slate-500">
                <strong>{t("why.note")}</strong> {t("why.noteBody")}
              </p>
            </div>
          </div>
        </section>

        {/* FAQ — two-column ? cards like the reference, original TeraBox copy. */}
        <section
          aria-labelledby="faq-heading"
          className="mx-auto mt-24 w-full max-w-4xl px-4 sm:px-6"
        >
          <div className="mb-10 text-center">
          <h2 id="faq-heading" className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">
            {t("faq.title")}
          </h2>
          <p className="text-slate-600">
            {t("faq.sub")}
          </p>
          </div>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2" data-testid="faq-grid">
            {homeFaqs.map((item) => (
              <FaqCard key={item.q} q={item.q} a={item.a} />
            ))}
          </ul>
        </section>

        {/* Compliance — dark slate panel, original TeraPlayer wording. */}
        <section
          aria-labelledby="compliance-heading"
          className="mx-auto mt-12 w-full max-w-4xl px-4 sm:px-6"
        >
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-xl" data-testid="compliance-panel">
            <div aria-hidden="true" className="absolute right-0 top-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />
            <h2 id="compliance-heading" className="mb-4 flex items-center gap-2 text-2xl font-bold">
              <ShieldCheck className="h-6 w-6 text-indigo-400" aria-hidden="true" />
              {t("comp.title")}
            </h2>
            <p className="text-sm leading-relaxed text-slate-300">
              {t("comp.bodyA")}{" "}
              <Link to="/contact" className="font-semibold text-indigo-300 hover:text-indigo-200 hover:underline">{t("comp.contact")}</Link>.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="terabox-guides-heading"
          className="mx-auto mb-24 mt-24 w-full max-w-4xl px-4 sm:px-6"
        >
          <div className="mb-10 text-center">
            <h2
              id="terabox-guides-heading"
              className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl"
            >
              {t("explore.title")}
            </h2>
            <p className="mx-auto max-w-2xl text-slate-600">
              {t("explore.sub")}
            </p>
          </div>

          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <li>
              <Link
                to="/help-center"
                className="ds-guide-link text-muted-foreground"
              >
                <HelpCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{t("explore.help")}</span>
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className="ds-guide-link text-muted-foreground"
              >
                <Info className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{t("nav.about")}</span>
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="ds-guide-link text-muted-foreground"
              >
                <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{t("explore.contact")}</span>
              </Link>
            </li>
          </ul>
        </section>
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white py-6 sm:py-8 md:mt-24">
        <div className="ds-container">
          <div className="flex flex-col items-center justify-between gap-3 text-center text-xs text-slate-400 sm:flex-row sm:text-left sm:text-sm">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Logo />
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className="text-xs sm:text-sm">{t("homefoot.tag")}</span>
            </div>
            <div className="text-xs sm:text-sm">
              {t("homefoot.note")}<span className="hidden sm:inline">{t("homefoot.noteExt")}</span>.
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
