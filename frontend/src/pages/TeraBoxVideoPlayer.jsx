import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Play,
  Download,
  ShieldCheck,
  Zap,
  Sparkles,
  HelpCircle,
  ChevronDown,
  FileVideo,
  Smartphone,
  MonitorPlay,
  FolderTree,
  Sliders,
  CheckCircle2,
  ArrowRight,
  Puzzle,
} from "lucide-react";

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
  {
    q: "What is a TeraBox video player?",
    a: "A TeraBox video player is an online web utility that enables you to open supported public TeraBox share links and stream video content directly in your browser without requiring manual file extraction or heavy desktop software.",
  },
  {
    q: "How do I watch a TeraBox video online?",
    a: "Copy a supported public TeraBox share link, paste it into the search bar at the top of this page, and click Watch Now. TeraPlayer will resolve the link and display an integrated video player for browser playback.",
  },
  {
    q: "Do I need a TeraPlayer account to watch videos?",
    a: "No account or registration is required to resolve and stream supported public TeraBox share links on TeraPlayer.",
  },
  {
    q: "Can I watch TeraBox videos on my phone or tablet?",
    a: "Yes. TeraPlayer is fully optimized for mobile web browsers including Chrome, Safari, Firefox, and Edge on both Android and iOS mobile devices.",
  },
  {
    q: "Can I choose different video qualities?",
    a: "When a shared link contains multi-resolution video files or quality variants, TeraPlayer presents a quality picker allowing you to select your preferred resolution before playing.",
  },
  {
    q: "Can I download a video after watching it?",
    a: "Yes. TeraPlayer includes both streaming and downloading options. If you wish to save a file offline after previewing it, you can use our built-in download controls or visit our dedicated TeraBox video downloader page.",
  },
  {
    q: "Does TeraPlayer support every single TeraBox link?",
    a: "TeraPlayer supports standard public TeraBox share links. Private files, deleted content, expired shares, or links with restricted permission settings cannot be extracted or played.",
  },
];

