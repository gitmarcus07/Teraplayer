import { useEffect } from "react";
import { motion } from "framer-motion";
import Seo from "../components/Seo";
import {
  Sparkles,
  Copyright,
  TriangleAlert,
  Scale,
  Mail,
  ChevronRight,
  ShieldCheck,
  FileText,
  UserCheck,
  ExternalLink,
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
    icon: Copyright,
    titleKey: "cpr.s1t",
    paragraphsKeys: ["cpr.s1p1", "cpr.s1p2", "cpr.s1p3"],
  },
  {
    icon: TriangleAlert,
    titleKey: "cpr.s2t",
    paragraphsKeys: ["cpr.s2p1", "cpr.s2p2"],
    bulletsKeys: ["cpr.s2b1", "cpr.s2b2", "cpr.s2b3", "cpr.s2b4", "cpr.s2b5"],
  },
  {
    icon: Scale,
    titleKey: "cpr.s3t",
    paragraphsKeys: ["cpr.s3p1", "cpr.s3p2"],
  },
  {
    icon: ShieldCheck,
    titleKey: "cpr.s4t",
    paragraphsKeys: ["cpr.s4p1"],
    bulletsKeys: ["cpr.s4b1", "cpr.s4b2", "cpr.s4b3", "cpr.s4b4", "cpr.s4b5"],
  },
  {
    icon: FileText,
    titleKey: "cpr.s5t",
    paragraphsKeys: ["cpr.s5p1"],
    bulletsKeys: ["cpr.s5b1", "cpr.s5b2", "cpr.s5b3", "cpr.s5b4"],
  },
  {
    icon: Mail,
    titleKey: "cpr.s6t",
    paragraphsKeys: ["cpr.s6p1"],
  },
];

export default function CopyrightPage() {
  const { t } = useLang();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Seo
        title="Copyright & Intellectual Property — TeraPlayer"
        description="TeraPlayer respects copyright and intellectual-property rights. Learn what we do and don't do, how to report potential infringement, and your responsibilities when using the service."
        path="/copyright"
        ogTitle="Copyright & Intellectual Property — TeraPlayer"
        ogDescription="TeraPlayer respects copyright and intellectual-property rights. Learn how we handle infringement reports and your responsibilities."
        imageAlt="TeraPlayer - Watch & Download TeraBox Videos Free"
        twitterDescription="TeraPlayer respects copyright and intellectual-property rights. Learn how to report potential infringement."
      />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-full max-w-3xl -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="tp-container py-14 md:py-20"
          >
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-muted-foreground">
                <Copyright className="h-3.5 w-3.5 text-primary" />
                {t("cpr.eyebrow")}
              </div>
              <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl">
                <span className="text-primary">Copyright</span> {t("cpr.titleB")}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                {t("cpr.sub")}
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

        {/* Contact CTA */}
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
                {t("cpr.ctaT")}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t("cpr.ctaB")}
              </p>
              <Button asChild className="mt-6 h-12 px-8 text-base" size="lg">
                <Link to="/contact">
                  <Mail className="mr-2 h-5 w-5" />
                  {t("cpr.ctaBtn")}
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