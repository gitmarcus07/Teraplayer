import { useEffect } from "react";
import { motion } from "framer-motion";
import Seo from "../components/Seo";
import { Link } from "react-router-dom";
import {
  Play,
  ExternalLink,
  MonitorPlay,
  FileVideo,
  AlertCircle,
  ChevronRight,
  HelpCircle,
  Globe,
  Wifi,
  Smartphone,
  Monitor,
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
    title: "Copy the public TeraBox video share link",
    body: "Find the video you want to watch and copy its public share link. Make sure the link is a share link others can open.",
  },
  {
    title: "Open TeraPlayer's TeraBox Video Player",
    body: "Head over to the TeraBox Video Player page in your browser. Everything happens online, so there is nothing to install.",
  },
  {
    title: "Paste the TeraBox link",
    body: "Paste the link you copied into the input field at the top of the page.",
  },
  {
    title: "Let TeraPlayer resolve the supported share",
    body: "TeraPlayer fetches the share and shows a preview with the video's title, thumbnail, and file size when they are available.",
  },
  {
    title: "Preview the video",
    body: "Before pressing play you can inspect the preview details to confirm it is the video you were expecting.",
  },
  {
    title: "Start playback in the browser",
    body: "Play the supported video directly in the browser window. There is no need to download the file first.",
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
    body: "A slow or unstable connection can interrupt playback. Check your connection and try again.",
  },
  {
    icon: Monitor,
    title: "Playback or browser issues",
    body: "If playback does not start, try refreshing the page or using another compatible browser.",
  },
];

const faqs = [
  {
    q: "How do I watch a TeraBox video online?",
    a: "Copy a public TeraBox share link, paste it into TeraPlayer's TeraBox Video Player, wait for the supported share to resolve, and start playback directly in your browser.",
  },
  {
    q: "Can I watch TeraBox videos without downloading them?",
    a: "Yes. Supported public TeraBox videos can be previewed and streamed in your browser without saving a copy to your device.",
  },
  {
    q: "Do I need to install an app to watch a TeraBox video?",
    a: "No. TeraPlayer is a browser-based tool. There is no app to install and no account required to watch supported public TeraBox videos.",
  },
  {
    q: "Can I watch a private TeraBox video?",
    a: "No. TeraPlayer only processes public TeraBox share links. Private, restricted, or access-controlled content cannot be accessed.",
  },
  {
    q: "Does TeraPlayer support every TeraBox link?",
    a: "No. TeraPlayer supports public TeraBox share links from supported domains. Expired, private, or otherwise unavailable shares cannot be resolved.",
  },
  {
    q: "Can I download a TeraBox video instead?",
    a: "Yes. If you would rather save a supported public TeraBox video to your device, use the TeraBox Video Downloader page.",
  },
  {
    q: "Is the TeraBox Video Player free to use?",
    a: "Yes. The TeraBox Video Player is free to use and does not require an account or any payment.",
  },
];

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Watch TeraBox Videos Online",
  description:
    "Learn how to watch supported public TeraBox videos online with TeraPlayer's browser-based TeraBox Video Player.",
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

