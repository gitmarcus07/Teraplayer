import { useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  Monitor,
  ExternalLink,
  Download,
  Play,
  Archive,
  FolderOpen,
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
    body: "Find the file or folder you want and copy its public share link. Make sure the complete URL is selected before copying.",
  },
  {
    title: "Open TeraPlayer on your PC",
    body: "Open the TeraBox Video Downloader in a desktop browser. Everything runs online, so there is no software to install.",
  },
  {
    title: "Paste the link and resolve the share",
    body: "Paste the public share link into the input field. TeraPlayer resolves the supported share and shows a preview.",
  },
  {
    title: "Watch, download, or create a ZIP",
    body: "Stream supported videos, download individual supported files, or select several files from a folder and download them together as a ZIP.",
  },
];

const faqs = [
  {
    q: "Can I use TeraPlayer on a PC?",
    a: "Yes. TeraPlayer is a browser-based tool, so it runs in any compatible desktop browser on Windows, macOS, or Linux. There is no PC application and no installer to download.",
  },
  {
    q: "How do I download a TeraBox video on PC?",
    a: "Copy a public TeraBox share link, paste it into the TeraBox Video Downloader, wait for the supported share to resolve, choose a quality when available, and start the download from your browser.",
  },
  {
    q: "Is TeraPlayer a Windows application?",
    a: "No. TeraPlayer is a browser-based tool, not a Windows application. You use it through a web browser, and there is no installer or native desktop software.",
  },
  {
    q: "Can I download multiple TeraBox files at once on PC?",
    a: "Yes. When a supported public share contains several files, the folder view lets you select multiple files and download them together as a single ZIP archive.",
  },
  {
    q: "How do I create a ZIP download on PC?",
    a: "Open the folder view, select the files you want that have downloadable links, and press the ZIP button. TeraPlayer builds the archive in your browser, then your PC saves the ZIP file.",
  },
  {
    q: "Can I watch TeraBox videos on PC without downloading them?",
    a: "Yes. Paste a supported public link into the TeraBox Video Player to stream supported videos directly in your desktop browser without saving a copy.",
  },
  {
    q: "Why won't a TeraBox download start on my PC?",
    a: "Check that the full public link was copied and the share is still public and available. If the link resolves but the download does not start, check your browser download settings and connection.",
  },
  {
    q: "Do I need an account to download TeraBox files on PC?",
    a: "No. TeraPlayer works entirely in your browser. You can preview, watch, and download from supported public TeraBox links without signing in.",
  },
];

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Download TeraBox Videos on PC",
  description:
    "Learn how to use TeraPlayer on a PC or desktop browser to open supported public TeraBox links, stream videos, download files, and create ZIP downloads from selected files.",
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

