import { useEffect } from "react";
import { motion } from "framer-motion";
import Seo from "../components/Seo";
import { Link } from "react-router-dom";
import {
  FolderOpen,
  ExternalLink,
  Archive,
  FileVideo,
  AlertCircle,
  Globe,
  Wifi,
  Smartphone,
  Monitor,
  ChevronRight,
  HelpCircle,
  Download,
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
    title: "Copy the public TeraBox folder or share link",
    body: "Find the folder or share you want and copy its public link. Make sure the link is one others can open.",
  },
  {
    title: "Open TeraPlayer",
    body: "Head over to TeraPlayer's TeraBox Video Downloader in your browser. Everything happens online, so there is nothing to install.",
  },
  {
    title: "Paste the link",
    body: "Paste the link you copied into the input field at the top of the page.",
  },
  {
    title: "Let TeraPlayer resolve the share",
    body: "When a supported share contains several files, TeraPlayer detects the folder structure and shows the files it found.",
  },
  {
    title: "Review the available files",
    body: "Use the folder view to browse, search, and sort the files in the share. Video files can be previewed or played directly.",
  },
  {
    title: "Download the supported files you need",
    body: "Download a single file at a time, or select multiple supported files and download them together as one ZIP archive.",
  },
];

const faqs = [
  {
    q: "Can I download a TeraBox folder with TeraPlayer?",
    a: "When a supported public TeraBox share contains multiple files, TeraPlayer detects the folder structure and lets you browse it. You can download individual supported files or select several files and download them together as a single ZIP archive.",
  },
  {
    q: "Can I download multiple TeraBox files at once?",
    a: "Yes. In the folder view, you can select multiple supported files and download them together as one ZIP archive, as long as each selected file has a downloadable link.",
  },
  {
    q: "Does TeraPlayer support TeraBox folder links?",
    a: "TeraPlayer supports public TeraBox share links from supported domains. When such a share contains several files, it is shown as a folder you can browse.",
  },
  {
    q: "Can I download an individual video from a TeraBox folder?",
    a: "Yes. Each file shown in the folder view has its own download option, so you can save just the video you want instead of the whole share.",
  },
  {
    q: "What should I do if my TeraBox folder link does not work?",
    a: "Check that the complete link was copied, confirm the share is still public and available, and retry. If the link still fails, see the TeraBox link troubleshooting guide.",
  },
  {
    q: "Can I watch a TeraBox video instead of downloading it?",
    a: "Yes. Use the TeraBox Video Player to preview and stream supported videos in your browser, or follow the how to watch TeraBox videos guide.",
  },
  {
    q: "Do I need an account to use TeraPlayer?",
    a: "No. TeraPlayer works entirely in your browser. You can browse, watch, and download from supported public TeraBox links without signing in.",
  },
  {
    q: "Does TeraPlayer support every TeraBox folder?",
    a: "No. TeraPlayer supports public TeraBox share links from supported domains. Some folders may be expired, private, or restricted by the content owner and cannot be accessed.",
  },
];

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Download a TeraBox Folder",
  description:
    "Learn how to work with supported public TeraBox folder and file links using TeraPlayer's browser-based downloader.",
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

