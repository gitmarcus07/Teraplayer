import { useEffect } from "react";
import { motion } from "framer-motion";
import Seo from "../components/Seo";
import { Link } from "react-router-dom";
import {
  Wrench,
  ExternalLink,
  AlertCircle,
  Globe,
  FileVideo,
  Monitor,
  Download,
  Smartphone,
  ChevronRight,
  HelpCircle,
  RefreshCcw,
  Link2,
  Lock,
  Eye,
  Play,
  CheckCircle2,
  Code2,
  Server,
  Cloud,
  Layers,
  Github,
  Twitter,
  Instagram,
  Mail,
  Heart,
  Zap,
  BookOpen,
  Award,
  Users,
  BarChart2,
  Shield,
  Terminal,
  ChevronDown,
  Search,
} from "lucide-react";
import Header from "../components/Header";
import FaqCards from "../components/FaqCards";
import { Button } from "../components/ui/button";
import { useLang } from "../i18n/LanguageContext";

const fadeUp = {
  initial: { opacity: 0, scale: 0.97 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

const troubleshootingSteps = [
  { titleKey: "hc.ts1t", bodyKey: "hc.ts1d", icon: AlertCircle },
  { titleKey: "hc.ts2t", bodyKey: "hc.ts2d", icon: Globe },
  { titleKey: "hc.ts3t", bodyKey: "hc.ts3d", icon: Lock },
  { titleKey: "hc.ts4t", bodyKey: "hc.ts4d", icon: Monitor },
  { titleKey: "hc.ts5t", bodyKey: "hc.ts5d", icon: Smartphone },
  { titleKey: "hc.ts6t", bodyKey: "hc.ts6d", icon: RefreshCcw },
];

const publicLinkFaqs = [
  { qk: "hc.pf1q", ak: "hc.pf1a" },
  { qk: "hc.pf2q", ak: "hc.pf2a" },
  { qk: "hc.pf3q", ak: "hc.pf3a" },
  { qk: "hc.pf4q", ak: "hc.pf4a" },
  { qk: "hc.pf5q", ak: "hc.pf5a" },
  { qk: "hc.pf6q", ak: "hc.pf6a" },
  { qk: "hc.pf7q", ak: "hc.pf7a" },
  { qk: "hc.pf8q", ak: "hc.pf8a" },
];

const troubleshootingFaqs = [
  { qk: "hc.tf1q", ak: "hc.tf1a" },
  { qk: "hc.tf2q", ak: "hc.tf2a" },
  { qk: "hc.tf3q", ak: "hc.tf3a" },
  { qk: "hc.tf4q", ak: "hc.tf4a" },
  { qk: "hc.tf5q", ak: "hc.tf5a" },
  { qk: "hc.tf6q", ak: "hc.tf6a" },
  { qk: "hc.tf7q", ak: "hc.tf7a" },
  { qk: "hc.tf8q", ak: "hc.tf8a" },
];

const videoPlaybackFixes = [
  { icon: RefreshCcw, titleKey: "hc.pb1t", bodyKey: "hc.pb1d" },
  { icon: Globe, titleKey: "hc.pb2t", bodyKey: "hc.pb2d" },
  { icon: Monitor, titleKey: "hc.pb3t", bodyKey: "hc.pb3d" },
  { icon: FileVideo, titleKey: "hc.pb4t", bodyKey: "hc.pb4d" },
  { icon: Download, titleKey: "hc.pb5t", bodyKey: "hc.pb5d" },
];

const stillNotWorking = [
  "hc.stillB1",
  "hc.stillB2",
  "hc.stillB3",
  "hc.stillB4",
  "hc.stillB5",
];

const publicVsPrivate = [
  {
    icon: Globe,
    titleKey: "hc.vsAt",
    bodyKey: "hc.vsAd",
  },
  {
    icon: Lock,
    titleKey: "hc.vsBt",
    bodyKey: "hc.vsBd",
  },
];

const whyPublicLinkFails = [
  { icon: AlertCircle, titleKey: "hc.w1t", bodyKey: "hc.w1d" },
  { icon: Lock, titleKey: "hc.w2t", bodyKey: "hc.w2d" },
  { icon: Globe, titleKey: "hc.w3t", bodyKey: "hc.w3d" },
  { icon: Monitor, titleKey: "hc.w4t", bodyKey: "hc.w4d" },
];

export default function HelpCenter() {
  const { t } = useLang();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `${t("hc.tsT")} ${t("hc.tsB")}`,
    description: t("hc.tsSub"),
    step: troubleshootingSteps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: t(step.titleKey),
      text: t(step.bodyKey),
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [...publicLinkFaqs, ...troubleshootingFaqs].map((faq) => ({
      "@type": "Question",
      name: t(faq.qk),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(faq.ak),
      },
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <Seo
        title="Help Center — TeraPlayer"
        description="TeraBox link not working? Fix common TeraBox link, playback, and download issues. Learn how public TeraBox share links work and how to use them with TeraPlayer."
        path="/help-center"
        ogTitle="Help Center — TeraPlayer"
        ogDescription="Troubleshoot TeraBox links, learn about public shares, and get answers to common questions."
        imageAlt="Help Center - TeraPlayer"
        twitterDescription="Fix TeraBox link issues and learn how public shares work with TeraPlayer."
      >
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Seo>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-full max-w-3xl -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl py-12 text-center md:py-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500"
              >
                <Wrench className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                <Link2 className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                {t("hc.eyebrow")}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="font-display text-2xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight text-balance text-slate-900 mb-6"
              >
                {t("hc.titleA")} <span className="text-primary">{t("hc.titleB")}</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-base text-slate-500 leading-relaxed max-w-2xl mx-auto mb-4"
              >
                {t("hc.sub1")}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-base text-slate-500 leading-relaxed max-w-2xl mx-auto mb-10"
              >
                {t("hc.sub2")}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-wrap items-center justify-center gap-3"
              >
                <Button asChild className="h-12 px-8 text-base" size="lg">
                  <Link to="/">
                    <Monitor className="mr-2 h-5 w-5" aria-hidden="true" />
                    {t("hc.ctaPlayer")}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 px-8 text-base" size="lg">
                  <Link to="/">
                    <Download className="mr-2 h-5 w-5" aria-hidden="true" />
                    {t("hc.ctaDl")}
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Quick Tool Selector */}
        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl sm:text-3xl leading-tight tracking-tight text-slate-900 text-center mb-6">
                {t("hc.toolT")} <span className="text-indigo-600">{t("hc.toolB")}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/"
                  className="group glass-panel rounded-2xl p-5 border border-slate-200 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 transition-colors duration-300 group-hover:bg-indigo-100">
                      <Monitor className="w-6 h-6 text-indigo-600" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{t("hc.toolAt")}</h3>
                      <p className="mt-1 text-sm text-slate-500">{t("hc.toolAd")}</p>
                    </div>
                  </div>
                </Link>
                <Link
                  to="/"
                  className="group glass-panel rounded-2xl p-5 border border-slate-200 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 transition-colors duration-300 group-hover:bg-indigo-100">
                      <Download className="w-6 h-6 text-indigo-600" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{t("hc.toolBt")}</h3>
                      <p className="mt-1 text-sm text-slate-500">{t("hc.toolBd")}</p>
                    </div>
                  </div>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Troubleshooting Steps */}
        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl sm:text-3xl leading-tight tracking-tight text-slate-900 mb-3">
                {t("hc.tsT")} <span className="text-indigo-600">{t("hc.tsB")}</span>
              </h2>
              <p className="mt-3 text-base text-slate-500 leading-relaxed mb-10">
                {t("hc.tsSub")}
              </p>

              <div className="space-y-4">
                {troubleshootingSteps.map((step, i) => (
                  <motion.div
                    key={step.titleKey}
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: 0.1 * i }}
                    className="glass-panel rounded-2xl p-5 h-full transition-all duration-300 hover:shadow-md border border-slate-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                        <step.icon className="w-5 h-5 text-indigo-600" strokeWidth={1.75} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">{t(step.titleKey)}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{t(step.bodyKey)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Invalid or Incomplete Links */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl sm:text-3xl leading-tight tracking-tight text-slate-900 mb-6">
                {t("hc.invT")} <span className="text-indigo-600">{t("hc.invB")}</span>
              </h2>
              <div className="space-y-4 text-base text-slate-500 leading-relaxed">
                <p>
                  {t("hc.invP1")}
                </p>
                <ul className="space-y-2 ml-6 list-disc">
                  {[t("hc.invB1"), t("hc.invB2"), t("hc.invB3"), t("hc.invB4")].map((item) => (
                    <li key={item} className="text-base text-slate-500 leading-relaxed">{item}</li>
                  ))}
                </ul>
                <p>
                  {t("hc.invP2")}
                </p>
                <p>
                  {t("hc.invP3")}
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* What is a Public Link */}
        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl sm:text-3xl leading-tight tracking-tight text-slate-900 mb-6">
                {t("hc.plT")} <span className="text-indigo-600">{t("hc.plB")}</span>
              </h2>
              <div className="space-y-4 text-base text-slate-500 leading-relaxed">
                <p>
                  {t("hc.plP1")}
                </p>
                <p>
                  {t("hc.plP2")}
                </p>
                <p>
                  {t("hc.plP3")}
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Public vs Private */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl sm:text-3xl leading-tight tracking-tight text-slate-900 mb-10">
                {t("hc.vsT")} <span className="text-indigo-600">{t("hc.vsB")}</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {publicVsPrivate.map((item, i) => (
                  <motion.div
                    key={item.titleKey}
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: 0.1 * i }}
                    className="glass-panel rounded-2xl p-5 h-full transition-all duration-300 hover:shadow-md border border-slate-200"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 mb-3">
                      <item.icon className="w-5 h-5 text-indigo-600" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-2">{t(item.titleKey)}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{t(item.bodyKey)}</p>
                  </motion.div>
                ))}
              </div>
              <p className="mt-6 text-sm text-slate-500 text-center">
                {t("hc.vsNote")}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Why a Public Link May Not Work */}
        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl sm:text-3xl leading-tight tracking-tight text-slate-900 mb-6">
                {t("hc.whyT")} <span className="text-indigo-600">{t("hc.whyB")}</span>
              </h2>
              <p className="mt-3 text-base text-slate-500 leading-relaxed mb-10">
                {t("hc.whySub")}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {whyPublicLinkFails.map((item, i) => (
                  <motion.div
                    key={item.titleKey}
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: 0.1 * i }}
                    className="glass-panel rounded-2xl p-5 h-full transition-all duration-300 hover:shadow-md border border-slate-200"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 mb-3">
                      <item.icon className="w-6 h-6 text-indigo-600" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-2">{t(item.titleKey)}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{t(item.bodyKey)}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Video Not Playing */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl sm:text-3xl leading-tight tracking-tight text-slate-900 mb-3">
                {t("hc.pbT")} <span className="text-indigo-600">{t("hc.pbB")}</span>
              </h2>
              <p className="mt-3 text-base text-slate-500 leading-relaxed mb-10">
                {t("hc.pbSub")}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {videoPlaybackFixes.map((item, i) => (
                  <motion.div
                    key={item.titleKey}
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: 0.1 * i }}
                    className="glass-panel rounded-2xl p-5 h-full transition-all duration-300 hover:shadow-md border border-slate-200"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 mb-3">
                      <item.icon className="w-5 h-5 text-indigo-600" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-2">{t(item.titleKey)}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{t(item.bodyKey)}</p>
                  </motion.div>
                ))}
              </div>
              <p className="mt-6 text-sm text-slate-500 text-center">
                {t("hc.pbNoteA")}{" "}
                <Link to="/" className="font-medium text-indigo-600 underline-offset-4 hover:underline">
                  {t("hc.pbNotePlayer")}
                </Link>
                {t("hc.pbNoteB")}{" "}
                <Link to="/" className="font-medium text-indigo-600 underline-offset-4 hover:underline">
                  {t("hc.pbNoteDl")}
                </Link>
                .
              </p>
            </motion.div>
          </div>
        </section>

        {/* Download Not Working */}
        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl sm:text-3xl leading-tight tracking-tight text-slate-900 mb-6">
                {t("hc.dlT")} <span className="text-indigo-600">{t("hc.dlB")}</span>
              </h2>
              <div className="space-y-4 text-base text-slate-500 leading-relaxed">
                <p>
                  {t("hc.dlP1")}
                </p>
                <p>
                  {t("hc.dlP2")}
                </p>
                <p>
                  {t("hc.dlP3")}
                </p>
                <p>
                  {t("hc.dlP4a")}{" "}
                  <Link to="/" className="font-medium text-indigo-600 underline-offset-4 hover:underline">
                    {t("hc.dlP4b")}
                  </Link>
                  .
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Player vs Downloader */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl sm:text-3xl leading-tight tracking-tight text-slate-900 mb-10">
                {t("hc.pvdT")} <span className="text-indigo-600">{t("hc.pvdB")}</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="glass-panel rounded-2xl p-5 h-full transition-all duration-300 hover:shadow-md border border-slate-200"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 mb-3">
                    <Monitor className="w-5 h-5 text-indigo-600" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{t("hc.pvdAt")}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    {t("hc.pvdAd")}
                  </p>
                  <Button asChild variant="outline" className="h-9 px-4 text-sm">
                    <Link to="/">{t("hc.pvdAt")}</Link>
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="glass-panel rounded-2xl p-5 h-full transition-all duration-300 hover:shadow-md border border-slate-200"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 mb-3">
                    <Download className="w-5 h-5 text-indigo-600" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{t("hc.pvdBt")}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    {t("hc.pvdBd")}
                  </p>
                  <Button asChild variant="outline" className="h-9 px-4 text-sm">
                    <Link to="/">{t("hc.pvdBt")}</Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Link Still Does Not Work */}
        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl sm:text-3xl leading-tight tracking-tight text-slate-900 mb-6">
                {t("hc.stillT")} <span className="text-indigo-600">{t("hc.stillB")}</span>
              </h2>
              <div className="space-y-4 text-base text-slate-500 leading-relaxed">
                <p>
                  {t("hc.stillP1")}
                </p>
                <ul className="space-y-2 ml-6 list-disc">
                  {stillNotWorking.map((item) => (
                    <li key={item} className="text-base text-slate-500 leading-relaxed">{t(item)}</li>
                  ))}
                </ul>
                <p>
                  {t("hc.stillP2")}
                </p>
                <p>
                  {t("hc.stillP3")}
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Public Link FAQ */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-3xl">
              <div className="text-center">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  {t("hc.faqAEyebrow")}
                </div>
                <h2 className="font-display font-bold text-2xl sm:text-3xl leading-tight tracking-tight text-slate-900 mb-3">
                  {t("hc.faqAT")} <span className="text-indigo-600">{t("hc.faqAB")}</span>
                </h2>
                <p className="mt-3 text-base text-slate-500 leading-relaxed">
                  {t("hc.faqASub")}
                </p>
              </div>

              <div className="mt-10">
                <FaqCards items={publicLinkFaqs.map((f) => ({ q: t(f.qk), a: t(f.ak) }))} />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Troubleshooting FAQ */}
        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="mx-auto max-w-3xl">
              <div className="text-center">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                  <Wrench className="w-4 h-4 text-indigo-600" />
                  {t("hc.faqBEyebrow")}
                </div>
                <h2 className="font-display font-bold text-2xl sm:text-3xl leading-tight tracking-tight text-slate-900 mb-3">
                  {t("hc.faqBT")} <span className="text-indigo-600">{t("hc.faqBB")}</span>
                </h2>
                <p className="mt-3 text-base text-slate-500 leading-relaxed">
                  {t("hc.faqBSub")}
                </p>
              </div>

              <div className="mt-10">
                <FaqCards items={troubleshootingFaqs.map((f) => ({ q: t(f.qk), a: t(f.ak) }))} />
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-2xl text-center"
            >
              <h2 className="font-display font-bold text-2xl sm:text-3xl leading-tight tracking-tight text-slate-900 mb-3">
                {t("hc.ctaT")}
              </h2>
              <p className="mt-3 text-base text-slate-500 leading-relaxed mb-8">
                {t("hc.ctaB")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button asChild className="h-12 px-8 text-base" size="lg">
                  <Link to="/">
                    <Monitor className="mr-2 h-5 w-5" />
                    {t("hc.ctaPlayer")}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 px-8 text-base" size="lg">
                  <Link to="/">
                    <Download className="mr-2 w-5 h-5" />
                    {t("hc.ctaDl")}
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="rounded-3xl bg-indigo-600 p-10 md:p-16"
              >
                <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-white mb-4">
                  {t("hc.ctaT")}
                </h2>
                <p className="text-base text-indigo-100 leading-relaxed mb-8">
                  {t("hc.ctaB")}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild className="h-12 px-8 text-base" size="lg">
                    <Link to="/">
                      <Monitor className="mr-2 h-5 w-5" />
                      {t("hc.ctaPlayer")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12 px-8 text-base" size="lg">
                    <Link to="/">
                      <Download className="mr-2 h-5 w-5" />
                      {t("hc.ctaDl")}
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Disclaimer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-semibold text-slate-900">
                Tera<span className="text-indigo-600">Player</span>
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-sm text-slate-500">{t("homefoot.tag")}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-200">
                {t("nav.home")}
              </Link>
              <Link to="/about" className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-200">
                {t("nav.about")}
              </Link>
              <Link to="/contact" className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-200">
                {t("nav.contact")}
              </Link>
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-slate-400">
            {t("homefoot.note")}{t("homefoot.noteExt")}
          </div>
        </div>
      </footer>
    </div>
  );
}