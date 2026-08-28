import { useEffect } from "react";
import { motion } from "framer-motion";
import Seo from "../components/Seo";
import { Link } from "react-router-dom";
import {
  Smartphone,
  Monitor,
  ExternalLink,
  Globe,
  Download,
  Play,
  Archive,
  AlertCircle,
  ChevronRight,
  HelpCircle,
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
    title: "Copy the TeraBox share link",
    body: "Find the file or folder in TeraBox, generate a public share link, and copy the complete URL to your clipboard.",
  },
  {
    title: "Open TeraPlayer in your browser",
    body: "Visit the TeraBox Video Downloader in the browser on your phone, tablet, or desktop. Everything happens online, so there is nothing to install.",
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
    q: "Can I download TeraBox videos on a PC?",
    a: "Yes. TeraPlayer runs in any compatible desktop browser on Windows, macOS, or Linux. There is no PC application and no installer to download — you simply open the site in a browser.",
  },
  {
    q: "Is there a TeraPlayer mobile app or desktop application?",
    a: "No. TeraPlayer is a browser-based tool. There is no mobile app to install, no desktop application, and no app store visit required. You simply use the site in any compatible browser.",
  },
  {
    q: "Does TeraPlayer download to my phone or computer?",
    a: "Downloads start from your browser and save through your device's normal download flow. The exact behavior can vary by browser and device, but the workflow itself runs entirely in the browser.",
  },
  {
    q: "Can I download multiple TeraBox files as a ZIP on mobile?",
    a: "Yes. On a supported multi-file share, the folder view lets you select several files and download them together as a ZIP archive. Very large sets may be more reliable on a desktop, depending on device resources.",
  },
  {
    q: "Can I watch TeraBox videos without downloading them?",
    a: "Yes. Paste the supported public link into the TeraBox Video Player to stream supported videos directly in your browser, without saving a copy.",
  },
  {
    q: "Why won't a TeraBox download start on my device?",
    a: "Check that the full public link was copied and the share is still public and available. If the link resolves but the download does not start, check your browser's download settings and connection, and try once more.",
  },
  {
    q: "Do I need a TeraPlayer account to download on any device?",
    a: "No. TeraPlayer works entirely in your browser. You can preview, watch, and download from supported public TeraBox links on any device without signing in.",
  },
  {
    q: "Is TeraPlayer compatible with every browser?",
    a: "TeraPlayer works in modern, compatible browsers, but the exact experience can vary by browser and device. A supported browsing experience requires a current browser and a working connection.",
  },
];

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Download TeraBox Videos on Mobile & Desktop",
  description:
    "Learn how to use TeraPlayer on a phone, tablet, or desktop to open supported public TeraBox links, watch videos, and download supported files from your browser.",
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

      <Seo
        title="TeraBox Downloader on Mobile & Desktop: Download Videos on Any Device | TeraPlayer"
        description="Learn how to use TeraPlayer on a phone, tablet, or desktop to open supported public TeraBox links, watch videos, and download supported files directly from your browser — no app or software required."
        path="/terabox-download-mobile"
        ogTitle="TeraBox Downloader on Mobile & Desktop: Download Videos on Any Device | TeraPlayer"
        ogDescription="Learn how to use TeraPlayer on any device to open supported public TeraBox links and download files from your browser."
        imageAlt="TeraBox Downloader on Mobile & Desktop - TeraPlayer"
        twitterDescription="Learn how to use TeraPlayer on any device to open supported public TeraBox links and download files from your browser."
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
                <Smartphone className="h-3.5 w-3.5 text-primary" />
                <Monitor className="h-3.5 w-3.5 text-primary" />
                Mobile & desktop guide
              </div>
              <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl lg:text-6xl">
                TeraBox Downloader on{" "}
                <span className="text-primary">Mobile & Desktop</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                TeraPlayer is a browser-based tool, so it works on phones, tablets, and desktops without installing
                an app or software. With a supported public TeraBox link, you can watch videos and download
                supported files directly from your browser.
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
                This guide covers the workflow on any device, including folder and ZIP downloads, watching videos,
                and what to check when a download does not work.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild className="h-auto min-w-0 whitespace-normal px-5 py-2.5 text-sm">
                  <Link to="/terabox-video-downloader">
                    <Download className="mr-2 h-4 w-4" />
                    Open the TeraBox Video Downloader
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Can you download on any device */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Can You Download TeraBox Videos <span className="text-primary">on Any Device?</span>
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                Yes. TeraPlayer runs entirely in a web browser, and phones, tablets, and desktops all have capable
                browsers. As long as you can open the site in a compatible browser, the same paste-a-link workflow for
                watching and downloading supported public TeraBox content is available.
              </p>
              <p>
                There is no native Android, iOS, Windows, macOS, or Linux app to install. TeraPlayer is not a
                dedicated application; it is a browser-based tool you open the same way you open any website. That
                means no app to update and no app-store visit, but it also means the experience depends on the
                browser and device you are using.
              </p>
              <p>
                Downloads started from a browser save through your device's usual download flow, the same way other
                files save on your phone, tablet, or computer. The fundamentals of the workflow are the same across
                devices, even though the exact screen layout differs.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Use TeraPlayer on any device */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                How to Use TeraPlayer <span className="text-primary">on Any Device</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                The workflow has four steps. Everything happens in the browser, on the device you are already using:
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
                the viewport. On desktop, you get a larger workspace for browsing folders and managing multiple
                downloads. The core flow stays the same across devices.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Multiple files and ZIP on any device */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Downloading Multiple Files or ZIPs <span className="text-primary">on Any Device</span>
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                When a supported public TeraBox share contains several files, the folder view appears on any device.
                You can browse, search, and sort the folder, then select multiple files that have downloadable links
                and download them together as a ZIP archive.
              </p>
              <p>
                The ZIP is built in your browser on your device. On a phone, very large selections may take longer
                or may not complete, depending on the device's memory, the browser, and the network. On a desktop,
                larger ZIP downloads are generally more reliable due to more memory and typically faster connections.
                Smaller ZIP downloads are usually fine on any device.
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

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-border bg-surface-raised p-5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Smartphone className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-semibold">Mobile</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  The responsive interface works in mobile browsers. Copy a share link, paste it into TeraPlayer,
                  and use the folder view to pick the files you need. Small to medium ZIP downloads work well.
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
                  <Monitor className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-semibold">Desktop</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  A full-size browser makes it easy to paste links and review folder contents. Larger ZIP downloads
                  are more reliable on desktop due to more memory and typically faster connections. The saved ZIP
                  lands in your normal download folder.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Watching on any device */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                Watching TeraBox Videos <span className="text-primary">on Any Device</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                If you prefer to watch rather than download, the TeraBox Video Player streams supported public
                videos directly in your browser. Paste the link, resolve the share, and playback starts in the same
                browser window.
              </p>
              <p className="mt-4 text-muted-foreground">
                Streaming works well with a stable connection on any device. See the{" "}
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

        {/* Download problems on any device */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Download <span className="text-primary">Problems</span> on Any Device
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
                  body: "Downloads use your network. A slow or unstable connection can interrupt them.",
                },
                {
                  icon: Globe,
                  title: "Browser download settings",
                  body: "Some browsers manage downloads differently. Check the browser's download and storage settings.",
                },
                {
                  icon: Monitor,
                  title: "Desktop browser settings",
                  body: "On desktop, check that your browser allows downloads and the download folder is writable.",
                },
                {
                  icon: HardDrive,
                  title: "Storage space",
                  body: "Ensure your device has enough free space for the download, especially for large files or ZIPs.",
                },
                {
                  icon: AlertCircle,
                  title: "Try another browser",
                  body: "If one browser has issues, try another compatible browser. This rules out browser-specific problems.",
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
                  Questions & answers
                </div>
                <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                  TeraBox Downloader <span className="text-primary">FAQ</span>
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Quick answers to common questions about using TeraPlayer on any device.
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
                Download TeraBox videos on any device
              </h2>
              <p className="mt-3 text-muted-foreground">
                Open a supported public TeraBox link in your browser and watch or download supported files with
                TeraPlayer, no app or software required.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button asChild className="h-auto min-w-0 whitespace-normal px-5 py-3 text-base" size="lg">
                  <Link to="/terabox-video-downloader">
                    <Download className="mr-2 h-5 w-5" />
                    Go to TeraBox Video Downloader
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 px-8 text-base" size="lg">
                  <Link to="/">
                    <Smartphone className="mr-2 h-5 w-5" />
                    <Monitor className="mr-2 h-5 w-5" />
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