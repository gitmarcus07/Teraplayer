import { useEffect } from "react";
import { motion } from "framer-motion";
import Seo from "../components/Seo";
import {
  Mail,
  MessageSquare,
  Bug,
  Briefcase,
  Send,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import FaqCards from "../components/FaqCards";
import { FooterLegalLinks } from "../components/Footer";
import { Button } from "../components/ui/button";
import { useLang } from "../i18n/LanguageContext";

const fadeUp = {
  initial: { opacity: 0, scale: 0.97 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

const contactMethods = [
  {
    icon: Bug,
    titleKey: "c.m1t",
    bodyKey: "c.m1d",
    actionKey: "c.m1a",
    href: "mailto:teraplayer.contact@gmail.com?subject=Bug%20Report",
  },
  {
    icon: Briefcase,
    titleKey: "c.m2t",
    bodyKey: "c.m2d",
    actionKey: "c.m2a",
    href: "mailto:teraplayer.contact@gmail.com?subject=Business%20Inquiry",
  },
  {
    icon: MessageSquare,
    titleKey: "c.m3t",
    bodyKey: "c.m3d",
    actionKey: "c.m3a",
    href: "mailto:teraplayer.contact@gmail.com?subject=Feedback",
  },
];

const faqs = [
  { qk: "c.q1", ak: "c.a1" },
  { qk: "c.q2", ak: "c.a2" },
  { qk: "c.q3", ak: "c.a3" },
  { qk: "c.q4", ak: "c.a4" },
];

export default function Contact() {
  const { t } = useLang();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Seo
        title="Contact TeraPlayer — Support, Bug Reports & Business Inquiries"
        description="Questions, bug reports, or business inquiries? Contact TeraPlayer support. We respond quickly to all messages."
        path="/contact"
        ogTitle="Contact TeraPlayer — Support, Bug Reports & Business Inquiries"
        ogDescription="Contact TeraPlayer for support, bug reports, feedback, or business inquiries."
        imageAlt="TeraPlayer - Watch & Download TeraBox Videos Free"
        twitterDescription="Contact TeraPlayer for support, bug reports, feedback, or business inquiries."
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: t(faq.qk),
              acceptedAnswer: {
                "@type": "Answer",
                text: t(faq.ak),
              },
            })),
          })}
        </script>
      </Seo>

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
              <Mail className="h-3.5 w-3.5 text-primary" />
              {t("c.eyebrow")}
            </div>
            <h1 className="font-display font-black text-4xl leading-[1.08] tracking-tighter text-balance sm:text-5xl lg:text-6xl">
              {t("c.titleA")} <span className="text-primary">{t("c.titleB")}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              {t("c.sub")}
            </p>
          </div>
        </motion.div>
      </section>

      {/* Contact Methods */}
      <section className="tp-container py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-3">
              {contactMethods.map((method, i) => (
                <motion.div
                  key={method.titleKey}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.08 * i }}
                className="group rounded-2xl border border-border bg-surface-raised p-6 transition-[border-color,box-shadow,brightness] duration-300 ease-out hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:brightness-110"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                  <method.icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-semibold">{t(method.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(method.bodyKey)}</p>
                <a
                  href={method.href}
                  target={method.href.startsWith("http") ? "_blank" : undefined}
                  rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary/80"
                >
                  {t(method.actionKey)}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What to include for fastest help */}
      <section className="tp-container py-16 md:py-20">
        <motion.div {...fadeUp} className="mx-auto max-w-5xl">
          <h2 className="text-center font-display font-bold text-2xl tracking-tight sm:text-3xl">
            {t("c.helpT")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            {t("c.helpSub")}
          </p>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { n: "1", tk: "c.h1t", dk: "c.h1d" },
              { n: "2", tk: "c.h2t", dk: "c.h2d" },
              { n: "3", tk: "c.h3t", dk: "c.h3d" },
            ].map((s) => (
              <li
                key={s.tk}
                className="rounded-2xl border border-border bg-surface-raised p-6"
              >
                <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                  {s.n}
                </span>
                <h3 className="mt-4 text-base font-semibold">{t(s.tk)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(s.dk)}</p>
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
            {t("c.helpNote")}
          </p>
        </motion.div>
      </section>

      {/* Direct Email */}
      <section className="border-y border-border/40 bg-surface-overlay/30">
        <div className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
              <Send className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-5 font-display font-bold text-2xl tracking-tight sm:text-3xl">
              {t("c.emailT").split(" ").slice(0, -1).join(" ")} <span className="text-primary">{t("c.emailT").split(" ").slice(-1)}</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t("c.emailB")}
            </p>
            <Button asChild className="mt-6 h-auto min-w-0 whitespace-normal px-5 py-3 text-base" size="lg" variant="default">
              <a href="mailto:teraplayer.contact@gmail.com">
                <Mail className="mr-2 h-5 w-5" />
                teraplayer.contact@gmail.com
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="tp-container py-16 md:py-20">
        <motion.div {...fadeUp} className="mx-auto max-w-3xl">
          <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
            {t("faq.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("c.faqSub")}
          </p>

          <div className="mt-8">
            <FaqCards items={faqs.map((f) => ({ q: t(f.qk), a: t(f.ak) }))} />
          </div>
        </motion.div>
      </section>

      </main>

      {/* Social / Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="tp-container py-10">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-semibold text-foreground">
                  Tera<span className="text-gradient">Player</span><span className="text-xs font-bold text-slate-400">.in</span>
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">{t("homefoot.tag")}</span>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="mailto:teraplayer.contact@gmail.com"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                  {t("nav.contact")}
                </a>
                <Link to="/about" className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
                  {t("nav.about")}
                </Link>
              </div>
            </div>

            <FooterLegalLinks />

            <div className="mt-6 text-center text-xs text-muted-foreground opacity-70">
              {t("homefoot.note")}{t("homefoot.noteExt")}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
