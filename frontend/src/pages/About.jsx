import { useEffect } from "react";
import { motion } from "framer-motion";
import Seo from "../components/Seo";
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
  UserCheck,
  GitBranch,
  Code2,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { FooterLegalLinks } from "../components/Footer";
import { Button } from "../components/ui/button";
import { useLang } from "../i18n/LanguageContext";

const fadeUp = {
  initial: { opacity: 0, scale: 0.97 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

const features = [
  { icon: Eye, tk: "ab.f1t", dk: "ab.f1d" },
  { icon: Film, tk: "ab.f2t", dk: "ab.f2d" },
  { icon: FolderOpen, tk: "ab.f3t", dk: "ab.f3d" },
  { icon: Archive, tk: "ab.f4t", dk: "ab.f4d" },
  { icon: Download, tk: "ab.f5t", dk: "ab.f5d" },
  { icon: Shield, tk: "ab.f6t", dk: "ab.f6d" },
];

const roadmap = [
  {
    quarter: "Q3 2026",
    itemsKeys: ["ab.r11", "ab.r12", "ab.r13"],
  },
  {
    quarter: "Q4 2026",
    itemsKeys: ["ab.r21", "ab.r22"],
  },
  {
    quarter: "2027",
    itemsKeys: ["ab.r31", "ab.r32", "ab.r33"],
  },
];

export default function About() {
  const { t } = useLang();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Seo
        title="About TeraPlayer — TeraBox Video Player & Downloader"
        description="TeraPlayer is a free, privacy-first web app that lets you watch and download public TeraBox links instantly. No signup required."
        path="/about"
        ogTitle="About TeraPlayer — TeraBox Video Player & Downloader"
        ogDescription="Learn how TeraPlayer works — a privacy-first TeraBox video player and downloader with instant streaming."
        imageAlt="TeraPlayer - Watch & Download TeraBox Videos Free"
        twitterDescription="Learn how TeraPlayer works — a privacy-first TeraBox video player and downloader with instant streaming."
      />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-full max-w-3xl -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="tp-container py-16 md:py-24"
        >
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {t("ab.eyebrow")}
            </div>
            <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl lg:text-6xl">
              {t("ab.titleA")}{" "}
              <span className="text-primary">{t("ab.titleB")}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              {t("ab.sub")}
            </p>
          </div>
        </motion.div>
      </section>

      {/* What is TeraPlayer */}
      <section className="tp-container py-16 md:py-20">
        <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              <span className="text-primary">{t("ab.wA")}</span>{t("ab.wB")}
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                {t("ab.wP1a")} <span className="font-medium text-foreground">{t("ab.wP1b")}</span> {t("ab.wP1c")}
              </p>
              <p>
                {t("ab.wP2a")} <span className="font-medium text-foreground">{t("ab.wP2b")}</span> {t("ab.wP2c")}
              </p>
            </div>
        </motion.div>
      </section>

      {/* Mission */}
      <section className="border-y border-border/40 bg-surface-overlay/30">
        <div className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <HeartHandshake className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                  {t("ab.mA")} <span className="text-primary">{t("ab.mB")}</span>
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {t("ab.mBody")}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="tp-container py-16 md:py-20">
        <motion.div {...fadeUp} className="mx-auto max-w-4xl text-center">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              {t("ab.fA")} <span className="text-primary">{t("ab.fB")}</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t("ab.fSub")}
            </p>
        </motion.div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.tk}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              className="group rounded-2xl border border-border bg-surface-raised p-5 transition-[border-color,box-shadow,brightness] duration-300 ease-out hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:brightness-110"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                <f.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
              </div>
              <h3 className="text-sm font-semibold">{t(f.tk)}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t(f.dk)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Supported Links */}
      <section className="border-y border-border/40 bg-surface-overlay/30">
        <div className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              {t("ab.supA")} <span className="text-primary">{t("ab.supB")}</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t("ab.supSub")}
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
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm"
                >
                  <Globe className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="font-mono text-xs">{domain}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              {t("ab.supNote")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Folder & ZIP */}
      <section className="tp-container py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div {...fadeUp}>
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              <span className="text-primary">{t("ab.foldA")}</span>{t("ab.foldB")}<span className="text-primary">{t("ab.foldC")}</span>{t("ab.foldD")}
            </h2>
          </motion.div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-border bg-surface-raised p-6"
            >
              <FolderOpen className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-semibold">{t("ab.foldBrowserT")}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {[t("ab.foldB1"), t("ab.foldB2"), t("ab.foldB3"), t("ab.foldB4")].map(
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
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-border bg-surface-raised p-6"
            >
              <Archive className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-semibold">{t("ab.zipT")}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {[t("ab.zipB1"), t("ab.zipB2"), t("ab.zipB3"), t("ab.zipB4")].map(
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
      <section className="border-y border-border/40 bg-surface-overlay/30">
        <div className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                  {t("ab.pA")}<span className="text-primary">{t("ab.pB")}</span>
                </h2>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
                  <p>
                    {t("ab.pP1a")}{" "}
                    <span className="font-medium text-foreground">{t("ab.pP1b")}</span> {t("ab.pP1c")}{" "}
                    <Link to="/privacy" className="font-medium text-primary hover:underline">
                      {t("ab.pP1d")}
                    </Link>{" "}
                    {t("ab.pP1e")}
                  </p>
                  <p>
                    {t("ab.pP2")}
                  </p>
                  <p>
                    {t("ab.pP3")}
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
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              {t("ab.rA")} <span className="text-primary">{t("ab.rB")}</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t("ab.rSub")}
            </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {roadmap.map((phase) => (
              <motion.div
                key={phase.quarter}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-border bg-surface-raised p-5"
              >
                <div className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {phase.quarter}
                </div>
                <ul className="space-y-2">
                  {phase.itemsKeys.map((k) => (
                    <li key={k} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {t(k)}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Trust & Transparency */}
      <section className="border-y border-border/40 bg-surface-overlay/30">
        <div className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <UserCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                  {t("ab.tA")} <span className="text-primary">{t("ab.tB")}</span>
                </h2>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  <p>
                    {t("ab.tP1")}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{t("ab.tP2a")}</span> {t("ab.tP2b")}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{t("ab.tP3a")}</span> {t("ab.tP3b")}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{t("ab.tP4a")}</span> {t("ab.tP4b")}{" "}
                    <Link to="/about-teraplayer" className="font-medium text-primary hover:underline">
                      {t("ab.tP4c")}
                    </Link>{" "}
                    {t("ab.tP4d")}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{t("ab.tP5a")}</span> {t("ab.tP5b")}{" "}
                    <Link to="/privacy" className="font-medium text-primary hover:underline">
                      {t("ab.tP5c")}
                    </Link>{" "}
                    {t("ab.tP5d")}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works - Technical transparency */}
      <section className="tp-container py-16 md:py-20">
        <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              {t("ab.eA")} <span className="text-primary">{t("ab.eB")}</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t("ab.eSub")}
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Code2, tk: "ab.e1t", dk: "ab.e1d" },
                { icon: GitBranch, tk: "ab.e2t", subk: "ab.e2sub", dk: "ab.e2d" },
                { icon: Globe, tk: "ab.e3t", dk: "ab.e3d" },
              ].map((layer, i) => (
              <motion.div
                key={layer.tk}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
                className="group rounded-2xl border border-border bg-surface-raised p-5 transition-[border-color,box-shadow,brightness] duration-300 ease-out hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:brightness-110"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                  <layer.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-semibold">{t(layer.tk)}</h3>
                {layer.subk && <p className="text-xs text-primary mt-0.5">{t(layer.subk)}</p>}
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t(layer.dk)}</p>
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
                {t("ab.ctaT")}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t("ab.ctaB")}
              </p>
              <Button asChild className="mt-6 h-12 px-8 text-base" size="lg">
                <Link to="/">
                  <Zap className="mr-2 h-5 w-5" />
                  {t("ab.ctaBtn")}
                </Link>
              </Button>
          </motion.div>
        </div>
      </section>

      </main>

      {/* Disclaimer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="tp-container py-10">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-surface-overlay/20 p-5">
              <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">{t("ab.disc")}</span> {t("ab.discB")}{" "}
                  <span className="font-semibold text-foreground">{t("ab.discC")}</span>{t("ab.discD")}
                </p>
              </div>
            </div>
<div className="mt-6 flex flex-col items-center justify-between gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-semibold text-foreground">
                    Tera<span className="text-gradient">Player</span><span className="text-xs font-bold text-slate-400">.in</span>
                  </span>
                  <span>·</span>
                  <span>{t("homefoot.tag")}</span>
                </div>
                <div className="opacity-70">
                  {t("homefoot.note")}{t("homefoot.noteExt")}
                </div>
              </div>

              <FooterLegalLinks />
            </div>
        </div>
      </footer>
    </div>
  );
}
