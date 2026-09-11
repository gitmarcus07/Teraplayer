import { useEffect } from "react";
import { motion } from "framer-motion";
import Seo from "../components/Seo";
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
import { useLang } from "../i18n/LanguageContext";

const fadeUp = {
  initial: { opacity: 0, scale: 0.97 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

const SECTIONS = [
  {
    icon: Info,
    titleKey: "atp.s1t",
    paragraphsKeys: ["atp.s1p1", "atp.s1p2"],
  },
  {
    icon: CirclePlay,
    titleKey: "atp.s2t",
    paragraphsKeys: ["atp.s2p1"],
    bulletsKeys: ["atp.s2b1", "atp.s2b2", "atp.s2b3", "atp.s2b4", "atp.s2b5"],
  },
  {
    icon: Cpu,
    titleKey: "atp.s3t",
    paragraphsKeys: ["atp.s3p1", "atp.s3p2"],
  },
  {
    icon: ShieldQuestion,
    titleKey: "atp.s4t",
    paragraphsKeys: ["atp.s4p1", "atp.s4p2"],
  },
];

export default function AboutTeraPlayer() {
  const { t } = useLang();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Seo
        title="About TeraPlayer"
        description="TeraPlayer is a web tool for previewing, streaming, and downloading supported public TeraBox links — no account required."
        path="/about"
        ogTitle="About TeraPlayer"
        ogDescription="TeraPlayer is a web tool for previewing, streaming, and downloading supported public TeraBox links — no account required."
        imageAlt="TeraPlayer - Watch & Download TeraBox Videos Free"
        twitterDescription="TeraPlayer is a web tool for previewing, streaming, and downloading supported public TeraBox links."
      />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-full max-w-3xl -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="tp-container py-14 md:py-24"
          >
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {t("atp.eyebrow")}
              </div>
              <h1 className="font-display font-black text-4xl leading-[1.08] tracking-tighter text-balance sm:text-5xl lg:text-6xl">
                {t("nav.about")} <span className="text-primary">TeraPlayer</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                {t("atp.sub")}
              </p>
            </div>
          </motion.div>
        </section>

        {/* Content */}
        <section className="tp-container py-16 md:py-20">
          <div className="mx-auto max-w-3xl space-y-4">
            {SECTIONS.map((s, i) => (
              <motion.div
                key={s.titleKey}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.05 * i }}
                className="rounded-2xl border border-border bg-surface-raised p-6 sm:p-7"
              >
                <h2 className="flex items-center gap-2.5 font-display font-bold text-xl tracking-tight sm:text-2xl">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <s.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </span>
                  {t(s.titleKey)}
                </h2>
                {s.paragraphsKeys && (
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {s.paragraphsKeys.map((k) => (
                      <p key={k}>{t(k)}</p>
                    ))}
                  </div>
                )}
                {s.bulletsKeys && (
                  <ul className="mt-4 space-y-2">
                    {s.bulletsKeys.map((k) => (
                      <li key={k} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{t(k)}</span>
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
                {t("atp.ctaT")}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t("atp.ctaB")}
              </p>
              <Button asChild className="mt-6 h-12 px-8 text-base" size="lg">
                <Link to="/">
                  <Zap className="mr-2 h-5 w-5" />
                  {t("atp.ctaBtn")}
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