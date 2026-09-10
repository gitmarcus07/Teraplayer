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
  Puzzle,
  KeyRound,
  Check,
  X,
  Minus,
  Monitor,
  Cpu,
} from "lucide-react";

import Header from "../components/Header";
import FaqCards from "../components/FaqCards";
import { useLang } from "../i18n/LanguageContext";
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
import { safePreviewError } from "../utils/errorHandling";

const faqItems = [
  { qk: "d.q1", ak: "d.a1" },
  { qk: "d.q2", ak: "d.a2" },
  { qk: "d.q3", ak: "d.a3" },
  { qk: "d.q4", ak: "d.a4" },
  { qk: "d.q5", ak: "d.a5" },
  { qk: "d.q6", ak: "d.a6" },
  { qk: "d.q7", ak: "d.a7" },
  { qk: "d.q8", ak: "d.a8" },
  { qk: "d.q9", ak: "d.a9" },
  { qk: "d.q10", ak: "d.a10" },
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
  const { t } = useLang();
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
            if (wasIncorrect) toast.error(t("toast.incorrectPw"));
            setPwdDialog({ open: true, url, incorrect: wasIncorrect });
          } else {
            toast.error(safePreviewError(data.error, false, t).title);
          }
        } else {
          toast.success(t("toast.linkResolved"));
        }
        setSearchParams({ url });
      } catch (e) {
        console.error(e?.message || "Request failed");
        toast.error(t("toast.netErr"));
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
      setExtStatus({ state: EXT_STATUS.CREATING, message: "extm.preparing" });
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
          toast.success(t("toast.linkResolvedBrowser"));
        } else if (res.preview.password_required) {
          setPwdDialog({
            open: true,
            url,
            incorrect: !!res.preview.password_incorrect,
          });
        } else {
          toast.error(safePreviewError(res.preview.error, false, t).title);
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
      toast.success(t("toast.linkCopied"));
    } catch {
      toast.error(t("toast.copyFail"));
    }
  };

  const share = async () => {
    const shareUrl = `${window.location.origin}/?url=${encodeURIComponent(preview.sourceUrl)}`;
    try {
      if (navigator.share) await navigator.share({ title: preview.title, url: shareUrl });
      else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t("toast.shareCopied"));
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
    name: t(item.qk),
    acceptedAnswer: { "@type": "Answer", text: t(item.ak) },
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
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How to Download a TeraBox Video",
            description: "Save a supported public TeraBox video to your device with TeraPlayer.",
            step: [
              { "@type": "HowToStep", position: 1, name: t("d.s1t"), text: t("d.s1d") },
              { "@type": "HowToStep", position: 2, name: t("d.s2t"), text: t("d.s2d") },
              { "@type": "HowToStep", position: 3, name: t("d.s3t"), text: t("d.s3d") },
            ],
          })}
        </script>
      </Seo>

      <Header />

      <main id="main" className="tp-container">
        {/* HERO */}
        <section className="relative flex min-h-[calc(100vh-3rem)] flex-col items-center justify-start pt-12 pb-4 md:min-h-[calc(100vh-4rem)] md:pt-16 md:pb-6">
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-full max-w-3xl -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="relative mx-auto w-full max-w-3xl px-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:mb-4 sm:px-3 sm:py-1 sm:text-xs">
                <Download className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">{t("d.eyebrow")}</span>
                <span className="sm:hidden">{t("d.eyebrowSm")}</span>
              </div>

              <h1
                className="font-display font-black leading-[0.95] tracking-tighter sm:leading-[0.9]"
                style={{ fontSize: "clamp(2.25rem, 7vw, 5rem)" }}
                data-testid="hero-title"
              >
                <span className="text-primary">TeraBox</span> {t("d.titleB")}
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-sm text-muted-foreground sm:text-base">
                {t("d.sub")}
              </p>
              <p className="mx-auto mt-2 max-w-2xl text-xs text-muted-foreground italic sm:text-sm">
                {t("d.subNote")}
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
                  {t("d.extract")}
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
                  {t("d.chip1")}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1 text-[10px] text-muted-foreground sm:text-xs">
                  <FolderOpen className="h-3 w-3 text-primary" />
                  {t("d.chip2")}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1 text-[10px] text-muted-foreground sm:text-xs">
                  <Archive className="h-3 w-3 text-primary" />
                  {t("d.chip3")}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1 text-[10px] text-muted-foreground sm:text-xs">
                  <ShieldCheck className="h-3 w-3 text-primary" />
                  {t("d.chip4")}
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
                  <div className="font-semibold">{t("d.extractFailT")}</div>
                  <p className="mt-1 text-sm opacity-90">
                    {safePreviewError(preview.error, false, t).description}
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
                    {t("d.extractBtn")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {preview && preview.ok === false && preview.password_required && (
          <div className="tp-container pb-4">
            <div
              className="mx-auto max-w-3xl px-5 rounded-2xl border border-primary/40 bg-primary/5 p-4 sm:p-6"
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
                    onClick={() =>
                      setPwdDialog({
                        open: true,
                        url: preview.sourceUrl || searchParams.get("url") || "",
                        incorrect: false,
                      })
                    }
                    data-testid="open-password-btn"
                  >
                    {t("result.enterPw")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {preview && preview.ok && (
          <motion.section
            id="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="tp-container pb-6"
          >
            <div className="mx-auto max-w-3xl px-5">
              {watching && streamViaProxy ? (
                <motion.div
                  key="player"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-3"
                >
                  <VideoPlayer
                    src={streamViaProxy}
                    poster={currentFile?.thumbnail || preview.thumbnail}
                    title={currentFile?.name || preview.title}
                    autoPlay
                    onDownloadInstead={() => setWatching(false)}
                    onRefreshSource={() => {
                      if (preview?.sourceUrl) submit(preview.sourceUrl);
                    }}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWatching(false)}
                      data-testid="close-player-btn"
                    >
                      ← Back
                    </Button>

                    <QualityPicker
                      options={qualityOptions}
                      value={selectedQuality?.id || ""}
                      onChange={setSelectedQualityId}
                    />
                  </div>
                </motion.div>
              ) : (
                <div className="md:mx-auto md:max-w-[470px]">
                  <PreviewCard
                    data={preview}
                    onWatch={() => {
                      if (!streamViaProxy) {
                        toast.error(t("toast.noStream"));
                        return;
                      }
                      setWatching(true);
                    }}
                    onDownload={() => setDownloading(true)}
                    onOpenFolder={() => setWatching(true)}
                    onCopy={copyLink}
                    onShare={share}
                  />
                </div>
              )}

              {qualityOptions.length > 1 && !watching && (
                <div className="mt-4">
                  <QualityPicker
                    options={qualityOptions}
                    value={selectedQuality?.id || ""}
                    onChange={setSelectedQualityId}
                  />
                </div>
              )}

              {(downloading || (watching && !isFolder)) && streamViaProxy && (
                <div className="mt-4">
                  <DownloadPanel
                    url={streamViaProxy}
                    filename={currentFile?.name || preview.title}
                    sizeHint={currentFile?.size || preview.size || 0}
                    onClose={() => setDownloading(false)}
                  />
                </div>
              )}

              {watching && isFolder && (
                <div className="mt-4">
                  <FolderBrowser
                    files={preview.files}
                    folderName={preview.title}
                    onPlayFile={openFolderFile}
                    activeIdx={activeFile?._idx}
                  />
                </div>
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
              {t("d.howA")} <span className="text-primary">{t("d.howB")}</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              {t("d.howSub")}
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
              <h3 className="text-sm font-semibold">{t("d.s1t")}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("d.s1d")}
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
              <h3 className="text-sm font-semibold">{t("d.s2t")}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("d.s2d")}
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
              <h3 className="text-sm font-semibold">{t("d.s3t")}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("d.s3d")}
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
                {t("d.featA")} <span className="text-primary">{t("d.featB")}</span>
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                {t("d.featSub")}
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Zap, tk: "d.f1t", dk: "d.f1d" },
                { icon: Download, tk: "d.f2t", dk: "d.f2d" },
                { icon: Archive, tk: "d.f3t", dk: "d.f3d" },
                { icon: FolderOpen, tk: "d.f4t", dk: "d.f4d" },
                { icon: ShieldCheck, tk: "d.f5t", dk: "d.f5d" },
                { icon: Smartphone, tk: "d.f6t", dk: "d.f6d" },
              ].map((f, i) => (
                <motion.div
                  key={f.tk}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                  className="group rounded-2xl border border-border bg-surface-raised p-5 transition-[border-color,box-shadow,brightness] duration-300 ease-out hover:border-primary/40 hover:shadow-primary/5"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-sm font-semibold">{t(f.tk)}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t(f.dk)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ON ANY DEVICE — absorbs the mobile + PC download guides */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="tp-container py-14"
          id="devices"
        >
          <div className="mx-auto max-w-4xl">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                {t("d.devA")} <span className="text-primary">{t("d.devB")}</span>
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                {t("d.devSub")}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-surface-raised p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Smartphone className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-semibold">{t("d.mobT")}</h3>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t("d.mob1")}</li>
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t("d.mob2")}</li>
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t("d.mob3")}</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-surface-raised p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Monitor className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-semibold">{t("d.pcT")}</h3>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t("d.pc1")}</li>
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t("d.pc2")}</li>
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t("d.pc3")}</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        {/* FOLDERS & ZIP — absorbs the folder + ZIP download guides */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="border-y border-border/40 tp-container py-14"
          id="folders-zip"
        >
          <div className="mx-auto max-w-4xl">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                {t("d.foldA")} <span className="text-primary">{t("d.foldB")}</span>
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                {t("d.foldSub")}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-surface-raised p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <FolderOpen className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-semibold">{t("d.faT")}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {t("d.faD")}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-raised p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Archive className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-semibold">{t("d.fbT")}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {t("d.fbD")}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* COMPARISON — original analysis, not a copied chart */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="tp-container py-14"
        >
          <div className="mx-auto max-w-4xl">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                {t("d.cmpA")} <span className="text-primary">{t("d.cmpB")}</span>
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                {t("d.cmpSub")}
              </p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[560px] border-collapse bg-surface-raised text-left text-xs sm:text-sm">
                <caption className="sr-only">{t("d.cmpCap")}</caption>
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th scope="col" className="p-4 font-semibold">{t("d.cmpCol")}</th>
                    <th scope="col" className="p-4 font-semibold">{t("d.cmpTera")}</th>
                    <th scope="col" className="p-4 font-semibold">{t("d.cmpApp")}</th>
                    <th scope="col" className="p-4 font-semibold">{t("d.cmpSites")}</th>
                  </tr>
                </thead>
                <tbody className="[&_tr]:border-b [&_tr]:border-border/60 [&_tr:last-child]:border-0">
                  <tr>
                    <th scope="row" className="p-4 font-medium">{t("d.cmpR1")}</th>
                    <td className="p-4"><Check className="h-4 w-4 text-primary" aria-label={t("d.yes")} /></td>
                    <td className="p-4"><X className="h-4 w-4 text-destructive" aria-label={t("d.no")} /></td>
                    <td className="p-4"><Check className="h-4 w-4 text-primary" aria-label={t("d.yes")} /></td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-4 font-medium">{t("d.cmpR2")}</th>
                    <td className="p-4"><Check className="h-4 w-4 text-primary" aria-label={t("d.yes")} /></td>
                    <td className="p-4"><X className="h-4 w-4 text-destructive" aria-label={t("d.no")} /></td>
                    <td className="p-4"><Check className="h-4 w-4 text-primary" aria-label={t("d.yes")} /></td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-4 font-medium">{t("d.cmpR3")}</th>
                    <td className="p-4"><Check className="h-4 w-4 text-primary" aria-label={t("d.yes")} /></td>
                    <td className="p-4"><Check className="h-4 w-4 text-primary" aria-label={t("d.yes")} /></td>
                    <td className="p-4"><Minus className="h-4 w-4 text-muted-foreground" aria-label={t("d.rare")} /></td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-4 font-medium">{t("d.cmpR4")}</th>
                    <td className="p-4"><Check className="h-4 w-4 text-primary" aria-label={t("d.yes")} /></td>
                    <td className="p-4"><Check className="h-4 w-4 text-primary" aria-label={t("d.yes")} /></td>
                    <td className="p-4"><X className="h-4 w-4 text-destructive" aria-label={t("d.no")} /></td>
                  </tr>
                  <tr>
                    <th scope="row" className="p-4 font-medium">{t("d.cmpR5")}</th>
                    <td className="p-4"><Check className="h-4 w-4 text-primary" aria-label={t("d.yes")} /></td>
                    <td className="p-4"><X className="h-4 w-4 text-destructive" aria-label={t("d.no")} /></td>
                    <td className="p-4"><X className="h-4 w-4 text-destructive" aria-label={t("d.no")} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* DEEP DIVE — how extraction actually works */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="border-y border-border/40 tp-container py-14"
          id="how-extraction-works"
        >
          <div className="mx-auto max-w-4xl">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                {t("d.deepA")} <span className="text-primary">{t("d.deepB")}</span>
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                {t("d.deepSub")}
              </p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3">
              {[
                { n: "01", tk: "d.d1t", dk: "d.d1d" },
                { n: "02", tk: "d.d2t", dk: "d.d2d" },
                { n: "03", tk: "d.d3t", dk: "d.d3d" },
              ].map((s) => (
                <li key={s.n} className="rounded-2xl border border-border bg-surface-raised p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{s.n}</span>
                    <Cpu className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">{t(s.tk)}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">{t(s.dk)}</p>
                </li>
              ))}
            </ol>
            <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground sm:text-sm">
              {t("d.deepNote")}
            </p>
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
              {t("faq.title")}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              {t("d.faqSub")}
            </p>

            <div className="mt-8">
              <FaqCards items={faqItems.map((item) => ({ q: t(item.qk), a: t(item.ak) }))} />
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
              <Smartphone className="inline h-3 w-3 text-primary" /> {t("d.crossChip")}
            </motion.div>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("d.crossText")}
            </p>
            <Button asChild className="mt-3 h-9 px-6 text-sm">
              <Link to="/terabox-video-player">{t("d.crossBtn")}</Link>
            </Button>
          </div>
        </motion.section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="tp-container py-6">
          <div className="mx-auto max-w-4xl text-center text-xs text-muted-foreground">
            <p>
              <span className="font-display text-sm font-semibold text-foreground">
                Tera<span className="text-gradient">Player</span><span className="text-xs font-bold text-slate-400">.in</span>
              </span>
              <span className="mx-1">·</span>
              {t("homefoot.tag")}
              <span className="mx-1">·</span>
              {t("homefoot.note")}{t("homefoot.noteExt")}
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
