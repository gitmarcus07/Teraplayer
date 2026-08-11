import { useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  Smartphone,
  ExternalLink,
  Monitor,
  Globe,
  Download,
  Play,
  Archive,
  AlertCircle,
  ChevronRight,
  HelpCircle,
  Wifi,
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
    title: "Copy the TeraBox share link on your phone",
    body: "Find the file or folder in TeraBox, generate a public share link, and copy the complete URL to your clipboard.",
  },
  {
    title: "Open TeraPlayer in your mobile browser",
    body: "Visit the TeraBox Video Downloader in the browser on your phone or tablet. Everything happens online, so there is nothing to install.",
  },
  {
    title: "Paste the link and resolve the share",
    body: "Paste the public share link into the input field and let TeraPlayer resolve it. If the share is supported, a preview appears.",
  },
  {
    title: "Watch or download supported files",
    body: "Use the TeraBox Video Player to stream supported videos, or the download controls to save supported files to your device.",
  },
];

const faqs = [
  {
    q: "Can I download TeraBox videos on my phone?",
    a: "Yes. TeraPlayer works in a mobile browser, so you can paste a supported public TeraBox link on your phone or tablet, watch videos, and download supported files directly from that browser.",
  },
  {
    q: "Is there a TeraPlayer mobile app?",
    a: "No. TeraPlayer is a browser-based tool. There is no mobile app to install and no app store visit required. You simply use the site in any compatible mobile browser.",
  },
  {
    q: "Does TeraPlayer download to my phone or tablet?",
    a: "Downloads start from your browser and save through your device's normal download flow. The exact behavior can vary by browser and device, but the workflow itself runs entirely in the browser.",
  },
  {
    q: "Can I download multiple TeraBox files as a ZIP on mobile?",
    a: "Yes. On a supported multi-file share, the folder view lets you select several files and download them together as a ZIP archive. Very large sets may be more reliable on a desktop, depending on device resources.",
  },
  {
    q: "Can I watch TeraBox videos on mobile without downloading them?",
    a: "Yes. Paste the supported public link into the TeraBox Video Player to stream supported videos directly in your mobile browser, without saving a copy.",
  },
  {
    q: "Why won't a TeraBox download start on my phone?",
    a: "Check that the full public link was copied and the share is still public and available. If the link resolves but the download does not start, check your browser's download settings and connection, and try once more.",
  },
  {
    q: "Do I need a TeraPlayer account to download on mobile?",
    a: "No. TeraPlayer works entirely in your browser. You can preview, watch, and download from supported public TeraBox links on any device without signing in.",
  },
  {
    q: "Is TeraPlayer compatible with every mobile browser?",
    a: "No. TeraPlayer works in modern, compatible browsers, but the exact experience on a phone can vary by browser and device. A supported browsing experience requires a current browser and a working connection.",
  },
];

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Download TeraBox Videos on Mobile",
  description:
    "Learn how to use TeraPlayer on a phone or tablet to open supported public TeraBox links, watch videos, and download supported files from a mobile browser.",
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

