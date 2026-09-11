import { useEffect } from "react";
import { motion } from "framer-motion";
import Seo from "../components/Seo";
import {
  BookOpen,
  MonitorPlay,
  CircleCheck,
  Cookie,
  Globe,
  Activity,
  Scale,
  ShieldCheck,
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
      "Welcome to TeraPlayer!",
      "These terms and conditions outline the rules and regulations for the use of TeraPlayer's Website, located at https://teraplayer.in.",
      "By accessing this website we assume you accept these terms and conditions. Do not continue to use TeraPlayer if you do not agree to take all of the terms and conditions stated on this page.",
    ],
  },
  {
    icon: ScrollText,
    title: "Terminology",
    paragraphs: [
      "The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice and all Agreements: Client, You and Your refers to you, the person logged on this website and compliant to the Company's terms and conditions. The Company, Ourselves, We, Our and Us, refers to TeraPlayer. Party, Parties, or Us, refers to both the Client and ourselves. All terms refer to the offer, acceptance and consideration of payment necessary to undertake the process of our assistance to the Client in the most appropriate manner for the express purpose of meeting the Client's needs in respect of provision of the Company's stated services, in accordance with and subject to prevailing law. Any use of the above terminology or other words in the singular, plural, capitalization and/or he/she or they, are taken as interchangeable and therefore as referring to same.",
    ],
  },
  {
    icon: Cookie,
    title: "Cookies",
    paragraphs: [
      "We employ the use of cookies. By accessing TeraPlayer, you agreed to use cookies in agreement with the TeraPlayer's Privacy Policy.",
      "Most interactive websites use cookies to let us retrieve the user's details for each visit. Cookies are used by our website to enable the functionality of certain areas to make it easier for people visiting our website. Some of our affiliate/advertising partners may also use cookies.",
    ],
  },
  {
    icon: Scale,
    title: "License",
    paragraphs: [
      "Unless otherwise stated, TeraPlayer and/or its licensors own the intellectual property rights for all material on TeraPlayer. All intellectual property rights are reserved. You may access this from TeraPlayer for your own personal use subjected to restrictions set in these terms and conditions.",
      "TeraPlayer provides tools for working with supported public TeraBox links. You can paste a supported link and use the available preview, streaming, and download features. TeraPlayer does not host the files you preview, stream, or download — that content stays on third-party services, and you may only access public links you are allowed to use.",
      "You must not:",
    ],
    bullets: [
      "Republish material from TeraPlayer",
      "Sell, rent or sub-license material from TeraPlayer",
      "Reproduce, duplicate or copy material from TeraPlayer",
      "Redistribute content from TeraPlayer",
      "Use TeraPlayer with links you are not permitted to access, or to violate anyone's rights",
      "Abuse, attack, overload, or otherwise disrupt TeraPlayer or its infrastructure",
    ],
  },
  {
    icon: Globe,
    title: "Hyperlinking to Our Content",
    paragraphs: [
      "The following organizations may link to our Website without prior written approval: Government agencies; Search engines; News organizations; Online directory distributors may link to our Website in the same manner as they hyperlink to the Websites of other listed businesses; and System wide Accredited Businesses except soliciting non-profit organizations, charity shopping malls, and charity fundraising groups which may not hyperlink to our Website.",
      "These organizations may link to our home page, to publications or to other Website information so long as the link: (a) is not in any way deceptive; (b) does not falsely imply sponsorship, endorsement or approval of the linking party and its products and/or services; and (c) fits within the context of the linking party's site.",
      "We may consider and approve other link requests from the following types of organizations: commonly-known consumer and/or business information sources; dot.com community sites; associations or other groups representing charities; online directory distributors; internet portals; accounting, law and consulting firms; and educational institutions and trade associations.",
      "We will approve link requests from these organizations if we decide that: (a) the link would not make us look unfavorably to ourselves or to our accredited businesses; (b) the organization does not have any negative records with us; (c) the benefit to us from the visibility of the hyperlink compensates the absence of TeraPlayer; and (d) the link is in the context of general resource information.",
      "These organizations may link to our home page so long as the link: (a) is not in any way deceptive; (b) does not falsely imply sponsorship, endorsement or approval of the linking party and its products or services; and (c) fits within the context of the linking party's site.",
      "If you are interested in linking to our website, you must inform us by sending an e-mail to teraplayer.contact@gmail.com. Please include your name, your organization name, contact information as well as the URL of your site, a list of any URLs from which you intend to link to our Website, and a list of the URLs on our site to which you would like to link. Wait 2-3 weeks for a response.",
      "Approved organizations may hyperlink to our Website as follows: By use of our corporate name; or By use of the uniform resource locator being linked to; or By use of any other description of our Website being linked to that makes sense within the context and format of content on the linking party's site.",
      "No use of TeraPlayer's logo or other artwork will be allowed for linking absent a trademark license agreement.",
    ],
  },
  {
    icon: MonitorPlay,
    title: "iFrames",
    paragraphs: [
      "Without prior approval and written permission, you may not create frames around our Webpages that alter in any way the visual presentation or appearance of our Website.",
    ],
  },
  {
    icon: TriangleAlert,
    title: "Content Liability",
    paragraphs: [
      "We shall not be held responsible for any content that appears on your Website. You agree to protect and defend us against all claims that arise on your Website. No link(s) should appear on any Website that may be interpreted as libelous, obscene or criminal, or which infringes, otherwise violates, or advocates the infringement or other violation of, any third party rights.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Reservation of Rights",
    paragraphs: [
      "We reserve the right to request that you remove all links or any particular link to our Website. You approve to immediately remove all links to our Website upon request. We also reserve the right to amend these terms and conditions and its linking policy at any time. By continuously linking to our Website, you agree to be bound to and follow these linking terms and conditions.",
    ],
  },
  {
    icon: RefreshCw,
    title: "Removal of Links From Our Website",
    paragraphs: [
      "If you find any link on our Website that is offensive for any reason, you are free to contact and inform us any moment. We will consider requests to remove links but we are not obligated to do so or to respond to you directly.",
      "We do not ensure that the information on this website is correct, we do not warrant its completeness or accuracy; nor do we promise to ensure that the website remains available or that the material on the website is kept up to date.",
    ],
  },
  {
    icon: Activity,
    title: "Service Availability & Disclaimer",
    paragraphs: [
      "TeraPlayer is provided on an \"as is\" and \"as available\" basis. Because link support depends on third-party services such as TeraBox itself, some links may expire or fail, and features may change as those services evolve.",
      "To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will:",
    ],
    bullets: [
      "limit or exclude our or your liability for death or personal injury",
      "limit or exclude our or your liability for fraud or fraudulent misrepresentation",
      "limit any of our or your liabilities in any way that is not permitted under applicable law",
      "exclude any of our or your liabilities that may not be excluded under applicable law",
      "As long as the website and the information and services on the website are provided free of charge, we will not be liable for any loss or damage of any nature.",
    ],
  },
  {
    icon: CircleCheck,
    title: "Changes to These Terms",
    paragraphs: [
      "TeraPlayer may update, change, or discontinue features at any time. We may update these Terms from time to time. When we do, the updated version will be posted here with a new date.",
    ],
  },
  {
    icon: Mail,
    title: "Contact Us",
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
        title="Terms of Service - TeraPlayer Free TeraBox Tool"
        description="The Terms of Service for TeraPlayer — acceptable use, user responsibilities, third-party services, availability, and liability."
        path="/terms"
        ogTitle="Terms of Service - TeraPlayer Free TeraBox Tool"
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
              <h1 className="font-display font-black text-4xl leading-[1.08] tracking-tighter text-balance sm:text-5xl">
                {t("legal.termsA")} <span className="text-primary">{t("legal.termsB")}</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                The rules for using TeraPlayer, written to be readable — not just legally safe.
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