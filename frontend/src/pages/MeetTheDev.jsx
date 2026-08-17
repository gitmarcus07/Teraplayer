import { useEffect } from "react";
import { motion } from "framer-motion";
import Seo from "../components/Seo";
import {
  Sparkles,
  Code2,
  Gamepad2,
  Hourglass,
  Hammer,
  Rocket,
  Check,
  Layers,
  Server,
  Cloud,
  Instagram,
  Twitter,
  Github,
  ExternalLink,
  Mail,
  Heart,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { FooterLegalLinks } from "../components/Footer";

const fadeUp = {
  initial: { opacity: 0, scale: 0.97 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

const SKILLS = [
  "HTML",
  "CSS",
  "JavaScript",
  "Java",
  "Python",
  "React",
  "REST APIs",
  "Git",
  "GitHub",
  "Responsive Web Design",
];

const JOURNEY = [
  { icon: Gamepad2, label: "Gaming", note: "Where it started" },
  { icon: Hourglass, label: "Bored", note: "It just stopped being fun" },
  { icon: Hammer, label: "Building", note: "Opened the editor instead" },
  { icon: Rocket, label: "TeraPlayer", note: "One idea that kept going" },
];

const STACK = [
  {
    icon: Layers,
    title: "Frontend",
    items: ["React", "JavaScript", "Tailwind CSS", "Axios", "Framer Motion", "React Router", "HLS.js", "JSZip"],
  },
  {
    icon: Server,
    title: "Backend",
    items: ["Python", "FastAPI", "MongoDB", "REST APIs"],
  },
  {
    icon: Cloud,
    title: "Infra & Tooling",
    items: ["Cloudflare Workers", "Vercel", "Render", "Git", "GitHub"],
  },
];

const SOCIALS = [
  {
    icon: Instagram,
    label: "Instagram",
    handle: "ig__marcus",
    href: "https://instagram.com/ig__marcus",
    aria: "Marcus on Instagram",
  },
  {
    icon: Twitter,
    label: "X",
    handle: "x_marcus07",
    href: "https://x.com/x_marcus07",
    aria: "Marcus on X",
  },
  {
    icon: Github,
    label: "GitHub",
    handle: "gitmarcus07",
    href: "https://github.com/gitmarcus07",
    aria: "Marcus on GitHub",
  },
];

export default function MeetTheDev() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Seo
        title="Meet the Dev — TeraPlayer"
        description="Marcus — the 20-year-old BCA student behind TeraPlayer. Gaming → boredom → building. Meet the dev, the stack, and the story."
        path="/meet-the-dev"
        ogTitle="Meet the Dev — TeraPlayer"
        ogDescription="Marcus — the 20-year-old BCA student behind TeraPlayer. Gaming → boredom → building. Meet the dev, the stack, and the story."
        imageAlt="TeraPlayer - Watch & Download TeraBox Videos Free"
        twitterDescription="Marcus — the 20-year-old BCA student behind TeraPlayer. Gaming → boredom → building."
      />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="tp-container py-14 md:py-24"
          >
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Built by Marcus
              </div>
              <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl lg:text-6xl">
                Meet the{" "}
                <span className="relative inline-block">
                  <span className="text-primary">Dev.</span>
                  <span className="absolute inset-x-0 -bottom-1 h-1 bg-primary/40" />
                </span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                I'm the person behind TeraPlayer. 20 years old, doing my BCA, and way too deep into my editor to come out.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Intro */}
        <section className="tp-container py-16 md:py-20">
          <div className="mx-auto max-w-4xl">
            <motion.div {...fadeUp} className="rounded-2xl border border-border bg-surface-raised p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 sm:h-14 sm:w-14">
                  <Code2 className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">the dev behind TeraPlayer</p>
                  <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                    Hi, I'm <span className="text-primary">Marcus</span>
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-border bg-surface-overlay/50 px-2.5 py-1 text-xs">20</span>
                    <span className="rounded-full border border-border bg-surface-overlay/50 px-2.5 py-1 text-xs">BCA · Year 2</span>
                    <span className="rounded-full border border-border bg-surface-overlay/50 px-2.5 py-1 text-xs">Creator of TeraPlayer</span>
                  </div>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                    Everyone calls me Marcus — that's what I go by. I'm a second-year BCA student, and I built TeraPlayer
                    from scratch. No big team, no office, no budget. Just me, a laptop, and a genuinely unhealthy number
                    of browser tabs.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* The story */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                The <span className="text-primary">story</span>
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <p>
                  Honestly? TeraPlayer started because I was getting{" "}
                  <span className="font-medium text-foreground">bored of gaming</span>. Instead of opening another game,
                  I opened my editor.
                </p>
                <p>
                  One random idea turned into an actual project. I wanted to learn how the web really works — so I built
                  something that forced me to figure it out. Break it, fix it, ship it, repeat.
                </p>
                <p>
                  No big team. Just me, a laptop, a lot of tabs, and way too much debugging. The point was never to be
                  perfect — it was to see how far one idea could go.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {JOURNEY.map((s) => (
                  <div key={s.label} className="rounded-2xl border border-border bg-surface-raised p-4 text-center">
                    <s.icon className="mx-auto mb-2 h-5 w-5 text-primary" strokeWidth={1.75} />
                    <div className="text-sm font-semibold">{s.label}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{s.note}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Things I know */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
              Things I <span className="text-primary">know</span>
            </h2>
            <p className="mt-3 text-muted-foreground">The stuff I've picked up so far — still learning, always adding to the list.</p>

            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {SKILLS.map((skill) => (
                <div
                  key={skill}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm"
                >
                  <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                  {skill}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* What's under the hood */}
        <section className="border-y border-border/40 bg-surface-overlay/30">
          <div className="tp-container py-16 md:py-20">
            <motion.div {...fadeUp} className="mx-auto max-w-5xl">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                  What's <span className="text-primary">under the hood</span>
                </h2>
                <p className="mt-3 text-muted-foreground">Not a flex — this is genuinely the stack TeraPlayer runs on.</p>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {STACK.map(({ icon: Icon, title, items }) => (
                  <div key={title} className="rounded-2xl border border-border bg-surface-raised p-5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {items.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-lg border border-border bg-surface-overlay/50 px-2.5 py-1 text-xs"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Social */}
        <section className="tp-container py-16 md:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-4xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display font-bold text-2xl tracking-tight sm:text-3xl">
                Come say <span className="text-primary">hi</span>
              </h2>
              <p className="mt-3 text-muted-foreground">The internet's fine, but the replies are better.</p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {SOCIALS.map(({ icon: Icon, label, handle, href, aria }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={aria}
                  className="group flex items-center gap-3 rounded-2xl border border-border bg-surface-raised p-4 transition-[border-color,box-shadow,brightness] duration-300 ease-out hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:brightness-110"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{label}</div>
                    <div className="truncate text-xs text-muted-foreground">{handle}</div>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </a>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Closing */}
        <section className="border-t border-border/40 bg-gradient-to-b from-transparent to-primary/[0.03]">
          <div className="tp-container py-16 text-center md:py-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-2xl"
            >
              <Heart className="mx-auto h-6 w-6 text-primary" />
              <blockquote className="mt-5 font-display font-bold text-2xl tracking-tight sm:text-3xl">
                "Started because I was bored.
                <br />
                Stayed because building is <span className="text-primary">addictive</span>."
              </blockquote>
              <p className="mt-4 text-sm text-muted-foreground">— Marcus</p>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
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

            <FooterLegalLinks />

            <div className="mt-6 text-center text-xs text-muted-foreground opacity-70">
              Only supports public TeraBox links. Respect the original owners.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}