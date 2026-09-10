import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Seo from "../components/Seo";
import Header from "../components/Header";
import FaqCards from "../components/FaqCards";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Play,
  Download,
  ShieldCheck,
  Zap,
  Sparkles,
  HelpCircle,
  FileVideo,
  Smartphone,
  MonitorPlay,
  FolderTree,
  Sliders,
  CheckCircle2,
  ArrowRight,
  Puzzle,
  KeyRound,
  Cpu,
  Check,
} from "lucide-react";

import HeroInput from "../components/HeroInput";
import { useLang } from "../i18n/LanguageContext";
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

function buildQualityOptions(preview) {
  if (!preview?.files || preview.files.length < 2) return [];

  const videoFiles = preview.files.filter(
    (f) =>
      (f.file_type === "video" || !f.file_type) &&
      (f.stream_url || f.download_url)
  );

  if (videoFiles.length < 2) return [];

  const hasQualityHints = videoFiles.some((f) =>
    /(240p|360p|480p|540p|720p|1080p|1440p|2160p|4k|hd|sd)/i.test(
      f.name || ""
    )
  );

  if (!hasQualityHints) return [];

  return videoFiles.map((f, idx) => {
    const match = (f.name || "").match(
      /(240p|360p|480p|540p|720p|1080p|1440p|2160p|4k)/i
    );

    return {
      id: String(idx),
      label: match ? match[1].toUpperCase() : f.name || `Source ${idx + 1}`,
      file: f,
    };
  });
}

const FAQ_ITEMS = [
  { qk: "p.q1", ak: "p.a1" },
  { qk: "p.q2", ak: "p.a2" },
  { qk: "p.q3", ak: "p.a3" },
  { qk: "p.q4", ak: "p.a4" },
  { qk: "p.q5", ak: "p.a5" },
  { qk: "p.q6", ak: "p.a6" },
  { qk: "p.q7", ak: "p.a7" },
  { qk: "p.q8", ak: "p.a8" },
  { qk: "p.q9", ak: "p.a9" },
];

