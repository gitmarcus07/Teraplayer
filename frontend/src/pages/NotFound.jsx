import { useEffect } from "react";
import { motion } from "framer-motion";
import { Compass, Download, Play, Home as HomeIcon, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { useLang } from "../i18n/LanguageContext";

export default function NotFound() {
  const { t } = useLang();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-void">
      <Header />

      <Seo
        title="Page Not Found — TeraPlayer"
        description="The page you are looking for does not exist or has moved. Head back to the TeraPlayer homepage to watch and download TeraBox videos."
        path="/404"
        robots="noindex, follow"
        ogTitle="Page Not Found — TeraPlayer"
        ogDescription="The page you are looking for does not exist or has moved. Head back to the TeraPlayer homepage."
        imageAlt="TeraPlayer - Watch & Download TeraBox Videos Free"
        twitterDescription="This page could not be found. Head back to the TeraPlayer homepage."
      />

      <main id="main" className="tp-container">
        <section className="relative overflow-hidden py-20 md:py-28">
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-full max-w-3xl -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-2xl text-center"
          >
            <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/25">
              <Compass className="h-8 w-8 text-primary" strokeWidth={1.5} />
            </div>

            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
              {t("nf.eyebrow")}
            </p>
            <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl">
              {t("nf.titleA")} <span className="text-primary">{t("nf.titleB")}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              {t("nf.body")}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/">
                  <HomeIcon className="mr-2 h-5 w-5" />
                  {t("nf.home")}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link to="/terabox-video-player">
                  <Play className="mr-2 h-5 w-5" />
                  {t("nf.player")}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link to="/terabox-video-downloader">
                  <Download className="mr-2 h-5 w-5" />
                  {t("nf.downloader")}
                </Link>
              </Button>
            </div>

            <div className="mt-10 rounded-2xl border border-border/60 bg-surface-raised p-5">
              <h2 className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
                <HelpCircle className="h-4 w-4 text-primary" />
                {t("nf.helpT")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("nf.helpA")}{" "}
                <Link to="/help-center" className="font-medium text-primary hover:underline">
                  {t("nav.helpCenter")}
                </Link>{" "}
                {t("nf.helpB")}{" "}
                <Link to="/contact" className="font-medium text-primary hover:underline">
                  {t("nf.helpContact")}
                </Link>
                .
              </p>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