export default function HowToDownloadTeraBoxFolder() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Seo
        title="How to Download a TeraBox Folder | TeraPlayer"
        description="Download supported TeraBox folders and files online with TeraPlayer. Browse folder shares, select files, and download them individually or together as a ZIP."
        path="/how-to-download-terabox-folder"
        ogTitle="How to Download a TeraBox Folder | TeraPlayer"
        ogDescription="Learn how to browse supported TeraBox folders and download individual files or a ZIP archive with TeraPlayer."
        imageAlt="How to Download a TeraBox Folder - TeraPlayer"
        twitterDescription="Learn how to browse supported TeraBox folders and download individual files or a ZIP archive with TeraPlayer."
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
                <FolderOpen className="h-3.5 w-3.5 text-primary" />
                Folder and file guide
              </div>
              <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl lg:text-6xl">
                How to Download a <span className="text-primary">TeraBox Folder</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                When a supported public TeraBox share contains several files, TeraPlayer shows it as a folder you
                can browse. From there you can download individual supported files or select several at once and
                download them together.
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Not every TeraBox folder can be opened in TeraPlayer. Shares that are private, restricted, expired,
                or unsupported cannot be resolved, so this guide covers what is actually possible and what to do when
                a folder link will not work.
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

        {/* Numbered workflow */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              How to Download a TeraBox Folder <span className="text-primary">with TeraPlayer</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              The process happens entirely in your browser. Here is how to work with a supported TeraBox folder
              share in TeraPlayer:
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
              There is no separate app to install and no account needed. If the share is a supported public link,
              the folder view appears automatically once TeraPlayer resolves it, and the whole workflow runs
              directly in your browser.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Keep in mind that TeraPlayer only works with supported public TeraBox shares. A folder that is private,
              restricted, or no longer available cannot be resolved, no matter how many files it contains.
            </p>
          </motion.div>
        </section>

        {/* Folder vs individual file */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                TeraBox Folder <span className="text-primary">vs</span> Individual File Downloads
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <p>
                  A folder share contains several files in one link, while an individual share points to a single
                  file. TeraPlayer handles both when they are supported public TeraBox links, but the workflow
                  differs slightly.
                </p>
                <p>
                  For a single-file share, resolving the link shows one preview that you can download directly. For a
                  multi-file share, TeraPlayer shows a folder view with the files it found, where you can pick what
                  you need.
                </p>
                <p>
                  The folder view adds tools you will not see for a single file: a file count, search, sorting, and
                  the option to select several files at once. That makes it a better fit when a share holds many
                  files and you want to choose which ones to keep.
                </p>
                <p>
                  Both flows live in the{" "}
                  <Link
                    to="/terabox-video-downloader"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    TeraBox Video Downloader
                  </Link>
                  , so you use the same paste-a-link workflow either way.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Multiple files */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Can You Download Multiple <span className="text-primary">TeraBox Files?</span>
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                Yes. When TeraPlayer resolves a supported multi-file share, the folder view lets you select several
                files at once and download them together as a single ZIP archive.
              </p>
              <p>
                Each selected file still needs a downloadable link for the ZIP step to work, so a file that cannot be
                resolved on its own cannot be included. The folder view also lets you download files one at a time if
                you prefer.
              </p>
              <p>
                Multi-file downloads are built in your browser, so they work the same way whether you are on a phone
                or a desktop. For large sets of files, downloading a few at a time can be more reliable than trying
                to grab everything at once.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: FileVideo,
                  title: "Browse",
                  body: "See the files in a supported share with grid or list views, and search or sort within the folder.",
                },
                {
                  icon: Download,
                  title: "Select",
                  body: "Choose a single file or select several supported files from the folder at the same time.",
                },
                {
                  icon: Archive,
                  title: "ZIP",
                  body: "Download the selected supported files together as one ZIP archive built in your browser.",
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
          </motion.div>
        </section>

        {/* Folder link problems */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                TeraBox Folder Link <span className="text-primary">Not Working?</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Folder links can fail for several reasons. Common possibilities include:
              </p>
              <p className="mt-4 text-muted-foreground">
                Before trying anything else, confirm that the full link was copied and that the share is still
                public. A quick retry after re-pasting the complete URL resolves many issues on its own.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: AlertCircle,
                    title: "Incomplete URL",
                    body: "Make sure the whole link was copied. A truncated or mistyped URL cannot be resolved.",
                  },
                  {
                    icon: FolderOpen,
                    title: "Unavailable share",
                    body: "If the owner removed the share or it is otherwise unavailable, the link will stop working.",
                  },
                  {
                    icon: Globe,
                    title: "Private or restricted content",
                    body: "TeraPlayer cannot access private or restricted content, and does not bypass access controls.",
                  },
                  {
                    icon: Wifi,
                    title: "Unsupported link or network problem",
                    body: "Some links are not supported, and slow or unstable connections can briefly break resolution.",
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
                      <item.icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                  </motion.div>
                ))}
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                For a fuller step-by-step walkthrough, see the{" "}
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

        {/* Watching a video from a folder */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              How to Watch a <span className="text-primary">TeraBox Video</span> Instead
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                If you only want to preview or stream a supported video rather than save it, TeraPlayer offers a
                dedicated streaming experience. Use the{" "}
                <Link
                  to="/terabox-video-player"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  TeraBox Video Player
                </Link>{" "}
                to play supported public TeraBox videos directly in your browser.
              </p>
              <p>
                For the full workflow of browsing and playing a supported share, our{" "}
                <Link
                  to="/how-to-watch-terabox-videos"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  how to watch TeraBox videos
                </Link>{" "}
                guide covers the steps from pasting a link to starting playback.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Individual video download */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                How to Download an Individual <span className="text-primary">TeraBox Video</span>
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <p>
                  Downloading a single supported video is often simpler than working with a folder. Paste the link
                  for the individual file, resolve it, and download what you need for a single supported video.
                </p>
                <p>
                  For step-by-step instructions, see our{" "}
                  <Link
                    to="/how-to-download-terabox-videos"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    how to download TeraBox videos
                  </Link>{" "}
                  guide. An individual-file workflow is a good fit when you already have the exact link for the video
                  you want.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Mobile and desktop */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Downloading TeraBox Files on <span className="text-primary">Mobile and Desktop</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Because TeraPlayer runs in a browser, the same workflow works across phones, tablets, laptops, and
              desktop computers. There is nothing to install in advance, and the same folder and file workflow is
              available across supported devices.
            </p>
            <p className="mt-4 text-muted-foreground">
              Downloading a single file or a small ZIP is straightforward on any device. For large folders, a desktop
              or laptop can be easier to work with simply because the screen is larger and the download manager is
              easier to manage.
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
                <h3 className="text-sm font-semibold">Laptop and desktop</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  A full-size browser makes it easy to paste links and review folder contents. Downloads save to your
                  normal download folder.
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
                  The responsive interface works in mobile browsers. Copy a share link, paste it into TeraPlayer, and
                  use the folder view to pick the files you need.
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
                  Frequently Asked <span className="text-primary">Questions</span>
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Quick answers to common questions about downloading TeraBox folders and files with TeraPlayer.
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
                Ready to download files from a TeraBox share?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Paste a supported public TeraBox link into the TeraBox Video Downloader to browse the folder and
                download the supported files you need.
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
                  to="/terabox-video-downloader"
                  className="transition-colors duration-200 hover:text-foreground"
                >
                  Downloader
                </Link>
                <Link
                  to="/how-to-download-terabox-videos"
                  className="transition-colors duration-200 hover:text-foreground"
                >
                  Download guide
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}