import { useEffect } from "react";
import { motion } from "framer-motion";
import Seo from "../components/Seo";
import {
  Sparkles,
  Info,
  Database,
  Settings2,
  Cookie,
  Globe,
  KeyRound,
  ShieldCheck,
  Clock,
  UserCheck,
  ScrollText,
  Mail,
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
    title: "Overview",
    paragraphs: [
      "TeraPlayer is a web tool for working with supported public TeraBox links. This policy explains what information TeraPlayer processes, why, and the choices you have about it.",
      "TeraPlayer is designed to be lightweight: you can use the core preview, streaming, and download features without creating an account. This policy covers both anonymous use and use with an optional account.",
    ],
  },
  {
    icon: Database,
    title: "Information We May Collect",
    paragraphs: [
      "TeraPlayer may process basic technical information that is normally required to operate a website. When you use TeraPlayer, our servers may see standard request information such as your IP address, browser and device information, the pages you request, and related usage information.",
      "If you paste a TeraBox link to preview, stream, or download content, that link is sent to our backend so it can be processed for you. This is required for the service to work.",
    ],
    bullets: [
      "Technical request information (such as IP address, browser and device details, and basic usage information)",
      "Aggregate analytics events (such as approximate usage and feature engagement) via PostHog and Google Analytics",
      "TeraBox links you paste in order to use the service",
      "Account information you choose to provide (such as name and email address) if you sign up",
    ],
  },
  {
    icon: Settings2,
    title: "How We Use Information",
    paragraphs: [
      "We use the information described above to operate, maintain, secure, and improve TeraPlayer, including:",
    ],
    bullets: [
      "Processing the links you paste so previews, streaming, and downloads work",
      "Keeping the service secure and available (for example, rate limiting and abuse prevention)",
      "Providing account features if you choose to sign in",
      "Understanding general usage so we can make the product better",
    ],
  },
  {
    icon: Cookie,
    title: "Cookies and Local Storage",
    paragraphs: [
      "TeraPlayer stores a small theme preference in your browser's local storage so your chosen appearance is remembered between visits, and a short playback resume position in session storage so a video continues where you left off within the same session.",
      "We use privacy-conscious analytics (PostHog and Google Analytics) to understand general usage and improve the product. These services set cookies only after you accept the consent banner shown on your first visit. If you decline, analytics are not enabled.",
      "If you sign in, our backend sets secure session cookies so you can stay signed in. These cookies are set by TeraPlayer itself.",
      "We load the Google AdSense verification tag only after you accept the consent banner, to prepare for advertising. We do not currently serve ad units. Once the tag is loaded, Google may set advertising cookies (for example the Google/DoubleClick IDE cookie) according to its own policies.",
      "Local storage and cookies live in your browser, and you can clear them at any time through your browser settings.",
    ],
  },
  {
    icon: Globe,
    title: "Third-Party Services",
    paragraphs: [
      "TeraPlayer uses a small number of third-party services to run, analyze, and resolve links:",
    ],
    bullets: [
      "Google Analytics — aggregated, privacy-conscious web analytics (enabled only after you accept the consent banner)",
      "PostHog — privacy-conscious product analytics, enabled only after you accept the consent banner",
      "Google AdSense — advertising verification tag loaded only after you accept the consent banner; ad units are not currently served",
      "Google Fonts — web fonts loaded from Google's CDN; like all web fonts, requests include standard request information such as your IP address",
      "Google Sign-In (optional) — lets you sign in with a Google account, subject to Google's privacy policy",
      "A third-party extraction service (xAPIverse) — used to resolve TeraBox links; only the link data needed for resolution is shared",
      "Cloudflare Workers, Vercel, Render, and MongoDB — hosting and data infrastructure for the frontend, backend, and storage",
    ],
  },
  {
    icon: KeyRound,
    title: "Accounts and Authentication",
    paragraphs: [
      "Creating an account is optional. If you sign up with an email and password, we store your name, email, and a securely hashed password. If you sign in with Google, we receive the limited profile information Google shares with your approval (such as name and email).",
      "Account and session data is stored in our database, and sessions are set to expire automatically after a period of inactivity.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Data Security",
    paragraphs: [
      "Passwords are stored as secure hashes, session cookies are set as HTTP-only, and access to the backend is limited to what the service needs.",
      "No method of transmission over the internet is 100% secure, but we take reasonable technical measures to protect the data we handle.",
    ],
  },
  {
    icon: Clock,
    title: "Data Retention",
    paragraphs: [
      "We keep information only as long as it is reasonably needed to operate the service. Some records are deleted automatically: sessions expire after a period of inactivity, and temporary extraction jobs and rate-limiting records are set to expire on a schedule.",
      "We do not claim specific retention periods beyond what the service actually implements. If you have questions about data we may hold, please use the Contact page.",
    ],
  },
  {
    icon: UserCheck,
    title: "User Choices",
    paragraphs: [
      "If you use TeraPlayer without an account, there is no account data for us to manage. You can always clear your browser's local storage and cookies.",
      "When you first visit, a small non-intrusive banner asks whether you accept analytics and advertising cookies. The core features of TeraPlayer work whether you accept or decline. You can change your choice at any time by clearing your browser's local storage and refreshing.",
      "If you signed in, you can sign out from the header menu at any time. For anything else — including questions about your data — use the Contact page.",
    ],
  },
  {
    icon: ScrollText,
    title: "Changes to This Policy",
    paragraphs: [
      "We may update this policy from time to time. When we do, we'll post the updated version here and update the date at the top of this page.",
    ],
  },
  {
    icon: Mail,
    title: "Contact",
    paragraphs: [
      "Questions about this policy? Get in touch through the Contact page, or email us directly at teraplayer.contact@gmail.com.",
    ],
  },
];

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Seo
        title="Privacy Policy — TeraPlayer"
        description="How TeraPlayer handles information — what we process, why, cookies and local storage, third-party services, and your choices."
        path="/privacy"
        ogTitle="Privacy Policy — TeraPlayer"
        ogDescription="How TeraPlayer handles information — what we process, why, cookies and local storage, third-party services, and your choices."
        imageAlt="TeraPlayer - Watch & Download TeraBox Videos Free"
        twitterDescription="How TeraPlayer handles information and the choices you have about it."
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
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Legal
              </div>
              <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl">
                Privacy <span className="text-primary">Policy</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                A plain-English look at what information TeraPlayer processes, why, and what you can do about it.
              </p>
              <p className="mt-3 text-xs text-muted-foreground/80">Last updated: August 18, 2026</p>
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
                Have a <span className="text-primary">question?</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Reach out through the Contact page and we'll get back to you.
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