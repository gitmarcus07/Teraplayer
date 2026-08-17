import { useEffect } from "react";
import { motion } from "framer-motion";
import Seo from "../components/Seo";
import { Link } from "react-router-dom";
import {
  Archive,
  ExternalLink,
  Download,
  FileVideo,
  FolderOpen,
  CheckSquare,
  AlertCircle,
  ChevronRight,
  HelpCircle,
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
    title: "Open a supported TeraBox folder",
    body: "Paste a public TeraBox share link into the TeraBox Video Downloader and let TeraPlayer resolve it. When the share contains several files, it is shown as a folder you can browse.",
  },
  {
    title: "Select the files you want",
    body: "In the folder view, tick the checkbox on each file you want to include. You can also use the select all option to mark every file in the current list.",
  },
  {
    title: "Create the ZIP download",
    body: "Press the ZIP button. TeraPlayer fetches each selected file that has a downloadable link and builds the archive in your browser.",
  },
  {
    title: "Save the archive to your device",
    body: "When the archive is ready, your browser downloads it as a ZIP file. You can then open it or move it wherever you like.",
  },
];

const faqs = [
  {
    q: "Can I download multiple TeraBox files as one ZIP?",
    a: "Yes. When TeraPlayer shows a supported multi-file share as a folder, you can select several files that have downloadable links and download them together as a single ZIP archive built in your browser.",
  },
  {
    q: "How do I select multiple TeraBox files for a ZIP download?",
    a: "Open the folder view, tick the checkbox on each file you want, or use the select all option to mark every file in the current list, then press the ZIP button.",
  },
  {
    q: "Where is the ZIP archive created?",
    a: "The ZIP archive is created in your browser using client-side tooling. TeraPlayer collects the selected files and compresses them locally, so the final ZIP file is produced and downloaded on your device.",
  },
  {
    q: "Why is a file missing from my ZIP download?",
    a: "Each file added to a ZIP needs a working downloadable link. If a selected file has no direct link or its link cannot be resolved, it cannot be included in the archive.",
  },
  {
    q: "Can every TeraBox file be added to a ZIP download?",
    a: "No. TeraPlayer only works with supported public TeraBox shares, and each file in the folder must have its own downloadable link to be included. Private, restricted, or unresolvable files cannot be added.",
  },
  {
    q: "Is there a limit on ZIP download size?",
    a: "There is no fixed limit set by TeraPlayer, but the archive is built in your browser. Very large selections depend on your device, browser, and network resources, so not every ZIP is guaranteed to succeed.",
  },
  {
    q: "Can I create a ZIP download on a phone?",
    a: "Yes. The same folder view runs in a mobile browser, so you can select files and create a ZIP on a phone or tablet. Very large sets may be more reliable on a desktop simply because of device resources.",
  },
  {
    q: "Do I need an account to download files as a ZIP?",
    a: "No. TeraPlayer works entirely in your browser. You can select supported files and download them as a ZIP without signing in.",
  },
];

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Create a TeraBox ZIP Download",
  description:
    "Learn how to select multiple supported TeraBox files and download them together as a ZIP archive using TeraPlayer.",
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