export default function TeraBoxVideoPlayer() {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [watching, setWatching] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pwdDialog, setPwdDialog] = useState({
    open: false,
    url: "",
    incorrect: false,
  });
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
        const enriched = {
          ...data,
          sourceUrl: url,
          usedPassword: password,
        };

        setPreview(enriched);

        if (!data.ok) {
          if (data.password_required) {
            const wasIncorrect = !!data.password_incorrect;

            if (wasIncorrect) {
              toast.error(t("toast.incorrectPw"));
            }

            setPwdDialog({
              open: true,
              url,
              incorrect: wasIncorrect,
            });
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
  }, [searchParams, preview, loading, submit]);

  const qualityOptions = buildQualityOptions(preview);

  const effectiveFile =
    activeFile ||
    (selectedQualityId
      ? qualityOptions.find((q) => q.id === selectedQualityId)?.file
      : null) ||
    preview?.files?.[0];

  const streamUrl = effectiveFile?.stream_url || effectiveFile?.download_url;
  const streamViaProxy = streamUrl ? streamProxyUrl(streamUrl) : null;

  const isFolder =
    preview?.ok &&
    Array.isArray(preview?.files) &&
    preview.files.length > 1 &&
    qualityOptions.length === 0;

  const openFolderFile = (file) => {
    setActiveFile(file);
    setSelectedQualityId("");
    setWatching(file.file_type === "video");
    setDownloading(false);
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: t(item.qk),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(item.ak),
      },
    })),
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TeraBox Video Player - TeraPlayer",
    url: "https://www.teraplayer.in/terabox-video-player",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "All",
    description:
      "Watch supported TeraBox videos online with TeraPlayer. Paste a public TeraBox link to preview and play videos directly from your browser.",
  };

  return (
    <>
      <Seo
        title="TeraBox Player — Watch TeraBox Videos Online | TeraPlayer"
        description="Watch supported TeraBox videos online with TeraPlayer — a free TeraBox online video player. Paste a public TeraBox link to preview and stream videos directly in your browser."
        path="/terabox-video-player"
        ogTitle="TeraBox Player — Watch TeraBox Videos Online | TeraPlayer"
        ogDescription="Watch supported TeraBox videos online with TeraPlayer's TeraBox online video player. Preview and play videos directly from your browser."
        imageAlt="TeraBox Player - TeraPlayer"
        twitterDescription="Watch supported TeraBox videos online with TeraPlayer's TeraBox online video player."
      >
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>

        <script type="application/ld+json">
          {JSON.stringify(webAppSchema)}
        </script>
      </Seo>

      <Header />

      <main id="main" className="bg-void">
      <div className="min-h-[calc(100vh-4rem)] pb-16">
        <section className="relative overflow-hidden px-4 pt-10 pb-12 sm:pt-16 sm:pb-16 text-center max-w-4xl mx-auto">
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-full max-w-3xl -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("p.eyebrow")}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4"
          >
            TeraBox <span className="text-primary">{t("p.titleB")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            {t("p.sub")}
          </motion.p>

          <div className="mb-10">
            <HeroInput
              onSubmit={submit}
              loading={loading}
              defaultValue={searchParams.get("url") || ""}
            />
          </div>

          <PasswordDialog
            open={pwdDialog.open}
            incorrect={pwdDialog.incorrect}
            onClose={() =>
              setPwdDialog({
                open: false,
                url: "",
                incorrect: false,
              })
            }
            onSubmit={(pwd) => {
              const targetUrl = pwdDialog.url;

              setPwdDialog({
                open: false,
                url: "",
                incorrect: false,
              });

              submit(targetUrl, pwd);
            }}
          />

          {preview && (
            <div className="mt-8 text-left max-w-2xl mx-auto space-y-6">
              {preview.ok ? (
                <>
                  {watching && effectiveFile ? (
                    streamViaProxy ? (
                      <div className="space-y-6">
                        <VideoPlayer
                          src={streamViaProxy}
                          poster={effectiveFile?.thumbnail || preview.thumbnail}
                          title={effectiveFile?.name || preview.title}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setWatching(false)}
                            data-testid="close-player-btn"
                          >
                            ← Back
                          </Button>
                          {qualityOptions.length > 1 && (
                            <QualityPicker
                              options={qualityOptions}
                              selectedId={
                                selectedQualityId || qualityOptions[0].id
                              }
                              onSelect={(q) => {
                                setSelectedQualityId(q.id);
                                setActiveFile(q.file);
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium">
                        No playable stream URL available for this file.
                      </div>
                    )
                  ) : (
                    <>
                      <PreviewCard
                        data={preview}
                        onWatch={() => {
                          setWatching(true);
                          setDownloading(false);
                        }}
                        onDownload={() => {
                          setDownloading(true);
                          setWatching(false);
                        }}
                      />

                      {qualityOptions.length > 1 && (
                        <QualityPicker
                          options={qualityOptions}
                          selectedId={
                            selectedQualityId || qualityOptions[0].id
                          }
                          onSelect={(q) => {
                            setSelectedQualityId(q.id);
                            setActiveFile(q.file);
                          }}
                        />
                      )}

                      {isFolder && (
                        <FolderBrowser
                          files={preview.files}
                          folderName={preview.title}
                          onPlayFile={openFolderFile}
                          activeIdx={activeFile?._idx}
                        />
                      )}
                    </>
                  )}

                  {downloading && effectiveFile && streamViaProxy && (
                    <DownloadPanel
                      url={streamViaProxy}
                      filename={effectiveFile?.name || preview.title}
                      sizeHint={effectiveFile?.size || preview.size || 0}
                      onClose={() => setDownloading(false)}
                    />
                  )}
                </>
              ) : preview.password_required ? (
                <div
                  data-testid="password-required-panel"
                  className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4 sm:p-6"
                >
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
              ) : (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium">
                  {safePreviewError(preview.error, false, t).description}
                  <div className="mt-3 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        runBrowserExtraction(
                          preview.sourceUrl || searchParams.get("url") || ""
                        )
                      }
                      disabled={extRunning}
                      data-testid="extract-with-browser-btn"
                    >
                      <Puzzle className="mr-1.5 h-4 w-4" />
                      {t("d.extractBtn")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {extStatus && (
            <div className="mt-6 max-w-2xl mx-auto">
              <ExtensionStatus
                status={extStatus.state}
                message={extStatus.message}
                onRetry={retryBrowserExtraction}
                retrying={extRetrying}
              />
            </div>
          )}
        </section>

        <section className="max-w-4xl mx-auto px-4 py-10 border-t border-border/40">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4 text-center sm:text-left">
            {t("p.introT")}
          </h2>

          <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mb-4 text-center sm:text-left">
            {t("p.introH")}
          </h3>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4">
            {t("p.introB1")}
          </p>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            {t("p.introB2a")}{" "}
            <Link to="/help-center" className="text-primary hover:underline">
              {t("p.introB2b")}
            </Link>{" "}
            {t("p.introB2c")}
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-12 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
              {t("p.stepsT")}
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground">
              {t("p.stepsSub")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: "01", tk: "p.s1t", dk: "p.s1d" },
              { step: "02", tk: "p.s2t", dk: "p.s2d" },
              { step: "03", tk: "p.s3t", dk: "p.s3d" },
              { step: "04", tk: "p.s4t", dk: "p.s4d" },
              { step: "05", tk: "p.s5t", dk: "p.s5d" },
            ].map((s, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-surface-raised border border-border/60 hover:border-accent/40 transition-colors flex flex-col justify-between h-full"
              >
                <div>
                  <span className="text-xs font-bold text-accent tracking-wider uppercase block mb-2">
                    {t("p.step")} {s.step}
                  </span>

                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {t(s.tk)}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(s.dk)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-12 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
              {t("p.featT")}
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground">
              {t("p.featSub")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MonitorPlay, tk: "p.f1t", dk: "p.f1d" },
              { icon: FileVideo, tk: "p.f2t", dk: "p.f2d" },
              { icon: Sliders, tk: "p.f3t", dk: "p.f3d" },
              { icon: FolderTree, tk: "p.f4t", dk: "p.f4d" },
              { icon: Smartphone, tk: "p.f5t", dk: "p.f5d" },
              { icon: Download, tk: "p.f6t", dk: "p.f6d" },
            ].map((f, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-surface-raised border border-border/60 flex flex-col items-start gap-3 hover:border-accent/40 transition-colors"
              >
                <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                  <f.icon className="w-5 h-5" />
                </div>

                <h3 className="text-base font-semibold text-foreground">
                  {t(f.tk)}
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(f.dk)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-12 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
              {t("p.deepT")} <span className="text-primary">{t("p.deepB")}</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("p.deepSub")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Zap, tk: "p.d1t", dk: "p.d1d" },
              { icon: Cpu, tk: "p.d2t", dk: "p.d2d" },
              { icon: Smartphone, tk: "p.d3t", dk: "p.d3d" },
            ].map((f) => (
              <div key={f.tk} className="p-6 rounded-2xl bg-surface-raised border border-border/60">
                <div className="p-2.5 rounded-xl bg-accent/10 text-accent w-fit">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-foreground">{t(f.tk)}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{t(f.dk)}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground sm:text-sm">
            {t("p.deepNote")}
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-12 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
              {t("p.cmpT")} <span className="text-primary">{t("p.cmpB")}</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("p.cmpSub")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-surface-raised border border-border/60">
              <Play className="w-6 h-6 text-primary" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold text-foreground">{t("p.cpT")}</h3>
              <ul className="mt-3 space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t("p.cp1")}</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t("p.cp2")}</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t("p.cp3")}</li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl bg-surface-raised border border-border/60">
              <Download className="w-6 h-6 text-primary" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold text-foreground">{t("p.cdT")}</h3>
              <ul className="mt-3 space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t("p.cd1")}</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t("p.cd2")}</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t("p.cd3")}</li>
              </ul>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/terabox-video-downloader">{t("p.cdBtn")} <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-10 border-t border-border/40">
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-accent/5 via-surface-raised to-primary/5 border border-accent/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {t("p.bandT")}
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
              {t("p.bandB")}
            </p>
            </div>

            <Link
              to="/terabox-video-downloader"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
            >
              <span>{t("p.bandBtn")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-12 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t("p.faqEyebrow")}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
              {t("faq.title")}
            </h2>

            <p className="text-sm text-muted-foreground">
              {t("p.faqSub")}
            </p>
          </div>

          <div className="mt-8">
            <FaqCards items={FAQ_ITEMS.map((item) => ({ q: t(item.qk), a: t(item.ak) }))} />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 pt-8 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-surface-raised border border-border/60 relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {t("p.ctaT")}
              </h2>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("p.ctaB")}
              </p>

              <div className="pt-2">
                <Button
                  onClick={() =>
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    })
                  }
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                  {t("p.topBtn")}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
      </main>

      <Footer />
    </>
  );
}