export default function TeraBoxVideoPlayer() {
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
  const [openFaq, setOpenFaq] = useState(null);
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
              toast.error("Incorrect password. Please try again.");
            }

            setPwdDialog({
              open: true,
              url,
              incorrect: wasIncorrect,
            });
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
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
      <Helmet>
        <title>
          TeraBox Video Player | Watch TeraBox Videos Online - TeraPlayer
        </title>

        <meta
          name="description"
          content="Watch supported TeraBox videos online with TeraPlayer. Paste a public TeraBox link to preview and play videos directly from your browser."
        />

        <link
          rel="canonical"
          href="https://www.teraplayer.in/terabox-video-player"
        />

        <meta
          property="og:title"
          content="TeraBox Video Player | TeraPlayer"
        />

        <meta
          property="og:description"
          content="Watch supported TeraBox videos online with TeraPlayer. Preview and play videos directly from your browser."
        />

        <meta
          property="og:url"
          content="https://www.teraplayer.in/terabox-video-player"
        />

        <meta property="og:type" content="website" />

        <meta
          property="og:image"
          content="https://www.teraplayer.in/logo.png"
        />

        <meta
          property="og:image:alt"
          content="TeraBox Video Player - TeraPlayer"
        />

        <meta name="twitter:card" content="summary_large_image" />

        <meta
          name="twitter:title"
          content="TeraBox Video Player | TeraPlayer"
        />

        <meta
          name="twitter:description"
          content="Watch supported TeraBox videos online with TeraPlayer."
        />

        <meta
          name="twitter:image"
          content="https://www.teraplayer.in/logo.png"
        />

        <meta
          name="twitter:image:alt"
          content="TeraBox Video Player - TeraPlayer"
        />

        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>

        <script type="application/ld+json">
          {JSON.stringify(webAppSchema)}
        </script>
      </Helmet>

      <div className="min-h-[calc(100vh-4rem)] pb-16">
        <section className="px-4 pt-10 pb-12 sm:pt-16 sm:pb-16 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dedicated TeraBox Video Player Page</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4"
          >
            TeraBox Video Player
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            Watch supported TeraBox videos online directly in your browser.
            Paste a public TeraBox share link below to resolve media files,
            preview content details, and begin playback seamlessly.
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
                  <PreviewCard
                    preview={preview}
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

                  {preview.is_folder && preview.files?.length > 1 && (
                    <FolderBrowser
                      files={preview.files}
                      activeFile={effectiveFile}
                      onSelectFile={(f) => {
                        setActiveFile(f);
                        setSelectedQualityId("");
                      }}
                    />
                  )}

                  {watching && effectiveFile && streamViaProxy && (
                    <VideoPlayer
                      src={streamViaProxy}
                      poster={effectiveFile?.thumbnail || preview.thumbnail}
                      title={effectiveFile?.name || preview.title}
                    />
                  )}

                  {watching && effectiveFile && !streamViaProxy && (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium">
                      No playable stream URL available for this file.
                    </div>
                  )}

                  {downloading && effectiveFile && (
                    <DownloadPanel
                      file={effectiveFile}
                      sourceUrl={preview.sourceUrl}
                    />
                  )}
                </>
              ) : (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium">
                  {preview.error ||
                    "Unable to resolve this TeraBox link."}
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
                      Extract with Browser
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4 text-center sm:text-left">
            TeraBox Video Player — Watch TeraBox Videos Online
          </h1>

          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4 text-center sm:text-left">
            Online Browser Playback for Shared TeraBox Media
          </h2>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4">
            TeraPlayer provides a streamlined online video player interface
            designed for viewing public TeraBox shared links. Instead of
            downloading heavy files before knowing their contents or dealing
            with external video players, you can preview media metadata and
            start streaming supported video formats directly within modern
            desktop and mobile browsers.
          </p>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Our web player resolves shared links cleanly, organizing folder
            structures, multi-part video collections, and resolution choices
            into a clean, accessible viewing experience.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-12 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
              How to Watch a TeraBox Video Online
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground">
              Follow these five straightforward steps to play supported
              TeraBox videos directly in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: "01",
                title: "Copy Link",
                desc: "Copy a valid, public TeraBox share link from your message or browser.",
              },
              {
                step: "02",
                title: "Paste Link",
                desc: "Paste the copied URL into the TeraPlayer input box above.",
              },
              {
                step: "03",
                title: "Resolve Media",
                desc: "Click Watch Now to allow TeraPlayer to analyze and resolve the public share.",
              },
              {
                step: "04",
                title: "Select Video",
                desc: "Choose your desired file or quality resolution if multiple files are present.",
              },
              {
                step: "05",
                title: "Start Streaming",
                desc: "Enjoy inline video playback directly inside your browser window.",
              },
            ].map((s, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-surface-raised border border-border/60 hover:border-accent/40 transition-colors flex flex-col justify-between h-full"
              >
                <div>
                  <span className="text-xs font-bold text-accent tracking-wider uppercase block mb-2">
                    Step {s.step}
                  </span>

                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {s.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-12 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
              Key TeraBox Video Player Features
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground">
              Built specifically to deliver a comfortable and fast viewing
              workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MonitorPlay,
                title: "In-Browser Streaming",
                desc: "Play supported video files inline in modern web browsers without installing extra player plugins.",
              },
              {
                icon: FileVideo,
                title: "Instant Media Preview",
                desc: "Inspect video filenames, thumbnail previews, and file sizes prior to starting full playback.",
              },
              {
                icon: Sliders,
                title: "Quality & Resolution Picker",
                desc: "Switch between available video quality options whenever multi-resolution streams are provided.",
              },
              {
                icon: FolderTree,
                title: "Folder Navigation",
                desc: "Browse multi-file folders and sub-directories seamlessly within shared TeraBox link collections.",
              },
              {
                icon: Smartphone,
                title: "Mobile Responsive",
                desc: "Enjoy consistent video playback on smartphones, tablets, and desktop computers alike.",
              },
              {
                icon: Download,
                title: "Integrated Download Option",
                desc: "Easily switch from streaming mode to downloading if you decide to keep a local copy.",
              },
            ].map((f, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-surface-raised border border-border/60 flex flex-col items-start gap-3 hover:border-accent/40 transition-colors"
              >
                <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                  <f.icon className="w-5 h-5" />
                </div>

                <h3 className="text-base font-semibold text-foreground">
                  {f.title}
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-10 border-t border-border/40">
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-accent/5 via-surface-raised to-primary/5 border border-accent/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Looking to save videos directly to your device?
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                While our online player is designed for instant browser
                streaming, TeraPlayer also supports direct file downloading.
                Visit our specialized page to focus specifically on saving
                files offline.
              </p>
            </div>

            <Link
              to="/terabox-video-downloader"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
            >
              <span>TeraBox video downloader</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-12 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Questions & Answers</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
              Frequently Asked Questions
            </h2>

            <p className="text-sm text-muted-foreground">
              Everything you need to know about using TeraBox Video Player.
            </p>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;

              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-surface-raised border border-border/60 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenFaq(isOpen ? null : idx)
                    }
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-foreground hover:text-accent transition-colors focus:outline-none"
                  >
                    <span>{item.q}</span>

                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                        isOpen
                          ? "rotate-180 text-accent"
                          : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-5 pt-0 sm:px-5 sm:pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 mt-1 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 pt-8 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-surface-raised border border-border/60 relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Ready to Stream Your TeraBox Links?
              </h2>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Paste a supported public TeraBox share link above to preview
                video metadata and start watching directly in your browser.
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
                  Back to Top & Watch Now
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}