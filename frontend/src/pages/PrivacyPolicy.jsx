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
  Baby,
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
    icon: Info,
    title: "Overview",
    paragraphs: [
      "At TeraPlayer, accessible from https://teraplayer.in, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by TeraPlayer and how we use it.",
      "If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.",
      "This Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to the information that they shared and/or collect in TeraPlayer. This policy is not applicable to any information collected offline or via channels other than this website.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Consent",
    paragraphs: [
      "By using our website, you hereby consent to our Privacy Policy and agree to its terms.",
    ],
  },
  {
    icon: Database,
    title: "Information We Collect",
    paragraphs: [
      "The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.",
      "If you contact us directly, we may receive additional information about you such as your name, email address, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.",
      "If you paste a TeraBox link to preview, stream, or download content, that link is sent to our backend so it can be processed for you. This is required for the service to work.",
      "Creating an account is optional. If you sign in with Google, we receive the limited profile information Google shares with your approval (such as name and email address).",
    ],
  },
  {
    icon: Settings2,
    title: "How We Use Your Information",
    paragraphs: [
      "We use the information we collect in various ways, including to:",
    ],
    bullets: [
      "Provide, operate, and maintain our website",
      "Process the TeraBox links you paste so previews, streaming, and downloads work",
      "Improve, personalize, and expand our website",
      "Understand and analyze how you use our website",
      "Develop new products, services, features, and functionality",
      "Communicate with you, either directly or through one of our partners, including for customer service and to provide you with updates and other information relating to the website",
      "Provide account features if you choose to sign in",
      "Find and prevent fraud, abuse, and overload of the service",
    ],
  },
  {
    icon: Clock,
    title: "Log Files",
    paragraphs: [
      "TeraPlayer follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and it is a part of hosting services analytics. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users movement on the website, and gathering demographic information.",
    ],
  },
  {
    icon: Cookie,
    title: "Cookies and Web Beacons",
    paragraphs: [
      "Like any other website, TeraPlayer uses cookies. These cookies are used to store information including visitors preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users experience by customizing our web page content based on visitors browser type and/or other information.",
      "TeraPlayer stores a small theme preference in your browser's local storage so your chosen appearance is remembered between visits, and a short playback resume position in session storage so a video continues where you left off within the same session.",
      "Analytics cookies (PostHog and Google Analytics) are set only after you accept the consent banner shown on your first visit. If you decline, analytics are not enabled. Local storage and cookies live in your browser, and you can clear them at any time through your browser settings.",
    ],
  },
  {
    icon: Globe,
    title: "Google DoubleClick DART Cookie",
    paragraphs: [
      "Google is one of the third-party vendors on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at https://policies.google.com/technologies/ads.",
    ],
  },
  {
    icon: Sparkles,
    title: "Our Advertising Partners",
    paragraphs: [
      "Some of the advertisers on our site may use cookies and web beacons. Our advertising partners are listed below. Each of our advertising partners has their own Privacy Policy for their policies on user data.",
      "Third-party ad servers or ad networks use technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on TeraPlayer, which are sent directly to users browser. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.",
      "Note that TeraPlayer has no access to or control over these cookies that are used by third-party advertisers.",
      "TeraPlayer's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options. You can choose to disable cookies through your individual browser options.",
    ],
    bullets: [
      "Google — https://policies.google.com/technologies/ads",
    ],
  },
  {
    icon: KeyRound,
    title: "Accounts and Authentication",
    paragraphs: [
      "Creating an account is optional. If you sign in with Google, we receive the limited profile information Google shares with your approval (such as name and email). Account and session data is stored in our database, and sessions are set to expire automatically after a period of inactivity.",
      "Passwords, where used, are stored as secure hashes and session cookies are set as HTTP-only. No method of transmission over the internet is 100% secure, but we take reasonable technical measures to protect the data we handle.",
    ],
  },
  {
    icon: UserCheck,
    title: "CCPA Privacy Rights (Do Not Sell My Personal Information)",
    paragraphs: [
      "Under the CCPA, among other rights, California consumers have the right to:",
    ],
    bullets: [
      "Request that a business that collects a consumer's personal data disclose the categories and specific pieces of personal data that a business has collected about consumers",
      "Request that a business delete any personal data about the consumer that a business has collected",
      "Request that a business that sells a consumer's personal data, not sell the consumer's personal data",
    ],
  },
  {
    icon: ScrollText,
    title: "GDPR Data Protection Rights",
    paragraphs: [
      "We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:",
    ],
    bullets: [
      "The right to access — You have the right to request copies of your personal data. We may charge you a small fee for this service.",
      "The right to rectification — You have the right to request that we correct any information you believe is inaccurate. You also have the right to request that we complete the information you believe is incomplete.",
      "The right to erasure — You have the right to request that we erase your personal data, under certain conditions.",
      "The right to restrict processing — You have the right to request that we restrict the processing of your personal data, under certain conditions.",
      "The right to object to processing — You have the right to object to our processing of your personal data, under certain conditions.",
      "The right to data portability — You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.",
      "If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us.",
    ],
  },
  {
    icon: Baby,
    title: "Children's Information",
    paragraphs: [
      "Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.",
      "TeraPlayer does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.",
    ],
  },
  {
    icon: Clock,
    title: "Changes to This Privacy Policy",
    paragraphs: [
      "We may update our Privacy Policy from time to time. Thus, we advise you to review this page periodically for any changes. We will notify you of any changes by posting the new Privacy Policy on this page. These changes are effective immediately, after they are posted on this page.",
    ],
  },
  {
    icon: Mail,
    title: "Contact Us",
    paragraphs: [
      "If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us through the Contact page, or email us directly at teraplayer.contact@gmail.com.",
    ],
  },
];

export default function PrivacyPolicy() {
  const { t } = useLang();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Seo
        title="Privacy Policy - TeraPlayer Free TeraBox Tool"
        description="How TeraPlayer handles information — what we process, why, cookies and local storage, third-party services, and your choices."
        path="/privacy"
        ogTitle="Privacy Policy - TeraPlayer Free TeraBox Tool"
        ogDescription="How TeraPlayer handles information — what we process, why, cookies and local storage, third-party services, and your choices."
        imageAlt="TeraPlayer - Watch & Download TeraBox Videos Free"
        twitterDescription="How TeraPlayer handles information and the choices you have about it."
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
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                {t("legal.eyebrow")}
              </div>
              <h1 className="font-display font-black text-4xl leading-[1.08] tracking-tighter text-balance sm:text-5xl">
                {t("legal.privacyA")} <span className="text-primary">{t("legal.privacyB")}</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                A plain-English look at what information TeraPlayer processes, why, and what you can do about it.
              </p>
              <p className="mt-3 text-xs text-muted-foreground/80">{t("legal.updated")} September 11, 2026</p>
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