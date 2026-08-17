import { useEffect, useCallback, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Seo from "../components/Seo";
import {
  Download,
  FolderOpen,
  Archive,
  ShieldCheck,
  Zap,
  Smartphone,
  ChevronRight,
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

import { postPreview, streamProxyUrl } from "../services/api";
import { runExtensionExtraction, EXT_STATUS } from "../services/extension";

const faqItems = [
  {
    q: "What is a TeraBox video downloader?",
    a: "A TeraBox video downloader is a tool that lets you save video files from public TeraBox share links directly to your device—without installing the TeraBox app or creating an account.",
  },
  {
    q: "How do I download a TeraBox video?",
    a: "Copy a public TeraBox share link, paste it into TeraPlayer's input field, and click Watch Now. Once the preview loads, select your preferred quality (where available) and click the Download button.",
  },
  {
    q: "Do I need a TeraPlayer account?",
    a: "No. TeraPlayer works entirely in your browser. You can preview, watch, and download from public TeraBox links without signing in.",
  },
  {
    q: "Can I watch a video before downloading it?",
    a: "Yes. After pasting a TeraBox link, TeraPlayer shows a preview with a built-in player so you can stream the video before choosing to download.",
  },
  {
    q: "Can I download TeraBox folders?",
    a: "Yes. When a TeraBox share contains multiple files, TeraPlayer detects the folder structure and lets you browse it. You can select multiple files and download them all as a single ZIP archive.",
  },
  {
    q: "Can I use TeraPlayer on mobile?",
    a: "Yes. TeraPlayer is built with a responsive, mobile-friendly interface that works in any modern mobile browser—no app install required.",
  },
  {
    q: "Does TeraPlayer work with every TeraBox link?",
    a: "TeraPlayer supports public TeraBox share links from supported domains. Some links may be expired, private, or restricted by the content owner and cannot be accessed.",
  },
];

function buildQualityOptions(preview) {
  if (!preview?.files || preview.files.length < 2) return [];
  const videoFiles = preview.files.filter(
    (f) => (f.file_type === "video" || !f.file_type) && (f.stream_url || f.download_url)
  );
  if (videoFiles.length < 2) return [];
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

export default function TeraBoxVideoDownloader() {
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
        console.error(e?.message || "Request failed");
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

  const qualityOptions = preview ? buildQualityOptions(preview) : [];
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

  const faqSchema = faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  }));

  return (
    <div className="App noise min-h-screen">
      <Seo
        title="TeraBox Downloader — Download Videos & Files | TeraPlayer"
        description="Download supported TeraBox videos and files online with TeraPlayer — a free TeraBox online downloader. Paste a public TeraBox link to preview, watch, and download in your preferred quality — no app, no login."
        path="/terabox-video-downloader"
        ogTitle="TeraBox Downloader — Download Videos & Files | TeraPlayer"
        ogDescription="Download supported TeraBox videos and files online with TeraPlayer. Preview and download videos directly from your browser."
        imageAlt="TeraBox Downloader - TeraPlayer"
        twitterDescription="Download supported TeraBox videos and files online with TeraPlayer's TeraBox online downloader."
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "TeraPlayer",
            url: "https://www.teraplayer.in/terabox-video-downloader",
            applicationCategory: "MultimediaApplication",
            operatingSystem: "All",
            browserRequirements: "Requires JavaScript",
            description: "Download supported TeraBox videos online with TeraPlayer.",
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqSchema,
          })}
        </script>
      </Seo>

      <Header />

      <main id="main" className="tp-container">
        {/* HERO */}
        <section className="relative flex min-h-[calc(100vh-3rem)] flex-col items-center justify-start pt-12 pb-4 md:min-h-[calc(100vh-4rem)] md:pt-16 md:pb-6">
          <div className="mx-auto w-full max-w-3xl px-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:mb-4 sm:px-3 sm:py-1 sm:text-xs">
                <Download className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Free • No login • No app</span>
                <span className="sm:hidden">Free • No login</span>
              </div>

              <h1
                className="font-display font-black leading-[0.95] tracking-tighter sm:leading-[0.9]"
                style={{ fontSize: "clamp(2.25rem, 7vw, 5rem)" }}
                data-testid="hero-title"
              >
                <span className="text-primary">TeraBox</span> Video Downloader
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Download supported TeraBox videos directly from your browser. Paste a public TeraBox link, preview the content, and download in your preferred quality.
              </p>
              <p className="mx-auto mt-2 max-w-2xl text-xs text-muted-foreground italic sm:text-sm">
                Works with public share links. Password-protected links are also supported.
              </p>
            </motion.div>

            <div className="mt-8">
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

            {!preview && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-2 text-center"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1 text-[10px] text-muted-foreground sm:text-xs">
                  <Zap className="h-3 w-3 text-primary" />
                  HD &amp; 4K when available
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1 text-[10px] text-muted-foreground sm:text-xs">
                  <FolderOpen className="h-3 w-3 text-primary" />
                  Folder support
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1 text-[10px] text-muted-foreground sm:text-xs">
                  <Archive className="h-3 w-3 text-primary" />
                  ZIP downloads
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1 text-[10px] text-muted-foreground sm:text-xs">
                  <ShieldCheck className="h-3 w-3 text-primary" />
                  No login required
                </span>
              </motion.div>
            )}
          </div>
        </section>

        {/* RESULTS / PREVIEW */}
        {extStatus && (
          <div className="tp-container pb-2">
            <div className="mx-auto max-w-3xl px-5">
              <ExtensionStatus
                status={extStatus.state}
                message={extStatus.message}
                onRetry={retryBrowserExtraction}
                retrying={extRetrying}
              />
            </div>
          </div>
        )}

        {preview && preview.ok === false && !preview.password_required && (
          <div className="tp-container pb-4">
            <div className="mx-auto max-w-3xl px-5 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-destructive sm:p-6">
              <div className="flex items-start gap-3">
                <Puzzle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <div className="font-semibold">We couldn't extract this link</div>
                  <p className="mt-1 text-sm opacity-90">
                    {preview.error ||
                      "The link may be private, expired, or the extractor mirrors are temporarily unavailable."}
                  </p>
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      runBrowserExtraction(preview.sourceUrl || searchParams.get("url") || "")
                    }
                    disabled={extRunning}
                    data-testid="extract-with-browser-btn"
                  >
                    <Puzzle className="mr-1.5 h-4 w-4" />
                    Extract with Browser
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {preview && (
          <motion.section
            id="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="tp-container pb-6"
          >
            <div className="mx-auto max-w-3xl px-5">
              <PreviewCard
                data={preview}
                onWatch={() => setWatching(true)}
                onDownload={() => setDownloading(true)}
                onPlayFolderFile={openFolderFile}
                isDownloading={downloading}
                isWatching={watching}
                qualityOptions={qualityOptions}
                selectedQualityId={selectedQualityId}
                onSelectQuality={setSelectedQualityId}
                showQualityPicker={!!watching}
                streamProxyUrl={streamViaProxy}
                isFolder={isFolder}
                copyLink={copyLink}
                share={share}
              />

              {watching && isFolder && activeFile?.file_type === "video" && (
                <div className="mt-4">
                  <QualityPicker
                    options={qualityOptions}
                    selectedId={selectedQualityId}
                    onChange={setSelectedQualityId}
                  />
                </div>
              )}

              {watching && (
                <div className="mt-4">
                  <VideoPlayer
                    src={streamViaProxy}
                    poster={preview.cover_url || preview.thumbnail}
                    title={preview.title}
                    qualityOptions={qualityOptions}
                    selectedQualityId={selectedQualityId}
                    onSelectQuality={setSelectedQualityId}
                  />
                </div>
              )}

              {(downloading || (watching && !isFolder)) && (
                <div className="mt-4">
                  <DownloadPanel
                    file={currentFile}
                    preview={preview}
                    onDone={() => setDownloading(false)}
                  />
                </div>
              )}

              {watching && isFolder && (
                <div className="mt-4">
                  <FolderBrowser
                    files={preview.files}
                    folderName={preview.title}
                    onPlayFile={openFolderFile}
                  />
                </div>
              )}

              {watching && isFolder && (
                <DownloadPanel
                  file={null}
                  preview={preview}
                  isFolderDownload
                  onDone={() => setWatching(false)}
                />
              )}
            </div>
          </motion.section>
        )}

        {/* HOW IT WORKS */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="border-t border-border/40 tp-container py-14"
        >
          <div className="mx-auto max-w-3xl px-5">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              How to download <span className="text-primary">TeraBox videos</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Getting your videos is a three-step process:
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="rounded-2xl border border-border bg-surface-raised p-6 text-center"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <span className="flex h-10 w-10 items-center justify-center text-xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-sm font-semibold">Copy your link</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Copy any public TeraBox share link from the app or website.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl border border-border bg-surface-raised p-6 text-center"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <span className="flex h-10 w-10 items-center justify-center text-xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-sm font-semibold">Paste &amp; resolve</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Paste the link above and TeraPlayer resolves the preview instantly.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="rounded-2xl border border-border bg-surface-raised p-6 text-center"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <span className="flex h-10 w-10 items-center justify-center text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-sm font-semibold">Download</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Choose your quality and start the download.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* FEATURES */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="border-y border-border/40 tp-container py-14"
        >
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mx-auto mb-10 max-w-2xl text-center"
            >
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                Built for <span className="text-primary">downloading</span>
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                Tools and features designed around the download workflow.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Zap,
                  title: "Instant Preview",
                  body: "Get thumbnail, title, and file size in under two seconds.",
                },
                {
                  icon: Download,
                  title: "Quality Selection",
                  body: "Download in 240p up to 4K when multiple versions are available.",
                },
                {
                  icon: Archive,
                  title: "ZIP Downloads",
                  body: "Select multiple files from a folder and download them as one ZIP archive.",
                },
                {
                  icon: FolderOpen,
                  title: "Folder Browsing",
                  body: "Navigate shared folders with breadcrumbs and in-folder search.",
                },
                {
                  icon: ShieldCheck,
                  title: "No Login Required",
                  body: "Use the downloader without an account. Works entirely in your browser.",
                },
                {
                  icon: Smartphone,
                  title: "Mobile-Friendly",
                  body: "Download directly on your phone or tablet — no app install needed.",
                },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                  className="group rounded-2xl border border-border bg-surface-raised p-5 transition-[border-color,box-shadow,brightness] duration-300 ease-out hover:border-primary/40 hover:shadow-primary/5"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="tp-container py-14"
        >
          <div className="mx-auto max-w-3xl px-5">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Answers to common questions about downloading TeraBox videos.
            </p>

            <div className="mt-8 space-y-3">
              {faqItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                  className="rounded-2xl border border-border bg-surface-raised p-4"
                >
                  <h3 className="flex items-start gap-3 text-sm font-semibold">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item.q}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {item.a}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* CROSS-LINK */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="border-t border-border/40 tp-container py-10"
        >
          <div className="mx-auto max-w-3xl px-5 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block rounded-full border border-border bg-surface-raised px-4 py-1.5 text-xs font-medium text-muted-foreground"
            >
              <Smartphone className="inline h-3 w-3 text-primary" /> Looking to stream instead?
            </motion.div>
            <p className="mt-2 text-sm text-muted-foreground">
              Prefer to watch TeraBox videos online rather than download them?
            </p>
            <Button asChild className="mt-3 h-9 px-6 text-sm">
              <Link to="/terabox-video-player">TeraBox video player</Link>
            </Button>
          </div>
        </motion.section>
      </main>

      <footer className="border-t border-border/40 bg-surface-raised/50">
        <div className="tp-container py-6">
          <div className="mx-auto max-w-4xl text-center text-xs text-muted-foreground">
            <p>
              <span className="font-display text-sm font-semibold text-foreground">
                Tera<span className="text-primary">Player</span>
              </span>
              <span className="mx-1">·</span>
              Free to use — no account required
              <span className="mx-1">·</span>
              Only supports public TeraBox links. Respect the original owners.
            </p>
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
