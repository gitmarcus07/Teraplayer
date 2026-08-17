import { useEffect } from "react";
import { motion } from "framer-motion";
import Seo from "../components/Seo";
import { Link } from "react-router-dom";
import {
  Wrench,
  ExternalLink,
  AlertCircle,
  Globe,
  FileVideo,
  Monitor,
  Download,
  Smartphone,
  ChevronRight,
  HelpCircle,
  RefreshCcw,
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
    title: "Check that the complete link was copied",
    body: "Open the full share link from TeraBox and confirm the entire URL was selected before copying. A partial link cannot be resolved.",
  },
  {
    title: "Confirm that the share is still available",
    body: "Shares can be removed or become unavailable. If the owner no longer has the share active, the link may no longer resolve.",
  },
  {
    title: "Make sure the share is public",
    body: "TeraPlayer works with supported public TeraBox share links. Private or restricted shares cannot be accessed.",
  },
  {
    title: "Try the correct TeraPlayer tool",
    body: "Use the TeraBox Video Player for streaming and the TeraBox Video Downloader for saving supported videos.",
  },
  {
    title: "Check your browser and connection",
    body: "A slow or unstable connection can interrupt the request. Refresh the page once and retry the link.",
  },
  {
    title: "Try the link again",
    body: "Some failures are temporary. Paste the link again after a short wait to see if it resolves.",
  },
];

const faqs = [
  {
    q: "Why is my TeraBox link not working?",
    a: "A TeraBox share link may fail because the URL was not copied in full, the share is no longer available, the content is private or restricted, the link is unsupported, or there is a temporary network or browser issue.",
  },
  {
    q: "Why won't my TeraBox video play?",
    a: "Playback can fail if the network connection is unstable, the browser cannot stream the file, or the supported public share cannot be resolved. Refresh the page, check your connection, and try the link again.",
  },
  {
    q: "Can TeraPlayer open a private TeraBox link?",
    a: "No. TeraPlayer is intended for supported public TeraBox share links. Private or restricted content cannot be accessed, and TeraPlayer does not bypass passwords, authentication, DRM, or access controls.",
  },
  {
    q: "What should I do if my TeraBox share link is expired or unavailable?",
    a: "Ask the owner for a new share and confirm that the full link was copied correctly. A share that has been removed or made unavailable cannot be resolved.",
  },
  {
    q: "Why is my TeraBox download not working?",
    a: "If the underlying supported public share cannot be resolved, the download cannot be started. Verify the full link, confirm the share is public and available, and retry.",
  },
  {
    q: "Does TeraPlayer support every TeraBox link?",
    a: "No. TeraPlayer supports public TeraBox share links from supported domains. Some links may be expired, private, or restricted by the content owner and cannot be accessed.",
  },
  {
    q: "Should I use the TeraBox Video Player or Downloader?",
    a: "Use the TeraBox Video Player to preview and stream supported videos in your browser. Use the TeraBox Video Downloader when you want to save a supported video to your device.",
  },
  {
    q: "Do I need an account to use TeraPlayer?",
    a: "No. TeraPlayer works entirely in your browser. You can preview, watch, and download from supported public TeraBox links without signing in.",
  },
];

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Fix a TeraBox Link That Is Not Working",
  description:
    "A step-by-step troubleshooting process for common TeraBox share link, playback, and download problems with TeraPlayer.",
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

