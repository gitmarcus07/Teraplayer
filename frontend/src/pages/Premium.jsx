import { useEffect } from "react";
import { motion } from "framer-motion";
import Seo from "../components/Seo";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Play,
  Clock,
  Search,
  Film,
  Info,
  HelpCircle,
  ChevronRight,
  Send,
  Clapperboard,
} from "lucide-react";
import Header from "../components/Header";
import { Button } from "../components/ui/button";

const LATENT_CHANNEL_URL = "https://t.me/+f-F51sUK8Iw1ZjRl";

const fadeUp = {
  initial: { opacity: 0, scale: 0.97 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

const faqs = [
  {
    q: "How can I watch India's Got Latent bonus episodes?",
    a: "Bonus episodes are usually made available through the show's official channels or the platform that distributes the series. Keep an eye on the primary release channels and any updates shared there for details on where bonus episodes are published.",
  },
  {
    q: "Where can I find India's Got Latent members-only episodes?",
    a: "Members-only episodes are typically published behind a subscription or access-controlled platform chosen by the show's team. If a membership tier exists, the official channel generally explains how to join and where that content lives.",
  },
  {
    q: "Are India's Got Latent bonus episodes available online?",
    a: "Some bonus episodes may be available online through the official platforms the show uses. Availability changes over time, so checking the official channels for the most current release information is the best approach.",
  },
  {
    q: "Where can I find India's Got Latent extra content?",
    a: "Extra content such as bonus clips and behind-the-scenes footage is usually shared through the show's official social channels and distribution platforms. The Latent button on this page points to a community channel where extra clips are gathered.",
  },
];

const faqSchema = {
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
};

export default function Premium() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Seo
        title="India's Got Latent Bonus & Members Only Episodes | TeraPlayer"
        description="Learn how to watch India's Got Latent bonus episodes, members-only episodes, extra content and the latest updates."
        path="/premium"
        ogTitle="India's Got Latent Bonus & Members Only Episodes | TeraPlayer"
        ogDescription="Learn how to watch India's Got Latent bonus episodes, members-only episodes, extra content and the latest updates."
        imageAlt="India's Got Latent bonus and members-only episodes - TeraPlayer"
        twitterDescription="Learn how to watch India's Got Latent bonus episodes, members-only episodes, extra content and the latest updates."
      >
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Seo>

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
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Bonus &amp; members-only content
              </div>
              <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl lg:text-6xl">
                India's Got <span className="text-primary">Latent</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                If you've been searching for how to watch India's Got Latent bonus episodes, members-only episodes,
                or extra content, this page gathers the useful information in one place.
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Below you'll find a practical overview of bonus and members-only episodes, where to look for
                additional clips and updates, and how to keep up with the latest episodes as they're released.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  asChild
                  className="h-12 px-8 text-base"
                  size="lg"
                  data-testid="latent-btn"
                >
                  <a href={LATENT_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                    <Send className="mr-2 h-5 w-5" />
                    Latent
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Bonus episodes */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <Clapperboard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                  India's Got Latent <span className="text-primary">Bonus Episodes</span>
                </h2>
                <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  <p>
                    Bonus episodes are extra installments that sit outside the main episode run of a series. For a
                    show like India's Got Latent, bonus content can include extended segments, behind-the-scenes
                    footage, or episodes that simply didn't make it into the regular release schedule.
                  </p>
                  <p>
                    These episodes are usually announced and shared through the official channels the show already
                    uses. When new bonus material is published, fans typically find out through those same sources —
                    social channels, the primary platform, or community pages that follow the show.
                  </p>
                  <p>
                    If you're specifically looking for India's Got Latent bonus episode information, the most reliable
                    way to stay informed is to follow the show's official announcements and check the platforms where
                    the series is distributed.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* How to watch bonus episodes */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                How to Watch India's Got Latent <span className="text-primary">Bonus Episodes</span>
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <p>
                  There isn't a single universal place where every India's Got Latent bonus episode lives, so how you
                  watch them depends on where they're released. The first step is to follow the official channels,
                  because that's where new bonus episodes are announced.
                </p>
                <p>
                  When a bonus episode becomes available, it's usually published on the same platform that hosts the
                  main episodes, or shared as a clip through the show's social profiles. Community channels that track
                  the show also surface bonus content as it appears, which can be a handy way to keep everything in
                  one feed.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Members-only episodes */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              India's Got Latent <span className="text-primary">Members-Only Episodes</span>
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                Some additional India's Got Latent content may be made available through members-only or
                access-controlled platforms. This is a common pattern for shows that offer extra episodes, early
                releases, or exclusive clips behind a subscription or community tier.
              </p>
              <p>
                If a members-only tier exists, the show's official channel will typically explain how to join and
                where the content is hosted. Because access is controlled, members-only episodes are usually not
                available through general search or public links.
              </p>
              <p>
                If you're looking for legitimate access to members-only episodes, the safest approach is to check the
                official announcements and avoid unofficial sources that claim to host access-controlled content.
              </p>
            </div>
          </motion.div>
        </section>

        {/* How to find extra episodes */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                    How to Find India's Got Latent <span className="text-primary">Extra Episodes</span>
                  </h2>
                  <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                    <p>
                      Looking for additional India's Got Latent episodes, clips, or bonus content? The best results
                      come from a combination of a few straightforward places:
                    </p>
                    <ul className="space-y-2">
                      {[
                        "Follow the show's official social channels and announcements.",
                        "Check the platform that distributes the main episodes for any extra uploads.",
                        "Search for the latest episode name or bonus clip titles on YouTube and video platforms.",
                        "Join community channels where fans share and discuss new bonus content as it appears.",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p>
                      Because extra episodes are published at different times and on different platforms, no single
                      link covers everything. Staying active on the channels that announce new content is the most
                      dependable way to catch them.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Latest updates */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                  Latest India's Got Latent <span className="text-primary">Updates</span>
                </h2>
                <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  <p>
                    This section is reserved for the latest India's Got Latent episode and update information as it
                    becomes available. New episodes, bonus releases, and members-only announcements will be noted here
                    so returning visitors have a quick reference point.
                  </p>
                  <p>
                    Until a new update is published, the fastest way to stay current is to check the show's official
                    channels or the community updates shared through the Latent button at the top of this page.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* FAQ */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-3xl">
              <div className="text-center">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-muted-foreground">
                  <HelpCircle className="h-3.5 w-3.5 text-primary" />
                  Questions &amp; answers
                </div>
                <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                  Frequently Asked <span className="text-primary">Questions</span>
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Quick answers to the most common questions about India's Got Latent bonus and members-only content.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                {faqs.map((faq, i) => (
                  <motion.div
                    key={faq.q}
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.04 * i }}
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
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/40 bg-gradient-to-b from-transparent to-primary/[0.03]">
          <div className="tp-container py-16 text-center md:py-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-2xl"
            >
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                Ready to explore more India's Got Latent content?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Open the Latent channel to keep up with extra clips and community updates on the show.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button asChild className="h-12 px-8 text-base" size="lg">
                  <a href={LATENT_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                    <Play className="mr-2 h-5 w-5" />
                    Latent
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-12 px-8 text-base" size="lg">
                  <Link to="/">
                    <Film className="mr-2 h-5 w-5" />
                    Back to TeraPlayer home
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Disclaimer */}
      <footer className="border-t border-border/40 bg-surface-raised/50">
        <div className="tp-container py-10">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-surface-overlay/20 p-5">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">Note:</span> TeraPlayer is an independent tool and
                  is <span className="font-semibold text-foreground">not affiliated with</span>, endorsed by, or
                  sponsored by India's Got Latent or its production team. The Latent channel is a community channel
                  and is not operated by the show's official team. All trademarks and content belong to their
                  respective owners.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col items-center justify-between gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-semibold text-foreground">
                  Tera<span className="text-primary">Player</span>
                </span>
                <span>·</span>
                <span>Free to use · no account required</span>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/" className="transition-colors duration-200 hover:text-foreground">
                  Home
                </Link>
                <Link to="/about" className="transition-colors duration-200 hover:text-foreground">
                  About
                </Link>
                <Link to="/contact" className="transition-colors duration-200 hover:text-foreground">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
