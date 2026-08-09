import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Film,
  Eye,
  Download,
  FolderOpen,
  Archive,
  Shield,
  Globe,
  Zap,
  HeartHandshake,
  ChevronRight,
  Sparkles,
  Lock,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { Button } from "../components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

const features = [
  {
    icon: Eye,
    title: "Instant Preview",
    body: "Paste any public TeraBox link and get an instant rich preview — thumbnail, title, file size, and type — in under two seconds.",
  },
  {
    icon: Film,
    title: "Cinematic Player",
    body: "A custom-built video player with keyboard shortcuts, picture-in-picture mode, playback speed control, and fullscreen.",
  },
  {
    icon: FolderOpen,
    title: "Folder Browsing",
    body: "Navigate shared folders with breadcrumbs, list/grid views, sort by name/size/type, and in-folder search.",
  },
  {
    icon: Archive,
    title: "ZIP Downloads",
    body: "Select multiple files from a folder and download them all as a single ZIP archive with real-time progress.",
  },
  {
    icon: Download,
    title: "Direct Downloads",
    body: "Download individual files directly with resume support and progress tracking.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    body: "No sign-up required. No tracking. Your data stays on your device. Optional Google sign-in syncs across devices only if you choose.",
  },
];

const roadmap = [
  {
    quarter: "Q3 2026",
    items: ["Nested subfolder navigation", "Server-side ZIP generation for large folders", "Progressive image thumbnails"],
  },
  {
    quarter: "Q4 2026",
    items: ["User-created share collections", "Analytics dashboard (opt-in)"],
  },
  {
    quarter: "2027",
    items: ["Mobile native apps (iOS / Android)", "API for developers", "PostgreSQL adapter for self-hosters"],
  },
];

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="tp-container py-16 md:py-24"
        >
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              About TeraPlayer
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tighter sm:text-5xl lg:text-6xl">
              Watch TeraBox links like a{" "}
              <span className="relative inline-block">
                <span className="text-primary">streaming platform.</span>
                <span className="absolute inset-x-0 -bottom-1 h-1 bg-primary/40" />
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              TeraPlayer is a modern, open-web tool that transforms public TeraBox share links into a premium
              streaming experience — no account required, no trackers, no hassle.
            </p>
          </div>
        </motion.div>
      </section>

      {/* What is TeraPlayer */}
      <section className="tp-container py-16 md:py-20">
        <motion.div {...fadeUp} className="mx-auto max-w-4xl">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="text-primary">What</span> is TeraPlayer?
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            <p>
              TeraPlayer is a <span className="font-medium text-foreground">free, open-web application</span> that lets
              you watch and download files from public TeraBox shares instantly. Instead of downloading a file before
              knowing what it is, TeraPlayer gives you a rich preview — thumbnail, title, size — and lets you stream
              video directly in your browser.
            </p>
            <p>
              It uses a multi-layered extraction pipeline: a native HTTP scraper, a self-hosted Cloudflare Worker, and
              community fallback APIs. If one fails, the next takes over automatically. The result is <span className="font-medium text-foreground">the most
              reliable way to access TeraBox content</span> outside the official site.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Mission */}
      <section className="border-y border-border/40 bg-secondary/30">
        <div className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <HeartHandshake className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  Our <span className="text-primary">Mission</span>
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Make TeraBox content accessible without friction. No downloads required just to preview a file. No
                  account necessary just to watch a video. No annoying ads. We believe sharing should be simple,
                  beautiful, and private — and that a paste input + a stunning player is all anyone needs.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="tp-container py-16 md:py-20">
        <motion.div {...fadeUp} className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Everything you <span className="text-primary">need</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            A thoughtfully crafted set of features for casual viewers and power users alike.
          </p>
        </motion.div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              className="group rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                <f.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
              </div>
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Supported Links */}
      <section className="border-y border-border/40 bg-secondary/30">
        <div className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Supported <span className="text-primary">Links</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              TeraPlayer works with any public share link from the following TeraBox domains and mirrors:
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "terabox.com",
                "1024terabox.com",
                "nephobox.com",
                "mirrobox.com",
                "momerybox.com",
                "1024tera.com",
                "teraboxapp.com",
                "freeterabox.com",
                "dubox.com",
              ].map((domain) => (
                <div
                  key={domain}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm"
                >
                  <Globe className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="font-mono text-xs">{domain}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Both single-file shares and multi-file folder shares are supported. Password-protected links are supported
              via an inline password dialog.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Folder & ZIP */}
      <section className="tp-container py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="text-primary">Folder</span> Support &amp; <span className="text-primary">ZIP</span> Downloads
            </h2>
          </motion.div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <FolderOpen className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-semibold">Folder Browser</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {["Breadcrumb navigation", "List and grid view toggle", "Sort by name, size, or type", "In-folder search"].map(
                  (item) => (
                    <li key={item} className="flex items-start gap-2">
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <Archive className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-semibold">ZIP Downloads</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {["Select multiple files at once", "Client-side ZIP via JSZip", "Real-time download progress", "Works with the streaming proxy"].map(
                  (item) => (
                    <li key={item} className="flex items-start gap-2">
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="border-y border-border/40 bg-secondary/30">
        <div className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  Privacy-<span className="text-primary">First</span> Approach
                </h2>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
                  <p>
                    TeraPlayer was built with privacy as a core principle, not an afterthought.{" "}
                    <span className="font-medium text-foreground">You don't need an account</span> to use it — just paste
                    a link and go. No tracking scripts, no analytics cookies, no data sold to third parties.
                  </p>
                  <p>
                    Sign in with Google (optional) to sync your preferences across devices. You can
                    clear all stored data at any time.
                  </p>
                  <p>
                    The extraction pipeline fetches metadata on our server — your IP is never exposed to third-party
                    APIs directly. The streaming proxy keeps your identity private when playing media.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="tp-container py-16 md:py-20">
        <motion.div {...fadeUp} className="mx-auto max-w-4xl">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            What's <span className="text-primary">Next</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            A look at what we're building for the future of TeraPlayer.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {roadmap.map((phase) => (
              <motion.div
                key={phase.quarter}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {phase.quarter}
                </div>
                <ul className="space-y-2">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
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
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to try it?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Paste a TeraBox link and experience the premium streaming difference — no signup required.
            </p>
            <Button asChild className="mt-6 h-12 px-8 text-base" size="lg">
              <Link to="/">
                <Zap className="mr-2 h-5 w-5" />
                Go to TeraPlayer
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Disclaimer */}
      <footer className="border-t border-border/40 bg-card/50">
        <div className="tp-container py-10">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-secondary/20 p-5">
              <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">Disclaimer:</span> TeraPlayer is an independent tool
                  and is <span className="font-semibold text-foreground">not affiliated with</span>, endorsed by, or
                  sponsored by TeraBox or Flextech. All trademarks and content belong to their respective owners.
                  TeraPlayer only accesses publicly shared content and does not host, store, or distribute any
                  copyrighted material. Users are responsible for complying with applicable laws in their jurisdiction.
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
              <div className="opacity-70">
                Only supports public TeraBox links. Respect the original owners.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