export default function TeraBoxDownloadMobile() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Helmet>
        <title>TeraBox Downloader on Mobile: Download Videos on Your Phone | TeraPlayer</title>
        <meta
          name="description"
          content="Learn how to use TeraPlayer on a phone or tablet to open supported public TeraBox links, watch videos, and download supported files directly from a mobile browser."
        />
        <link rel="canonical" href="https://teraplayer.in/terabox-download-mobile" />
        <meta property="og:title" content="TeraBox Downloader on Mobile: Download Videos on Your Phone | TeraPlayer" />
        <meta
          property="og:description"
          content="Learn how to use TeraPlayer on a phone or tablet to open supported public TeraBox links and download files from a mobile browser."
        />
        <meta property="og:url" content="https://teraplayer.in/terabox-download-mobile" />
        <meta property="og:image" content="https://teraplayer.in/logo.png" />
        <meta property="og:image:alt" content="TeraBox Downloader on Mobile - TeraPlayer" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TeraBox Downloader on Mobile: Download Videos on Your Phone | TeraPlayer" />
        <meta
          name="twitter:description"
          content="Learn how to use TeraPlayer on a phone or tablet to open supported public TeraBox links and download files from a mobile browser."
        />
        <meta name="twitter:image" content="https://teraplayer.in/logo.png" />
        <meta name="twitter:image:alt" content="TeraBox Downloader on Mobile - TeraPlayer" />
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
                <Smartphone className="h-3.5 w-3.5 text-primary" />
                Mobile guide
              </div>
              <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl lg:text-6xl">
                TeraBox Downloader on Mobile:{" "}
                <span className="text-primary">Download Videos on Your Phone</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                TeraPlayer is a browser-based tool, so it works on phones and tablets without installing an app.
                With a supported public TeraBox link, you can watch videos and download supported files directly
                from your mobile browser.
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
                This guide covers the mobile workflow, including folder and ZIP downloads, watching videos, and what
                to check when a download does not work on your phone.
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

        {/* Can you download on mobile */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Can You Download TeraBox Videos <span className="text-primary">on Mobile?</span>
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                Yes. TeraPlayer runs entirely in a web browser, and phones and tablets have capable browsers too.
                As long as you can open the site in a compatible mobile browser, the same paste-a-link workflow for
                watching and downloading supported public TeraBox content is available.
              </p>
              <p>
                There is no native Android or iOS app to install. TeraPlayer is not a dedicated mobile application;
                it is a browser-based tool you open the same way you open any website. That means no app to update
                and no app-store visit, but it also means the mobile experience depends on the browser and device
                you are using.
              </p>
              <p>
                Downloads started from a mobile browser save through your device's usual download flow, the same way
                other files save on your phone. The fundamentals of the workflow are the same on mobile, even
                though the exact screen layout differs from a desktop.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Use TeraPlayer on your phone */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                How to Use TeraPlayer <span className="text-primary">on Your Phone</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                The mobile workflow has four steps. Everything happens in the browser, on the device you are already
                holding:
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
                On phones with a smaller screen, the paste field, preview, and folder view arrange themselves to fit
                the viewport. The core flow stays the same across devices.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Multiple files and ZIP on mobile */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Downloading Multiple Files or ZIPs <span className="text-primary">on Mobile</span>
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                When a supported public TeraBox share contains several files, the folder view appears on mobile just
                like it does on desktop. You can browse, search, and sort the folder, then select multiple files that
                have downloadable links and download them together as a ZIP archive.
              </p>
              <p>
                The ZIP is built in your browser on your device. On a phone, very large selections may take longer
                or may not complete, depending on the device's memory, the browser, and the network. Smaller ZIP
                downloads are usually fine on a phone.
              </p>
              <p>
                For more detail on selecting files and ZIP downloads, see the{" "}
                <Link
                  to="/how-to-download-terabox-folder"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  how to download a TeraBox folder
                </Link>{" "}
                guide.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Watching on mobile */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                Watching TeraBox Videos <span className="text-primary">on Mobile</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                If you prefer to watch rather than download, the TeraBox Video Player streams supported public
                videos directly in your mobile browser. Paste the link, resolve the share, and playback starts in
                the same browser window.
              </p>
              <p className="mt-4 text-muted-foreground">
                Streaming on a phone works well with a stable connection. See the{" "}
                <Link
                  to="/how-to-watch-terabox-videos"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  how to watch TeraBox videos
                </Link>{" "}
                guide for the full playback workflow.
              </p>
              <div className="mt-6">
                <Button asChild variant="outline" className="h-10 px-5 text-sm">
                  <Link to="/terabox-video-player">
                    <Play className="mr-2 h-4 w-4" />
                    Go to TeraBox Video Player
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Mobile download problems */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Mobile Download <span className="text-primary">Problems</span>
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Smartphone,
                  title: "Check the link",
                  body: "Confirm the full public share URL was copied. A partial link cannot be resolved on any device.",
                },
                {
                  icon: Wifi,
                  title: "Check the connection",
                  body: "Mobile downloads use your network. A slow or unstable connection can interrupt them.",
                },
                {
                  icon: Globe,
                  title: "Browser download settings",
                  body: "Some mobile browsers manage downloads differently. Check the browser's download and storage settings.",
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
              If a download still will not start, work through the{" "}
              <Link
                to="/terabox-video-link-not-working"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                TeraBox link troubleshooting guide
              </Link>
              .
            </p>
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
                  TeraBox Mobile <span className="text-primary">FAQ</span>
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Quick answers to common questions about using TeraPlayer on a phone or tablet.
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
                Download TeraBox videos on your phone
              </h2>
              <p className="mt-3 text-muted-foreground">
                Open a supported public TeraBox link in your mobile browser and watch or download supported files
                with TeraPlayer, no app required.
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
                <Link to="/terabox-video-downloader" className="transition-colors duration-200 hover:text-foreground">
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