import { useEffect } from "react";
import { motion } from "framer-motion";
import Seo from "../components/Seo";
import {
  Sparkles,
  BookOpen,
  MonitorPlay,
  CircleCheck,
  UserCheck,
  Globe,
  Activity,
  Scale,
  TriangleAlert,
  RefreshCw,
  ScrollText,
  Mail,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LegalNotice from "../components/LegalNotice";
import { useLang } from "../i18n/LanguageContext";
import { Button } from "../components/ui/button";

const fadeUp = {
  initial: { opacity: 0, scale: 0.97 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

const SECTIONS = [
  {
    icon: BookOpen,
    title: "Acceptance of Terms",
    paragraphs: [
      "By accessing or using TeraPlayer, you agree to these Terms of Service. If you do not agree with any part of these Terms, please do not use the service.",
    ],
  },
  {
    icon: MonitorPlay,
    title: "What TeraPlayer Provides",
    paragraphs: [
      "TeraPlayer provides tools for working with supported public TeraBox links. You can paste a supported link and use the available preview, streaming, and download features.",
      "TeraPlayer does not host the files you preview, stream, or download. That content stays on third-party services, and we only help you access public links you are allowed to use.",
    ],
  },
  {
    icon: CircleCheck,
    title: "Acceptable Use",
    paragraphs: [
      "Use TeraPlayer only for lawful purposes, and only to access content you have the right to access.",
    ],
    bullets: [
      "Only use TeraPlayer with public links you are permitted to use",
      "Respect applicable laws and the rules of third-party services",
      "Do not use TeraPlayer to violate anyone's rights",
    ],
  },
  {
    icon: UserCheck,
    title: "User Responsibilities",
    paragraphs: [
      "You are responsible for making sure you have the legal right to access, stream, or download any content you use with TeraPlayer.",
      "You are also responsible for complying with applicable laws and with the terms of any third-party service you rely on.",
    ],
  },
  {
    icon: Globe,
    title: "Third-Party Services",
    paragraphs: [
      "TeraPlayer depends on external services — including TeraBox itself and link-resolution services — that are outside our control. Their availability, reliability, and terms are set by their providers.",
    ],
  },
  {
    icon: Activity,
    title: "Service Availability",
    paragraphs: [
      "TeraPlayer is provided on an \"as is\" and \"as available\" basis. We work to keep it running, but we cannot guarantee that every external link will always work, that the service will be uninterrupted, or that features won't change.",
      "The service may occasionally be unavailable, or behave differently, because of third-party services, maintenance, or other factors outside our control.",
    ],
  },
  {
    icon: Scale,
    title: "Intellectual Property",
    paragraphs: [
      "The TeraPlayer website, brand, code, and design belong to TeraPlayer unless stated otherwise.",
      "TeraPlayer does not claim ownership of content hosted by third-party services. Third-party names, trademarks, and content remain the property of their respective owners.",
    ],
  },
  {
    icon: TriangleAlert,
    title: "Prohibited Use",
    paragraphs: ["You must not misuse TeraPlayer. Specifically, you agree not to:"],
    bullets: [
      "Abuse, attack, overload, or otherwise disrupt TeraPlayer or its infrastructure",
      "Attempt to reverse engineer, scrape, or circumvent the service in a way that harms it",
      "Use TeraPlayer for unlawful purposes or to infringe others' rights",
      "Try to access parts of the service you are not authorized to use",
    ],
  },
  {
    icon: Scale,
    title: "Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by law, TeraPlayer is not liable for indirect, incidental, or consequential damages — including content that fails to play or download, downtime, or results you rely on from the service.",
      "You use TeraPlayer at your own risk.",
    ],
  },
  {
    icon: RefreshCw,
    title: "Changes to the Service",
    paragraphs: [
      "TeraPlayer may update, change, or discontinue features at any time. Because link support depends on third-party services, some functionality may change as those services evolve.",
    ],
  },
  {
    icon: ScrollText,
    title: "Changes to These Terms",
    paragraphs: [
      "We may update these Terms from time to time. When we do, the updated version will be posted here with a new date.",
    ],
  },
  {
    icon: Mail,
    title: "Contact",
    paragraphs: [
      "Questions about these Terms? Use the Contact page, or email us directly at teraplayer.contact@gmail.com.",
    ],
  },
];

export default function TermsOfService() {
  const { t } = useLang();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Seo
        title="Terms of Service — TeraPlayer"
        description="The Terms of Service for TeraPlayer — acceptable use, user responsibilities, third-party services, availability, and liability."
        path="/terms"
        ogTitle="Terms of Service — TeraPlayer"
        ogDescription="The Terms of Service for TeraPlayer — acceptable use, user responsibilities, third-party services, availability, and liability."
        imageAlt="TeraPlayer - Watch & Download TeraBox Videos Free"
        twitterDescription="The Terms of Service for TeraPlayer — acceptable use and responsibilities."
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
                <ScrollText className="h-3.5 w-3.5 text-primary" />
                {t("legal.eyebrow")}
              </div>
              <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl">
                {t("legal.termsA")} <span className="text-primary">{t("legal.termsB")}</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                The rules for using TeraPlayer, written to be readable — not just legally safe.
              </p>
              <p className="mt-3 text-xs text-muted-foreground/80">{t("legal.updated")} August 15, 2026</p>
              <LegalNotice />
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
                transition={{ duration: 0.4, delay: i < 3 ? 0.05 * i : 0 }}
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
                Something unclear?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Ask us anything through the Contact page.
              </p>
              <Button asChild className="mt-6 h-12 px-8 text-base" size="lg">
                <Link to="/contact">
                  <Mail className="mr-2 h-5 w-5" />
                  Contact us
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