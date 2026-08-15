import { useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  Sparkles,
  Info,
  CirclePlay,
  Cpu,
  ShieldQuestion,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";

const fadeUp = {
  initial: { opacity: 0, scale: 0.97 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

const SECTIONS = [
  {
    icon: Info,
    title: "What is TeraPlayer?",
    paragraphs: [
      "TeraPlayer is a web tool for working with supported public TeraBox links. Paste a link, and use the available preview, streaming, and download features right in your browser.",
      "No account is required for the core features.",
    ],
  },
  {
    icon: CirclePlay,
    title: "What you can do",
    paragraphs: [
      "With a supported public TeraBox link, TeraPlayer lets you:",
    ],
    bullets: [
      "Get a quick preview — title, thumbnail, file size, and type",
      "Stream video directly in the browser with playback controls",
      "Download supported files",
      "Browse shared folders and work with multi-file links",
      "Choose stream quality when available",
    ],
  },
  {
    icon: Cpu,
    title: "How it works",
    paragraphs: [
      "When you paste a link, it is sent to TeraPlayer's backend, which processes it through our extraction infrastructure and returns the preview and stream information.",
      "The files themselves are not uploaded to TeraPlayer — they are accessed from their existing public source.",
    ],
  },
  {
    icon: ShieldQuestion,
    title: "What TeraPlayer is not",
    paragraphs: [
      "TeraPlayer does not host TeraBox files, store your content, or claim ownership of anything you access through it.",
      "You are responsible for having the right to access or download the content you use with the service.",
    ],
  },
];

export default function AboutTeraPlayer() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Helmet>
        <title>About TeraPlayer</title>
        <meta name="description" content="TeraPlayer is a web tool for previewing, streaming, and downloading supported public TeraBox links — no account required." />
        <link rel="canonical" href="https://www.teraplayer.in/about-teraplayer" />
        <meta property="og:title" content="About TeraPlayer" />
        <meta property="og:description" content="TeraPlayer is a web tool for previewing, streaming, and downloading supported public TeraBox links — no account required." />
        <meta property="og:url" content="https://www.teraplayer.in/about-teraplayer" />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:image:alt" content="TeraPlayer - Watch &amp; Download TeraBox Videos Free" />
        <meta name="twitter:title" content="About TeraPlayer" />
        <meta name="twitter:description" content="TeraPlayer is a web tool for previewing, streaming, and downloading supported public TeraBox links." />
        <meta name="twitter:image:alt" content="TeraPlayer - Watch &amp; Download TeraBox Videos Free" />
      </Helmet>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="tp-container py-14 md:py-24"
          >
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                About TeraPlayer
              </div>
              <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl lg:text-6xl">
                About <span className="text-primary">TeraPlayer</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                A web tool for supported public TeraBox links. Paste a link, and go.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Content */}
        <section className="tp-container py-16 md:py-20">
          <div className="mx-auto max-w-3xl space-y-4">
            {SECTIONS.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.05 * i }}
                className="rounded-2xl border border-border bg-surface-raised p-6 sm:p-7"
              >
                <h2 className="flex items-center gap-2.5 font-display font-bold text-xl tracking-tight sm:text-2xl">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <s.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </span>
                  {s.title}
                </h2>
                {s.paragraphs && (
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {s.paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                )}
                {s.bullets && (
                  <ul className="mt-4 space-y-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/40 bg-gradient-to-b from-transparent to-primary/[0.03]">
          <div className="tp-container py-14 text-center md:py-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-2xl"
            >
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                Give it a <span className="text-primary">try</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Paste a supported TeraBox link and see what it can do.
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
      </main>

      <Footer />
    </div>
  );
}