export default function HowToWatchTeraBoxVideos() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Seo
        title="How to Watch TeraBox Videos Online | TeraPlayer"
        description="Learn how to watch supported TeraBox videos online with TeraPlayer. Follow a simple guide to open a public TeraBox share link and stream videos in your browser."
        path="/how-to-watch-terabox-videos"
        ogTitle="How to Watch TeraBox Videos Online | TeraPlayer"
        ogDescription="Learn how to watch supported TeraBox videos online with TeraPlayer using a simple browser-based workflow."
        imageAlt="How to Watch TeraBox Videos Online - TeraPlayer"
        twitterDescription="Learn how to watch supported TeraBox videos online with TeraPlayer using a simple browser-based workflow."
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
                <Play className="h-3.5 w-3.5 text-primary" />
                Step-by-step guide
              </div>
              <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl lg:text-6xl">
                How to Watch <span className="text-primary">TeraBox Videos Online</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                TeraPlayer lets you open supported public TeraBox video share links and preview or stream supported
                videos directly in your browser — no app install and no account required.
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
                If someone has shared a TeraBox video with you through a public share link, this guide walks through
                a simple way to watch that video online. It also covers which links TeraPlayer can work with, the
                difference between streaming and downloading, and what to do when playback does not go as expected.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild className="h-11 px-6 text-sm">
                  <Link to="/terabox-video-player">
                    <Play className="mr-2 h-4 w-4" />
                    Open the TeraBox Video Player
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
              How to Watch a <span className="text-primary">TeraBox Video Online</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              The process happens directly in your browser. Before you start, make sure you have
              the TeraBox share link that contains the video you want to watch. Here is how it works:
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
              That is all there is to it. From pasting the link to starting playback, the full flow runs inside your
              browser and requires no sign-up. If a step does not behave as expected, the troubleshooting section
              further down this page covers the most common causes.
            </p>
          </motion.div>
        </section>

        {/* Streaming without downloading */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                Can You Watch TeraBox Videos <span className="text-primary">Without Downloading?</span>
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <p>
                  Yes. TeraPlayer is a browser-based workflow, which means supported public TeraBox videos can be
                  streamed online without saving a copy to your device. You paste a link, TeraPlayer resolves the
                  share, and playback starts directly in the browser.
                </p>
                <p>
                  Streaming is a good fit when you just want to check what a share contains before deciding what to
                  do with it, or when you prefer to watch without keeping the file. Because playback runs in a web
                  browser, it works on desktop computers, laptops, and mobile devices alike, with nothing to install
                  in advance.
                </p>
                <p>
                  It is important to be precise about what this covers. Streaming works with{" "}
                  <span className="font-medium text-foreground">supported public TeraBox videos only</span>. Not every
                  TeraBox link can be played, and TeraPlayer does not provide access to private or restricted
                  content. It does not bypass passwords, authentication, DRM, or any other access controls.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Supported links */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              What TeraBox Links Can <span className="text-primary">TeraPlayer</span> Play?
            </h2>
            <p className="mt-3 text-muted-foreground">
              TeraPlayer can play public TeraBox share links from supported domains. When a supported
              public share can be resolved, TeraPlayer can show a preview that you can stream or play in the browser.
            </p>
            <p className="mt-4 text-muted-foreground">
              Some shares may be expired, private, or restricted by the content owner, in which case they cannot be
              accessed. Because share availability changes over time, there is no way to guarantee that a specific
              link will always resolve.
            </p>
            <p className="mt-4 text-muted-foreground">
              If the link you were given does not load, it usually means one of two things: the share itself is no
              longer public, or the link was not copied in full. Re-sharing from the original owner and copying the
              complete URL are the most reliable ways to get playback working again.
            </p>
          </motion.div>
        </section>

        {/* Player vs downloader */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                TeraBox Video Player <span className="text-primary">vs</span> Downloader
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <p>
                  The player and the downloader cover two different parts of the same workflow. The{" "}
                  <Link
                    to="/terabox-video-player"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    TeraBox Video Player
                  </Link>{" "}
                  focuses on previewing a share and streaming supported videos in your browser. The{" "}
                  <Link
                    to="/terabox-video-downloader"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    TeraBox Video Downloader
                  </Link>{" "}
                  focuses on saving a supported video to your device.
                </p>
                <p>
                  You do not have to choose one over the other. It is common to preview a video in the player first,
                  then use the downloader when you decide you want a local copy. Both tools use the same paste-a-link
                  workflow and neither requires an account.
                </p>
                <p>
                  If you are also looking to save videos, the{" "}
                  <Link
                    to="/how-to-download-terabox-videos"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    how to download TeraBox videos
                  </Link>{" "}
                  guide walks through that process step by step.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Mobile and desktop */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Watching TeraBox Videos on <span className="text-primary">Mobile and Desktop</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Because TeraPlayer runs in a browser, the same watch flow works across desktop computers, laptops, and
              mobile devices. There is nothing to download in advance, no extension to install, and no app store
              visit required.
            </p>
            <p className="mt-4 text-muted-foreground">
              On any device, you paste the supported public TeraBox share link and start playback in the browser. The
              exact playback experience can vary by device and browser, but the core workflow stays the same.
            </p>

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
                <h3 className="text-sm font-semibold">Desktop and laptop</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  A larger screen and a comfortable input field make it easy to paste links and manage playback. You
                  can use a compatible browser on desktop or laptop devices.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="rounded-2xl border border-border bg-surface-raised p-5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Smartphone className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-semibold">Mobile</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  The responsive interface works in mobile browsers on phones and tablets. Copy a share link, paste it
                  into the player, and playback starts in the same browser window.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Troubleshooting */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                TeraBox Video Playback <span className="text-primary">Troubleshooting</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Most playback issues come down to the share itself or the connection. Here are the common causes and
                how to handle them:
              </p>
              <p className="mt-4 text-muted-foreground">
                A good first step is always to confirm that the share link is public and was copied in full. Link
                expiry and truncated or mistyped URLs are common causes of failed playback, and neither can be resolved
                by the tool itself.
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
                Quick answers to the most common questions about watching TeraBox videos online with TeraPlayer. If you
                do not find what you need here, the rest of this guide covers the details of the watch flow.
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
                Ready to watch a TeraBox video online?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Paste a supported public TeraBox link into the TeraBox Video Player and start streaming directly in
                your browser.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button asChild className="h-12 px-8 text-base" size="lg">
                  <Link to="/terabox-video-player">
                    <Play className="mr-2 h-5 w-5" />
                    Go to TeraBox Video Player
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
                <Link to="/terabox-video-player" className="transition-colors duration-200 hover:text-foreground">
                  Player
                </Link>
                <Link
                  to="/terabox-video-downloader"
                  className="transition-colors duration-200 hover:text-foreground"
                >
                  Downloader
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