export default function TeraBoxVideoLinkNotWorking() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Seo
        title="TeraBox Video Link Not Working? Common Fixes | TeraPlayer"
        description="TeraBox video link not working? Fix common TeraBox link, playback, and download issues with TeraPlayer and get supported public links to video playback."
        path="/terabox-video-link-not-working"
        ogTitle="TeraBox Video Link Not Working? Common Fixes | TeraPlayer"
        ogDescription="Learn how to troubleshoot common TeraBox video link, playback and download problems with TeraPlayer."
        imageAlt="TeraBox Link Not Working - TeraPlayer"
        twitterDescription="Learn how to troubleshoot common TeraBox video link, playback and download problems with TeraPlayer."
      >
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Seo>

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
                <Wrench className="h-3.5 w-3.5 text-primary" />
                Troubleshooting guide
              </div>
              <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl lg:text-6xl">
                TeraBox Link Not Working?{" "}
                <span className="text-primary">How to Fix Common Video Link Problems</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                A TeraBox share link can fail for several reasons: the URL may be incomplete, the share may no longer
                be available, the content may be private or restricted, the link may be unsupported, or there may be
                a temporary network or browser issue.
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
                This guide walks through the common causes and helps you figure out the next step, whether the problem
                is with the link itself, video playback, or downloading. Some links resolve quickly, while others
                fail for reasons outside your control. Knowing which situation you are in makes it easier to decide
                what to try next. To understand how public TeraBox share links are meant to work, see the{" "}
                <Link
                  to="/terabox-public-link"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  TeraBox public link guide
                </Link>
                .
              </p>
            </div>
          </motion.div>
        </section>

        {/* Troubleshooting steps */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              How to Fix a TeraBox Link <span className="text-primary">That Is Not Working</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Work through these steps in order. Each one explains what to check, why it matters, and what to do next.
              These steps will not fix every link, but they cover the most common problems and give you a clear
              starting point before you decide whether the share needs a new link from its owner.
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
          </motion.div>
        </section>

        {/* Invalid or incomplete links */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                TeraBox Link Is <span className="text-primary">Invalid or Incomplete</span>
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <p>
                  One of the most common reasons a TeraBox share link fails is that the URL itself is not complete.
                  This can happen when:
                </p>
                <ul className="space-y-2">
                  {[
                    "The URL was cut off before it was fully copied.",
                    "An accidental space or line break found its way into the link.",
                    "Extra text around the URL was copied along with it.",
                    "The link was shortened or assembled by hand.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <AlertCircle className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p>
                  The fix is simple: copy the complete public share URL from TeraBox, making sure the entire address
                  is selected, and paste it directly into TeraPlayer. A missing part of the URL is enough for the link
                  to fail.
                </p>
                <p>
                  It can also help to paste the link into a plain text editor first, so you can see exactly what was
                  copied. Any surrounding characters, hidden spaces, or line breaks become visible and easy to remove
                  before you paste the cleaned link into TeraPlayer.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Private or restricted links */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Can TeraPlayer Open a <span className="text-primary">Private TeraBox Link?</span>
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                TeraPlayer is intended for supported public TeraBox share links. When a share is private, restricted,
                or protected by access controls, the content cannot be accessed.
              </p>
              <p>
                TeraPlayer does not bypass passwords, authentication, DRM, or any other access controls. If the person
                who shared the link has restricted access, TeraPlayer cannot access that content.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Expired or unavailable shares */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                TeraBox Video or Share Is <span className="text-primary">No Longer Available</span>
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <p>
                  A TeraBox link can stop working if the owner removes the share or if the share is otherwise
                  unavailable. When that happens, the link itself is not at fault — there is simply nothing left to
                  open.
                </p>
                <p>
                  The recommended action is to ask the owner for a new share and confirm that the full link was copied
                  correctly. If a share has been removed, no tool can bring it back.
                </p>
                <p>
                  Unavailability is different from an invalid link. With an invalid link, the URL itself is the
                  problem. With an unavailable share, the link may look correct but the content behind it is gone.
                  Checking the link against the original message you received clears up which situation you are in.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Video not playing */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              TeraBox Video Link Opens but the Video <span className="text-primary">Will Not Play</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              If the link resolves but playback does not start, try these steps:
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: RefreshCcw,
                  title: "Refresh the page",
                  body: "A one-time refresh can clear a stalled state and let the link resolve again.",
                },
                {
                  icon: Globe,
                  title: "Check the network connection",
                  body: "Playback streams over your connection. If it is slow or unstable, video may not start.",
                },
                {
                  icon: Monitor,
                  title: "Try another compatible browser",
                  body: "Playback can behave differently across browsers. Trying another one once is worth a shot, though it will not always help.",
                },
                {
                  icon: FileVideo,
                  title: "Retry the supported public link",
                  body: "Re-copy the full public share link and paste it again before deciding the video cannot play.",
                },
                {
                  icon: Download,
                  title: "Use the downloader instead",
                  body: "If you want to keep the supported video, the TeraBox Video Downloader can help you save it.",
                },
              ].map((item, i) => (
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
            <p className="mt-6 text-sm text-muted-foreground">
              For streaming, use the{" "}
              <Link
                to="/terabox-video-player"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                TeraBox Video Player
              </Link>
              . For saving a supported video to your device, use the{" "}
              <Link
                to="/terabox-video-downloader"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                TeraBox Video Downloader
              </Link>
              .
            </p>
          </motion.div>
        </section>

        {/* Download not working */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                TeraBox Download <span className="text-primary">Is Not Working</span>
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
<p>
                It helps to separate three things: resolving the link, playing the video, and downloading it.
                Downloading only becomes possible when the supported public share can be resolved in the first
                place. If resolution fails, changing download settings will not necessarily solve the problem.
              </p>
                <p>
                If the link resolves and playback works, a download problem is usually in the browser's handling of
                the file. If the link itself cannot be resolved, no download will start regardless of the settings.
              </p>
                <p>
                The same logic applies in reverse: a link that resolves and streams fine is not necessarily a
                download problem. Confirming which stage is failing — resolution, playback, or download — tells you
                where to look and which tool to use.
              </p>
                <p>
                  For the full process, see our guide on{" "}
                  <Link
                    to="/how-to-download-terabox-videos"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    how to download TeraBox videos
                  </Link>
                  .
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Player vs downloader */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Should You Use the TeraBox <span className="text-primary">Player or Downloader?</span>
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-border bg-surface-raised p-5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Monitor className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-semibold">TeraBox Video Player</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Intended for previewing and streaming supported videos in your browser.
                </p>
                <Button asChild variant="outline" className="mt-4 h-9 px-4 text-xs">
                  <Link to="/terabox-video-player">TeraBox Video Player</Link>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="rounded-2xl border border-border bg-surface-raised p-5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Download className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-semibold">TeraBox Video Downloader</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Intended for saving supported videos to your device.
                </p>
                <Button asChild variant="outline" className="mt-4 h-9 px-4 text-xs">
                  <Link to="/terabox-video-downloader">TeraBox Video Downloader</Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Link still does not work */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                What to Do If Your TeraBox Link <span className="text-primary">Still Does Not Work</span>
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <p>
                  Some links simply may not be supported or available, and no troubleshooting step can resolve them.
                  This is normal — not every TeraBox share can be opened in TeraPlayer.
                </p>
                <ul className="space-y-2">
                  {[
                    "Verify the original share with the person who sent it.",
                    "Ask the owner for a new public share.",
                    "Make sure the URL was copied in full.",
                    "Retry later in case there was a temporary network issue.",
                    "Try the appropriate TeraPlayer tool for watching or downloading.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p>
                  There is no guaranteed fix for every link. If a share is genuinely unavailable, the only reliable
                  next step is to get a working public share from the owner.
                </p>
                <p>
                  Keep a record of what you tried so you can tell the owner of the share exactly what happened, such
                  as whether the link resolved at all or only failed at playback. That detail can help them confirm
                  whether the share is still public and still open.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="tp-container py-16 md:py-20">
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
                Quick answers to common questions about TeraBox links that are not working.
              </p>
            </div>

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
                Try your link again with TeraPlayer
              </h2>
              <p className="mt-3 text-muted-foreground">
                Paste a supported public TeraBox link into the TeraBox Video Player to stream, or use the TeraBox
                Video Downloader to save a supported video.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button asChild className="h-12 px-8 text-base" size="lg">
                  <Link to="/terabox-video-player">
                    <Monitor className="mr-2 h-5 w-5" />
                    Go to TeraBox Video Player
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 px-8 text-base" size="lg">
                  <Link to="/">
                    <Smartphone className="mr-2 h-5 w-5" />
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
                  to="/how-to-download-terabox-videos"
                  className="transition-colors duration-200 hover:text-foreground"
                >
                  Download guide
                </Link>
                <Link
                  to="/how-to-watch-terabox-videos"
                  className="transition-colors duration-200 hover:text-foreground"
                >
                  Watch guide
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}