export default function TeraBoxZipDownload() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Seo
        title="TeraBox File Downloader — ZIP & Folder Downloads | TeraPlayer"
        description="Download multiple supported TeraBox files as one ZIP with TeraPlayer. Browse folders, select files, and download them together from your browser."
        path="/terabox-zip-download"
        ogTitle="TeraBox File Downloader — ZIP & Folder Downloads | TeraPlayer"
        ogDescription="Download multiple supported TeraBox files as one ZIP with TeraPlayer, right from your browser."
        imageAlt="TeraBox File Downloader - TeraPlayer"
        twitterDescription="Download multiple supported TeraBox files as one ZIP with TeraPlayer, right from your browser."
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
                <Archive className="h-3.5 w-3.5 text-primary" />
                ZIP download guide
              </div>
              <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl lg:text-6xl">
                TeraBox ZIP Download: <span className="text-primary">Download Multiple Files</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                When a supported public TeraBox share contains several files, TeraPlayer shows them in a folder
                view. From there you can select multiple supported files and download them together as one ZIP
                archive, built directly in your browser.
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
                This page explains how ZIP downloads work with TeraPlayer, how to select files, and what to keep in
                mind about size and compatibility before you start a larger archive.
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

        {/* How ZIP downloads work */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              How TeraBox ZIP Downloads <span className="text-primary">Work</span>
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                When a supported public TeraBox share is resolved as a folder, each file in the folder can carry its
                own downloadable link. A ZIP download simply gathers the files you select, fetches each one that has
                a working link, and compresses them into a single archive.
              </p>
              <p>
                The ZIP file is created on your own device using browser-side tooling. TeraPlayer does not combine
                files on a server, and it does not have unlimited resources to draw on. Because the compression
                happens in your browser, the result is a normal ZIP file that your device saves through its usual
                download flow.
              </p>
              <p>
                Not every file can be added to a ZIP. Each selected file needs its own downloadable link, so a file
                that cannot be resolved on its own cannot be included. The archive will contain only the supported
                files that TeraPlayer could fetch successfully.
              </p>
              <p>
                For large selections, the total download depends on your browser, device, and network. A very large
                set of files may take time to gather, and extremely large archives may not complete on every device.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Selecting files */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                How to Select <span className="text-primary">Multiple TeraBox Files</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                The folder view is where you pick the files for a ZIP download. You can browse the files that the
                supported share contains, search within the folder, sort the list, and mark the files you want.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: CheckSquare,
                    title: "Select files",
                    body: "Tick the checkbox on each file you want to include in the ZIP download.",
                  },
                  {
                    icon: FolderOpen,
                    title: "Browse the folder",
                    body: "Browse, search, and sort the files in the folder to find exactly what you need.",
                  },
                  {
                    icon: Archive,
                    title: "Download as ZIP",
                    body: "Press the ZIP button to gather the selected supported files into one archive.",
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
                You can also download files one at a time if you prefer, or select a handful of files from a much
                larger folder instead of the whole set. The ZIP download is not limited to downloading everything at
                once.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Step-by-step workflow */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              How to Create a <span className="text-primary">ZIP Download</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              The whole process stays in your browser. Here is the workflow for creating a ZIP download from a
              supported TeraBox folder:
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

        {/* File cannot be downloaded */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                What Happens If a File <span className="text-primary">Cannot Be Downloaded?</span>
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <p>
                  A ZIP download can only include files that TeraPlayer can fetch. If a selected file has no
                  downloadable link, or its link cannot be resolved, that file cannot be added to the archive.
                </p>
                <p>
                  When this happens, the ZIP is created from the files that did succeed. The unavailable file is
                  simply not included in the final archive, so the resulting ZIP file may contain fewer files than
                  the number you selected.
                </p>
                <p>
                  If a file keeps failing to download, check that the share is still a supported public link and
                  that the file itself can be downloaded on its own. See the{" "}
                  <Link
                    to="/terabox-video-link-not-working"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    TeraBox link troubleshooting guide
                  </Link>{" "}
                  when a link does not behave as expected.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Mobile and desktop */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              ZIP Downloads on <span className="text-primary">Mobile and Desktop</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Because the ZIP is built in your browser, the same workflow runs on phones, tablets, laptops, and
              desktop computers. The limitation is the same everywhere: the archive is created locally, so the size
              and speed of a ZIP download depend on the device and connection you are using.
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
                  A desktop browser has more memory and a faster connection on average, which can make large ZIP
                  downloads more reliable. The saved ZIP lands in your normal download folder.
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
                <h3 className="text-sm font-semibold">Phone and tablet</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  The responsive interface works in mobile browsers. Smaller ZIP downloads are usually fine on a
                  phone, and very large selections may not complete depending on the device's resources.
                </p>
              </motion.div>
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
                  TeraBox ZIP Download <span className="text-primary">FAQ</span>
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Quick answers to common questions about downloading multiple TeraBox files as a ZIP archive.
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
                Ready to download multiple TeraBox files?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Paste a supported public TeraBox link into the TeraBox Video Downloader, select the files you need,
                and download them together as a ZIP archive.
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
                    <FolderOpen className="mr-2 h-5 w-5" />
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
                  to="/how-to-download-terabox-folder"
                  className="transition-colors duration-200 hover:text-foreground"
                >
                  Folder guide
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}