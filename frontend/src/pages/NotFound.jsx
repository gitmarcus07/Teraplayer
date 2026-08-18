import { useEffect } from "react";
import { motion } from "framer-motion";
import { Compass, Download, Play, Home as HomeIcon, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";

export default function NotFound() {
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
        <section className="py-20 md:py-28">
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
              404 — Not Found
            </p>
            <h1 className="font-display font-black text-4xl tracking-tighter sm:text-5xl">
              This page has <span className="text-primary">drifted off course</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              The link you followed may be outdated, mistyped, or the page has moved.
              Let's get you back on track.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/">
                  <HomeIcon className="mr-2 h-5 w-5" />
                  Back to Home
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link to="/terabox-video-player">
                  <Play className="mr-2 h-5 w-5" />
                  TeraBox Video Player
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link to="/terabox-video-downloader">
                  <Download className="mr-2 h-5 w-5" />
                  TeraBox Downloader
                </Link>
              </Button>
            </div>

            <div className="mt-10 rounded-2xl border border-border/60 bg-surface-raised p-5">
              <h2 className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
                <HelpCircle className="h-4 w-4 text-primary" />
                Still can't find what you need?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try the{" "}
                <Link to="/terabox-video-link-not-working" className="font-medium text-primary hover:underline">
                  TeraBox link not working
                </Link>{" "}
                guide, or{" "}
                <Link to="/contact" className="font-medium text-primary hover:underline">
                  contact us
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
