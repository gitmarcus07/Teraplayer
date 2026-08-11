import { useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  Link2,
  ExternalLink,
  Globe,
  Lock,
  AlertCircle,
  Eye,
  Play,
  Download,
  ChevronRight,
  HelpCircle,
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

const faqs = [
  {
    q: "What is a TeraBox public link?",
    a: "A TeraBox public link is a share URL that lets anyone with the link open shared files. When the share is set to public, the content can be viewed by people who are not TeraBox account holders.",
  },
  {
    q: "How do I use a TeraBox public link with TeraPlayer?",
    a: "Copy the public share link, paste it into the TeraBox Video Downloader or TeraBox Video Player, and let TeraPlayer resolve it. If the share is a supported public link, TeraPlayer shows a preview of the file or folder.",
  },
  {
    q: "Can TeraPlayer open a private TeraBox link?",
    a: "No. TeraPlayer is intended for supported public TeraBox share links. Private, restricted, or access-controlled content cannot be accessed, and TeraPlayer does not bypass passwords, authentication, DRM, or any other access controls.",
  },
  {
    q: "Why is my TeraBox public link not working?",
    a: "A public link can fail if the URL was not copied in full, the share is no longer public or has expired, the content is restricted, or the link is not from a supported domain. Check the full URL and confirm the share is still public and available.",
  },
  {
    q: "How do I make a TeraBox link public?",
    a: "In TeraBox, open the sharing options for the file or folder and choose a public share setting, then copy the generated share link. The person receiving the link can then open it as a public share.",
  },
  {
    q: "Can I watch a shared TeraBox video without downloading it?",
    a: "Yes. Paste the supported public link into the TeraBox Video Player to preview and stream supported videos directly in your browser, without saving a copy to your device.",
  },
  {
    q: "Can I download a shared TeraBox file?",
    a: "Yes. When the public link resolves in the TeraBox Video Downloader, you can download the supported files from your browser. Files that cannot be resolved cannot be downloaded.",
  },
  {
    q: "Do I need an account to open a TeraBox public link?",
    a: "No. TeraPlayer works entirely in your browser. You can preview, watch, and download from supported public TeraBox links without signing in.",
  },
];

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

export default function TeraBoxPublicLink() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Helmet>
        <title>TeraBox Public Link Guide: How Shared Links Work | TeraPlayer</title>
        <meta
          name="description"
          content="Learn what a public TeraBox share link is, how to use supported links with TeraPlayer, and what to do when a shared link is private, expired, restricted, or unsupported."
        />
        <link rel="canonical" href="https://www.teraplayer.in/terabox-public-link" />
        <meta property="og:title" content="TeraBox Public Link Guide: How Shared Links Work | TeraPlayer" />
        <meta
          property="og:description"
          content="Learn what a TeraBox public share link is, how to use supported links with TeraPlayer, and what to do when a shared link no longer works."
        />
        <meta property="og:url" content="https://www.teraplayer.in/terabox-public-link" />
        <meta property="og:image" content="https://www.teraplayer.in/logo.png" />
        <meta property="og:image:alt" content="TeraBox Public Link Guide - TeraPlayer" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TeraBox Public Link Guide: How Shared Links Work | TeraPlayer" />
        <meta
          name="twitter:description"
          content="Learn what a TeraBox public share link is, how to use supported links with TeraPlayer, and what to do when a shared link no longer works."
        />
        <meta name="twitter:image" content="https://www.teraplayer.in/logo.png" />
        <meta name="twitter:image:alt" content="TeraBox Public Link Guide - TeraPlayer" />
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
                <Link2 className="h-3.5 w-3.5 text-primary" />
                Public link guide
              </div>
              <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl lg:text-6xl">
                TeraBox Public Link Guide: <span className="text-primary">How Shared Links Work</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                A TeraBox public link is a share URL that opens a file or folder for anyone who has it. This guide
                explains what a public share is, how TeraPlayer works with supported public TeraBox links, and what
                to do when a shared link will not open.
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
                It also covers the important limits: TeraPlayer works with supported public links only. Private,
                restricted, or expired shares cannot be accessed, and TeraPlayer does not bypass any access
                controls.
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

        {/* What is a public link */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              What Is a <span className="text-primary">TeraBox Public Link?</span>
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                When someone shares a file or folder in TeraBox, the share is given a URL. If the share is public,
                that URL can be opened by anyone who receives it, without needing access to the original TeraBox
                account. This is the kind of link that most TeraBox sharing generates.
              </p>
              <p>
                A public share is different from a private one. A private or restricted share keeps the content
                behind the owner's account, and opening it requires the right credentials. Only public shares can be
                opened through a plain link, which is why tools like TeraPlayer accept public share links rather than
                private ones.
              </p>
              <p>
                Public shares can also change over time. An owner can remove a share, reset its sharing link, or
                restrict it after publishing. That is why a public link that worked yesterday may no longer open
                today.
              </p>
            </div>
          </motion.div>
        </section>

        {/* How to use with TeraPlayer */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                How to Use a TeraBox Public Link <span className="text-primary">with TeraPlayer</span>
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <p>
                  Using a supported public TeraBox link with TeraPlayer follows the same paste-a-link workflow as
                  everything else on the site. Copy the full public share URL from TeraBox, open the TeraBox Video
                  Downloader or TeraBox Video Player, and paste the link into the input field.
                </p>
                <p>
                  Once the link is pasted, TeraPlayer tries to resolve the share. When it succeeds, you see a
                  preview with the file or folder details. From there you can watch supported videos or download
                  supported files, depending on the tool you are using.
                </p>
                <p>
                  It helps to copy the entire URL. A truncated or mistyped link cannot be resolved, no matter how
                  public the share is. If the link was pasted in full and still does not load, the share itself may
                  no longer be public or available.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Public vs private */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Public vs Private <span className="text-primary">TeraBox Links</span>
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
                  <Globe className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-semibold">Public links</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Openable by anyone with the URL. Public shares are what TeraPlayer supports, from supported
                  domains, as long as the share is still available.
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
                  <Lock className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-semibold">Private or restricted</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Require the owner's account or credentials to open. TeraPlayer cannot access this content, and it
                  does not bypass passwords, authentication, DRM, or other access controls.
                </p>
              </motion.div>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              If someone sends you a TeraBox link that will not open in TeraPlayer, it most likely falls into the
              second category, or the public share has expired or been removed.
            </p>
          </motion.div>
        </section>

        {/* Why a public link may not work */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                Why a TeraBox Public Link <span className="text-primary">May Not Work</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Even a public link can fail for reasons outside your control. Common causes include:
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: AlertCircle,
                    title: "Incomplete URL",
                    body: "The link was not copied in full, or extra characters were included. A partial URL cannot be resolved.",
                  },
                  {
                    icon: Lock,
                    title: "Share is no longer public",
                    body: "The owner may have restricted the share or reset its link after it was published.",
                  },
                  {
                    icon: Globe,
                    title: "Expired or removed share",
                    body: "If the owner deleted the share, the link no longer points to anything.",
                  },
                  {
                    icon: Monitor,
                    title: "Unsupported link",
                    body: "TeraPlayer works with public TeraBox share links from supported domains. Some links are not supported.",
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
                For a fuller walkthrough, see the{" "}
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

        {/* Watch a shared video */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              How to Watch a <span className="text-primary">Shared TeraBox Video</span>
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                If someone shared a TeraBox video with a public link, you can watch it without downloading a thing.
                Paste the link into the{" "}
                <Link
                  to="/terabox-video-player"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  TeraBox Video Player
                </Link>{" "}
                and stream supported public videos directly in your browser.
              </p>
              <p>
                Playback happens inside the browser, so there is nothing to install and no account needed. When a
                share contains several files, TeraPlayer shows the folder view so you can pick the video you want to
                watch. For the full steps, see the{" "}
                <Link
                  to="/how-to-watch-terabox-videos"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  how to watch TeraBox videos
                </Link>{" "}
                guide.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild variant="outline" className="h-10 px-5 text-sm">
                  <Link to="/terabox-video-player">
                    <Play className="mr-2 h-4 w-4" />
                    Go to TeraBox Video Player
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Download a shared file */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                How to Download a <span className="text-primary">Shared TeraBox File</span>
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <p>
                  To save a supported file from a public share, paste its link into the{" "}
                  <Link
                    to="/terabox-video-downloader"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    TeraBox Video Downloader
                  </Link>{" "}
                  and use the download flow from your browser. For a single file, resolve the link and download it
                  directly. For a folder, use the selection and ZIP features to download several supported files
                  together.
                </p>
                <p>
                  Downloads only work when the underlying supported public share can be resolved. If the share is
                  private, expired, or unsupported, there is nothing to download. For step-by-step instructions, see
                  the{" "}
                  <Link
                    to="/how-to-download-terabox-videos"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    how to download TeraBox videos
                  </Link>{" "}
                  guide.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button asChild variant="outline" className="h-10 px-5 text-sm">
                    <Link to="/terabox-video-downloader">
                      <Download className="mr-2 h-4 w-4" />
                      Go to TeraBox Video Downloader
                    </Link>
                  </Button>
                </div>
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
                TeraBox Public Link <span className="text-primary">FAQ</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Quick answers to common questions about TeraBox public links and shared content.
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
                Have a TeraBox public link to open?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Paste a supported public TeraBox link into TeraPlayer to watch videos or download supported files,
                all from your browser.
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
                    <Eye className="mr-2 h-5 w-5" />
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
                  to="/how-to-watch-terabox-videos"
                  className="transition-colors duration-200 hover:text-foreground"
                >
                  Watch guide
                </Link>
                <Link
                  to="/terabox-video-link-not-working"
                  className="transition-colors duration-200 hover:text-foreground"
                >
                  Link help
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}