import { useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  Mail,
  MessageSquare,
  Bug,
  Briefcase,
  Send,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { Button } from "../components/ui/button";

const fadeUp = {
  initial: { opacity: 0, scale: 0.97 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

const contactMethods = [
  {
    icon: Bug,
    title: "Bug Reports",
    body: "Found something broken? Send us the details and we'll take a look as soon as possible.",
    action: "Report a bug",
    href: "mailto:teraplayer.contact@gmail.com?subject=Bug%20Report",
  },
  {
    icon: Briefcase,
    title: "Business Inquiries",
    body: "Partnerships, licensing, or other business-related questions. We'd love to hear from you.",
    action: "Email us",
    href: "mailto:teraplayer.contact@gmail.com?subject=Business%20Inquiry",
  },
  {
    icon: MessageSquare,
    title: "General Feedback",
    body: "Suggestions, feature requests, or just want to say hello. All feedback is welcome.",
    action: "Send feedback",
    href: "mailto:teraplayer.contact@gmail.com?subject=Feedback",
  },
];

const faqs = [
  {
    q: "Is TeraPlayer free?",
    a: "Yes, TeraPlayer is completely free to use. No account required, no hidden charges.",
  },
  {
    q: "Do you store my data?",
    a: "No data is stored by default. If you sign in with Google, your preferences sync to our database so you can access them across devices. You can clear all data at any time.",
  },
  {
    q: "How long does extraction take?",
    a: "Most links resolve in under 2 seconds. Large folders with many files may take up to 5 seconds.",
  },
  {
    q: "Why does my link not work?",
    a: "The link may be private, expired, or the third-party extractor mirrors may be temporarily unavailable. Try setting a COOKIE_JSON for more reliable extraction.",
  },
];

export default function Contact() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Helmet>
        <title>Contact TeraPlayer — Support, Bug Reports &amp; Business Inquiries</title>
        <meta name="description" content="Questions, bug reports, or business inquiries? Contact TeraPlayer support. We respond quickly to all messages." />
        <link rel="canonical" href="https://teraplayer.in/contact" />
        <meta property="og:title" content="Contact TeraPlayer — Support, Bug Reports &amp; Business Inquiries" />
        <meta property="og:description" content="Contact TeraPlayer for support, bug reports, feedback, or business inquiries." />
        <meta property="og:url" content="https://teraplayer.in/contact" />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:image:alt" content="TeraPlayer - Watch &amp; Download TeraBox Videos Free" />
        <meta name="twitter:title" content="Contact TeraPlayer — Support, Bug Reports &amp; Business Inquiries" />
        <meta name="twitter:description" content="Contact TeraPlayer for support, bug reports, feedback, or business inquiries." />
        <meta name="twitter:image:alt" content="TeraPlayer - Watch &amp; Download TeraBox Videos Free" />
        <script type="application/ld+json">
          {JSON.stringify({
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
          })}
        </script>
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
              <Mail className="h-3.5 w-3.5 text-primary" />
              Get in touch
            </div>
            <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl lg:text-6xl">
              Contact <span className="text-primary">Us</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Questions, bug reports, business inquiries — we're here to help.
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
                key={method.title}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.08 * i }}
                className="group rounded-2xl border border-border bg-surface-raised p-6 transition-[border-color,box-shadow,brightness] duration-300 ease-out hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:brightness-110"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                  <method.icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-semibold">{method.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{method.body}</p>
                <a
                  href={method.href}
                  target={method.href.startsWith("http") ? "_blank" : undefined}
                  rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary/80"
                >
                  {method.action}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Direct Email */}
      <section className="border-y border-border/40 bg-surface-overlay/30">
        <div className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
              <Send className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-5 font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Prefer to write <span className="text-primary">directly?</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Drop us an email and we'll get back to you as soon as possible.
            </p>
            <Button asChild className="mt-6 h-12 px-8 text-base" size="lg" variant="default">
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
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Quick answers to common questions before you reach out.
          </p>

          <div className="mt-8 space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.05 * i }}
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

      </main>

      {/* Social / Footer */}
      <footer className="border-t border-border/40 bg-surface-raised/50">
        <div className="tp-container py-10">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-semibold text-foreground">
                  Tera<span className="text-primary">Player</span>
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">Free to use · no account required</span>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="mailto:teraplayer.contact@gmail.com"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                  Contact
                </a>
                <Link to="/about" className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
                  About
                </Link>
              </div>
            </div>
            <div className="mt-6 text-center text-xs text-muted-foreground opacity-70">
              Only supports public TeraBox links. Respect the original owners.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
