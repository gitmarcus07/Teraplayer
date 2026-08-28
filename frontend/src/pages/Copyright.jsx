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

const fadeUp = {
  initial: { opacity: 0, scale: 0.97 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

const SECTIONS = [
  {
    icon: Copyright,
    title: "Respecting Copyright",
    paragraphs: [
      "TeraPlayer respects copyright and intellectual-property rights. We do not claim ownership of content hosted by third-party services, and we do not host or store the files that flow through the service.",
      "You are responsible for making sure you have permission to access or download any content you use with TeraPlayer.",
      "TeraPlayer only processes publicly shared links. We do not bypass paywalls, DRM, authentication, or any other access controls. If a share is not public, TeraPlayer cannot access it.",
    ],
  },
  {
    icon: TriangleAlert,
    title: "If You Believe Content Infringes",
    paragraphs: [
      "If you believe that content accessed through TeraPlayer infringes your rights, you can reach out to us through the existing Contact page — we do not operate a separate legal complaints portal.",
      "To help us review a request, please include:",
    ],
    bullets: [
      "Identification of the copyrighted work you believe is affected",
      "The specific TeraPlayer link or material you believe is involved",
      "Your contact information so we can respond",
      "A statement, made in good faith, that you believe the use is not authorized",
      "A statement that the information you provide is accurate, and that you are authorized to act on behalf of the rights owner",
    ],
  },
  {
    icon: Scale,
    title: "Counter-Notice",
    paragraphs: [
      "If you believe something was reported in error, you may also contact us with the same details and we'll review it.",
      "Note: TeraPlayer handles these requests informally as an independent tool. We do not operate a formal legal process such as a DMCA filing system, and we cannot act as an intermediary in disputes between users and rights holders.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "What TeraPlayer Does Not Do",
    paragraphs: [
      "To avoid misunderstandings, it is worth being explicit about what TeraPlayer is not:",
    ],
    bullets: [
      "TeraPlayer is not a file host — we do not store or serve the media files you access",
      "TeraPlayer is not a piracy tool — we only work with publicly shared links from supported domains",
      "TeraPlayer does not circumvent DRM, passwords, or authentication",
      "TeraPlayer does not guarantee that any specific link will always work — share availability changes over time",
      "TeraPlayer is not affiliated with TeraBox, Flextech, or any cloud storage provider",
    ],
  },
  {
    icon: FileText,
    title: "User Responsibilities",
    paragraphs: [
      "When you use TeraPlayer, you agree to:",
    ],
    bullets: [
      "Only use the service with public links you are permitted to access",
      "Respect the intellectual property rights of content owners",
      "Comply with the laws of your jurisdiction regarding copyright and digital content",
      "Not use TeraPlayer to circumvent access controls or distribute unauthorized copies",
    ],
  },
  {
    icon: Mail,
    title: "Contact",
    paragraphs: [
      "Please direct copyright inquiries through the Contact page, or email us directly at teraplayer.contact@gmail.com.",
    ],
  },
];

export default function CopyrightPage() {
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
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="tp-container py-14 md:py-20"
          >
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-muted-foreground">
                <Copyright className="h-3.5 w-3.5 text-primary" />
                Legal
              </div>
              <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl">
                <span className="text-primary">Copyright</span> & Intellectual Property
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                A clear page about intellectual property, what TeraPlayer does and doesn't do, and how to get in touch
                if you think something is wrong.
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
                Need to <span className="text-primary">report</span> something?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Send it through the Contact page — we'll review it.
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