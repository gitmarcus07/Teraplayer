import { useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  Download,
  ExternalLink,
  MonitorPlay,
  FileVideo,
  AlertCircle,
  ChevronRight,
  HelpCircle,
  Globe,
  Wifi,
  HardDrive,
} from "lucide-react";
import Header from "../components/Header";
import { Button } from "../components/ui/button";

const fadeUp = {
  initial: { opacity: 0, scale: 0.97 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

const steps = [
  {
    title: "Copy the TeraBox video share link",
    body: "Find the video you want in TeraBox and copy its public share link. Make sure the link is a share link others can open.",
  },
  {
    title: "Open TeraPlayer's TeraBox Video Downloader",
    body: "Head over to the TeraBox Video Downloader page in your browser. Everything happens online, so there is nothing to install.",
  },
  {
    title: "Paste the public TeraBox link",
    body: "Paste the link you copied into the input field at the top of the page.",
  },
  {
    title: "Let TeraPlayer resolve the supported video",
    body: "TeraPlayer fetches the share and shows a preview with the video's title, thumbnail, and file size when they are available.",
  },
  {
    title: "Preview and select the available video quality",
    body: "When a share contains multiple quality versions, you can pick the resolution you want before downloading.",
  },
  {
    title: "Download the video",
    body: "Start the download from your browser. The file is saved directly to your device.",
  },
];

const troubleshooting = [
  {
    icon: AlertCircle,
    title: "Invalid link",
    body: "Double-check that the share link was copied in full. A truncated or mistyped link cannot be resolved.",
  },
  {
    icon: Globe,
    title: "Unsupported or private link",
    body: "TeraPlayer supports public TeraBox share links from supported domains. Private or restricted shares cannot be accessed.",
  },
  {
    icon: FileVideo,
    title: "Expired or unavailable share",
    body: "A share that the owner removed or that has expired will no longer resolve. If the link is gone, ask the owner to share it again.",
  },
  {
    icon: Wifi,
    title: "Network problems",
    body: "A slow or unstable connection can interrupt the request. Check your connection and try again.",
  },
  {
    icon: HardDrive,
    title: "Browser download issues",
    body: "If the download does not start, check your browser's download settings and make sure the destination folder is writable.",
  },
];

const faqs = [
  {
    q: "How do I download a TeraBox video?",
    a: "Copy a public TeraBox share link, paste it into TeraPlayer's TeraBox Video Downloader, wait for the supported video to resolve, choose a quality when available, and start the download from your browser.",
  },
  {
    q: "Can I download TeraBox videos online?",
    a: "Yes. TeraPlayer is a browser-based tool, so you can download supported public TeraBox videos online without installing desktop software.",
  },
  {
    q: "Do I need to install an app?",
    a: "No. TeraPlayer works entirely in your browser. There is no app to install and no account required.",
  },
  {
    q: "Can I download a private TeraBox video?",
    a: "No. TeraPlayer only processes public TeraBox share links. Private, restricted, or access-controlled content cannot be downloaded.",
  },
  {
    q: "Does TeraPlayer support every TeraBox link?",
    a: "No. TeraPlayer supports public TeraBox share links from supported domains. Expired, private, or otherwise unavailable shares cannot be resolved.",
  },
  {
    q: "Can I watch a TeraBox video without downloading it?",
    a: "Yes. You can preview and stream supported public TeraBox videos directly in your browser using the TeraBox Video Player page.",
  },
  {
    q: "Is TeraPlayer free to use?",
    a: "Yes. TeraPlayer is free to use and does not require an account or any payment.",
  },
];

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Download TeraBox Videos",
  description:
    "Learn how to download supported public TeraBox videos online with TeraPlayer's browser-based TeraBox Video Downloader.",
  step: steps.map((step, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: step.title,
    text: step.body,
  })),
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

export default function HowToDownloadTeraBoxVideos() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Helmet>
        <title>How to Download TeraBox Videos | TeraPlayer</title>
        <meta
          name="description"
          content="Learn how to download supported TeraBox videos online with TeraPlayer. Follow a simple step-by-step guide to paste a public TeraBox link, preview the video and download it."
        />
        <link rel="canonical" href="https://www.teraplayer.in/how-to-download-terabox-videos" />
        <meta property="og:title" content="How to Download TeraBox Videos | TeraPlayer" />
        <meta
          property="og:description"
          content="Learn how to download supported TeraBox videos online with TeraPlayer using a simple browser-based workflow."
        />
        <meta property="og:url" content="https://www.teraplayer.in/how-to-download-terabox-videos" />
        <meta property="og:image" content="https://www.teraplayer.in/logo.png" />
        <meta property="og:image:alt" content="How to Download TeraBox Videos - TeraPlayer" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="How to Download TeraBox Videos | TeraPlayer" />
        <meta
          name="twitter:description"
          content="Learn how to download supported TeraBox videos online with TeraPlayer using a simple browser-based workflow."
        />
        <meta name="twitter:image" content="https://www.teraplayer.in/logo.png" />
        <meta name="twitter:image:alt" content="How to Download TeraBox Videos - TeraPlayer" />
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="tp-container py-16 md:py-24"
          >
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-muted-foreground">
                <Download className="h-3.5 w-3.5 text-primary" />
                Step-by-step guide
              </div>
              <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl lg:text-6xl">
                How to Download <span className="text-primary">TeraBox Videos</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                TeraPlayer lets you process supported public TeraBox video share links and download supported
                videos directly from your browser — no app install and no account required.
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
                If someone has shared a TeraBox video with you through a public share link, this guide walks through
                a simple way to save that video to your device. It also covers which links TeraPlayer can work
                with, the difference between downloading and streaming, and what to do when a download does not go as
                expected.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild className="h-11 px-6 text-sm">
                  <Link to="/terabox-video-downloader">
                    <Download className="mr-2 h-4 w-4" />
                    Open the TeraBox Video Downloader
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Step-by-step guide */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              How to Download a <span className="text-primary">TeraBox Video</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              The whole process takes a few moments and happens in your browser. Before you start, make sure you have
              the TeraBox share link that contains the video you want to save. Here is how it works:
            </p>

            <div className="mt-8 space-y-3">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                  className="rounded-2xl border border-border bg-surface-raised p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <span className="text-xl font-bold text-primary">{i + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              That is all there is to it. From pasting the link to starting the download, the full flow runs inside
              your browser and requires no sign-up. If a step does not behave as expected, the troubleshooting
              section further down this page covers the most common causes.
            </p>
          </motion.div>
        </section>

        {/* Online download */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                Can You Download TeraBox Videos <span className="text-primary">Online?</span>
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <p>
                  Yes. TeraPlayer is a browser-based workflow, which means supported public TeraBox videos can be
                  downloaded online without installing desktop software. You paste a link, TeraPlayer resolves it,
                  and the download starts from your browser.
                </p>
                <p>
                  Because the entire flow runs in a web browser, it works on desktop computers, laptops, and mobile
                  devices alike. There is nothing to download in advance, no extension to install, and no app store
                  visit required. As long as you have a supported public TeraBox share link and an internet
                  connection, the downloader can handle the rest.
                </p>
                <p>
                  It is important to be precise about what this covers. TeraPlayer works with{" "}
                  <span className="font-medium text-foreground">supported public share links only</span>. Not every
                  TeraBox link can be processed, and TeraPlayer does not provide access to private or restricted
                  content. It does not bypass passwords, authentication, DRM, or any other access controls. If a
                  share is not public, it cannot be downloaded here.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Supported links */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              What TeraBox Links Does <span className="text-primary">TeraPlayer</span> Support?
            </h2>
            <p className="mt-3 text-muted-foreground">
              TeraPlayer supports public TeraBox share links from supported domains. When a supported public share can
              be resolved, TeraPlayer can show a preview that you can stream or download.
            </p>
            <p className="mt-4 text-muted-foreground">
              Some shares may be expired, private, or restricted by the content owner, in which case they cannot be
              accessed. Because share availability changes over time, there is no way to guarantee that a specific
              link will always resolve.
            </p>
            <p className="mt-4 text-muted-foreground">
              If the link you were given does not load, it usually means one of two things: the share itself is no
              longer public, or the link was not copied in full. Re-sharing from the original owner and copying the
              complete URL are the most reliable ways to fix a broken download.
            </p>
          </motion.div>
        </section>

        {/* Download vs streaming */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                TeraBox Video Download <span className="text-primary">vs</span> Streaming
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <p>
                  Downloading and streaming serve different needs. When you download a supported video, a copy is
                  saved to your device so you can keep it offline. When you stream, the video plays in your browser
                  and you do not keep a local copy.
                </p>
                <p>
                  Downloading makes sense when you want to keep a video for later, plan to watch it somewhere without
                  a reliable connection, or need a copy on another device. Streaming is a good fit when you just want
                  to check what a share contains before deciding what to do with it, or when you simply prefer to
                  watch in the moment.
                </p>
                <p>
                  If you would rather watch a TeraBox video without saving it, TeraPlayer offers a dedicated
                  streaming experience: the{" "}
                  <Link
                    to="/terabox-video-player"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    TeraBox Video Player
                  </Link>
                  . You can use it to preview and play supported public TeraBox videos directly in the browser, or
                  use the{" "}
                  <Link
                    to="/terabox-video-downloader"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    TeraBox Video Downloader
                  </Link>{" "}
                  when you want to save a video to your device.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              TeraBox Video Download <span className="text-primary">Troubleshooting</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Most download issues come down to the share itself or the connection. Here are the common causes and
              how to handle them:
            </p>
            <p className="mt-4 text-muted-foreground">
              A good first step is always to confirm that the share link is public and was copied in full. Link
              expiry and truncated or mistyped URLs are common causes of failed downloads, and neither can be resolved
              by the tool itself.
            </p>
            <p className="mt-4 text-muted-foreground">
              If you have checked the link and the download still will not start, try a different browser or a
              different device once. In most cases this rules out a browser-specific download restriction and narrows
              the problem down to the share itself.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {troubleshooting.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                  className="rounded-2xl border border-border bg-surface-raised p-5"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* FAQ */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-3xl">
              <div className="text-center">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-muted-foreground">
                  <HelpCircle className="h-3.5 w-3.5 text-primary" />
                  Questions &amp; answers
                </div>
                <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                  Frequently Asked <span className="text-primary">Questions</span>
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Quick answers to the most common questions about downloading TeraBox videos with TeraPlayer. If you
                  do not find what you need here, the rest of this guide covers the details of the download flow.
                </p>              </div>

              <div className="mt-8 space-y-3">
                {faqs.map((faq, i) => (
                  <motion.div
                    key={faq.q}
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.04 * i }}
                    className="rounded-2xl border border-border bg-surface-raised p-5 transition-[border-color,brightness] duration-300 ease-out hover:border-primary/30 hover:brightness-105"
                  >
                    <h3 className="flex items-start gap-2 text-sm font-semibold">
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {faq.q}
                    </h3>
                    <p className="mt-2 pl-6 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/40 bg-gradient-to-b from-transparent to-primary/[0.03]">
          <div className="tp-container py-16 text-center md:py-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-2xl"
            >
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                Ready to download a TeraBox video?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Paste a supported public TeraBox link into the TeraBox Video Downloader and start saving videos
                directly from your browser.
              </p>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
                You can also explore streaming supported public TeraBox videos with the TeraBox Video Player, or
                head back to the homepage to learn more about TeraPlayer.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button asChild className="h-12 px-8 text-base" size="lg">
                  <Link to="/terabox-video-downloader">
                    <Download className="mr-2 h-5 w-5" />
                    Go to TeraBox Video Downloader
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 px-8 text-base" size="lg">
                  <Link to="/">
                    <MonitorPlay className="mr-2 h-5 w-5" />
                    Back to TeraPlayer home
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Disclaimer */}
      <footer className="border-t border-border/40 bg-surface-raised/50">
        <div className="tp-container py-10">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-surface-overlay/20 p-5">
              <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">Disclaimer:</span> TeraPlayer is an independent
                  tool and is <span className="font-semibold text-foreground">not affiliated with</span>, endorsed
                  by, or sponsored by TeraBox or Flextech. TeraPlayer only accesses publicly shared content and does
                  not host, store, or distribute any copyrighted material. Users are responsible for complying with
                  applicable laws in their jurisdiction.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col items-center justify-between gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-semibold text-foreground">
                  Tera<span className="text-primary">Player</span>
                </span>
                <span>·</span>
                <span>Free to use · no account required</span>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/" className="transition-colors duration-200 hover:text-foreground">
                  Home
                </Link>
                <Link
                  to="/terabox-video-downloader"
                  className="transition-colors duration-200 hover:text-foreground"
                >
                  Downloader
                </Link>
                <Link to="/terabox-video-player" className="transition-colors duration-200 hover:text-foreground">
                  Player
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