export default function TeraBoxDownloadPC() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Helmet>
        <title>TeraBox Downloader for PC: Download Videos on Desktop | TeraPlayer</title>
        <meta
          name="description"
          content="Learn how to use TeraPlayer on a PC or desktop browser to open supported public TeraBox links, stream videos, download files, and create ZIP downloads from selected files."
        />
        <link rel="canonical" href="https://teraplayer.in/terabox-download-pc" />
        <meta property="og:title" content="TeraBox Downloader for PC: Download Videos on Desktop | TeraPlayer" />
        <meta
          property="og:description"
          content="Learn how to use TeraPlayer on a PC or desktop browser to watch videos, download files, and create ZIP downloads from supported public TeraBox links."
        />
        <meta property="og:url" content="https://teraplayer.in/terabox-download-pc" />
        <meta property="og:image" content="https://teraplayer.in/logo.png" />
        <meta property="og:image:alt" content="TeraBox Downloader for PC - TeraPlayer" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TeraBox Downloader for PC: Download Videos on Desktop | TeraPlayer" />
        <meta
          name="twitter:description"
          content="Learn how to use TeraPlayer on a PC or desktop browser to watch videos, download files, and create ZIP downloads from supported public TeraBox links."
        />
        <meta name="twitter:image" content="https://teraplayer.in/logo.png" />
        <meta name="twitter:image:alt" content="TeraBox Downloader for PC - TeraPlayer" />
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
                <Monitor className="h-3.5 w-3.5 text-primary" />
                PC and desktop guide
              </div>
              <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl lg:text-6xl">
                TeraBox Downloader for PC:{" "}
                <span className="text-primary">Download Videos on Desktop</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                TeraPlayer is a browser-based tool, so it works right on your desktop. With a supported public
                TeraBox link, you can stream videos, download supported files, and create ZIP downloads from
                selected files without installing anything.
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
                This guide covers the desktop workflow: downloading individual videos, downloading multiple files,
                creating ZIP archives, and watching videos on a PC.
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

        {/* Can you use TeraPlayer on a PC */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Can You Use TeraPlayer <span className="text-primary">on a PC?</span>
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                Yes. TeraPlayer runs in a web browser, and a desktop browser on a PC is one of the most comfortable
                ways to use it. There is no Windows application, no installer, and no native desktop software to
                download — you simply open the site in a browser and paste a supported public TeraBox link.
              </p>
              <p>
                Because everything runs in the browser, TeraPlayer works the same core way on a PC as it does on
                other devices. A desktop has a larger screen, a full keyboard, and typically more memory, which can
                make handling larger folders and ZIP downloads more comfortable.
              </p>
              <p>
                Keep in mind that TeraPlayer still depends on the browser you use and the network you are on. The
                browser-based workflow does not change the fundamental limits of which links are supported and
                public.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Download a video on PC */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                How to Download a TeraBox Video <span className="text-primary">on PC</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                The desktop download flow has four steps. Everything happens in your browser:
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
                For step-by-step detail on single-file downloads, see the{" "}
                <Link
                  to="/how-to-download-terabox-videos"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  how to download TeraBox videos
                </Link>{" "}
                guide.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Multiple files on PC */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Downloading Multiple TeraBox Files <span className="text-primary">on PC</span>
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                When a supported public TeraBox share contains several files, TeraPlayer shows it as a folder. On a
                PC you can browse, search, and sort that folder, and download files individually or in groups.
              </p>
              <p>
                For many files at once, select the files you want and download them together as one ZIP archive. A
                desktop browser's memory usually handles larger selections more comfortably than a phone, though the
                exact result still depends on the files and your connection.
              </p>
              <p>
                For a full walkthrough of folder downloads, including file selection and ZIP creation, see the{" "}
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

        {/* Creating a ZIP on PC */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                Creating a ZIP Download <span className="text-primary">on PC</span>
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: Archive,
                    title: "Select files",
                    body: "In the folder view, tick the checkbox on each file you want, or use select all.",
                  },
                  {
                    icon: Download,
                    title: "Create the ZIP",
                    body: "Press the ZIP button. TeraPlayer gathers the selected supported files and builds the archive.",
                  },
                  {
                    icon: FolderOpen,
                    title: "Save on your PC",
                    body: "Your browser saves the ZIP file to the download folder on your PC.",
                  },
                ].map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.05 * i }}
                    className="rounded-2xl border border-border bg-surface-raised p-5"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <f.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-sm font-semibold">{f.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
                  </motion.div>
                ))}
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                Each file added to the ZIP needs a downloadable link, and the archive is built in your browser. See
                the{" "}
                <Link
                  to="/terabox-zip-download"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  TeraBox ZIP download guide
                </Link>{" "}
                for everything about creating ZIP archives.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Watching on PC */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Watching TeraBox Videos <span className="text-primary">on PC</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              If you want to watch rather than save, the TeraBox Video Player streams supported public videos
              directly in your desktop browser. Paste the link, resolve the share, and start playback on your PC.
            </p>
            <p className="mt-4 text-muted-foreground">
              A desktop screen gives you a full-size playback window. For the full workflow, see the{" "}
              <Link
                to="/how-to-watch-terabox-videos"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                how to watch TeraBox videos
              </Link>{" "}
              guide.
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
        </section>

        {/* PC download problems */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                TeraBox PC Download <span className="text-primary">Problems</span>
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: AlertCircle,
                    title: "Check the link",
                    body: "Confirm the full public share URL was copied. A partial link cannot be resolved on any device.",
                  },
                  {
                    icon: Wifi,
                    title: "Check the connection",
                    body: "Downloads use your network. A slow or unstable connection can interrupt them.",
                  },
                  {
                    icon: HardDrive,
                    title: "Browser and storage",
                    body: "Check the browser's download settings and make sure the download folder is writable.",
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
                TeraBox Downloader for PC <span className="text-primary">FAQ</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Quick answers to common questions about using TeraPlayer on a PC or desktop.
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
                Download TeraBox videos on your PC
              </h2>
              <p className="mt-3 text-muted-foreground">
                Open a supported public TeraBox link in your desktop browser and watch or download supported files
                with TeraPlayer, no software required.
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