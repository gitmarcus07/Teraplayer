import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider, useLang } from "@/i18n/LanguageContext";
import { AdminProvider } from "@/context/AdminContext";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Loader2, Settings, Clock, ExternalLink } from "lucide-react";
import { lazy, Suspense, useState, useEffect } from "react";
import Home from "@/pages/Home";
import ConsentBanner from "@/components/ConsentBanner";
import { getSiteStatus } from "@/services/adminApi";
import { parseMarkdownLinks, getCountdown } from "@/utils/siteUtils";

// Non-critical pages and the entire admin shell are lazy-loaded so they never
// delay the initial hero render. Home stays in the critical path.
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const AboutTeraPlayer = lazy(() => import("@/pages/AboutTeraPlayer"));
const Copyright = lazy(() => import("@/pages/Copyright"));
const TeraBoxVideoDownloader = lazy(() => import("@/pages/TeraBoxVideoDownloader"));
const TeraBoxVideoPlayer = lazy(() => import("@/pages/TeraBoxVideoPlayer"));
const HelpCenter = lazy(() => import("@/pages/HelpCenter"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AdminRoute = lazy(() => import("@/components/admin/AdminRoute"));
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Analytics = lazy(() => import("@/pages/admin/Analytics"));
const SearchConsole = lazy(() => import("@/pages/admin/SearchConsole"));
const Extraction = lazy(() => import("@/pages/admin/Extraction"));
const ExtractionAnalytics = lazy(() => import("@/pages/admin/ExtractionAnalytics"));
const Errors = lazy(() => import("@/pages/admin/Errors"));
const Admins = lazy(() => import("@/pages/admin/Admins"));
const Activity = lazy(() => import("@/pages/admin/Activity"));
const System = lazy(() => import("@/pages/admin/System"));
const Site = lazy(() => import("@/pages/admin/Site"));

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}

// Design-consistent fallback shown briefly while a lazy route chunk loads.
function PageLoader() {
  return (
    <div className="mx-auto flex min-h-[40vh] w-full max-w-3xl items-center justify-center px-5">
      <div
        className="flex items-center gap-2 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>Loading…</span>
      </div>
    </div>
  );
}

function PublicShell() {
  const location = useLocation();

  return (
    <>
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname}>
          <Suspense fallback={<PageLoader />}>
            <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/meet-the-dev" element={<Navigate to="/about-teraplayer" replace />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/about-teraplayer" element={<AboutTeraPlayer />} />
            <Route path="/copyright" element={<Copyright />} />
            <Route path="/terabox-video-downloader" element={<TeraBoxVideoDownloader />} />
            <Route path="/terabox-video-player" element={<TeraBoxVideoPlayer />} />
            <Route path="/help-center" element={<HelpCenter />} />
            {/* Consolidated guides redirect to their merged homes (keeps old links/SEO working) */}
            <Route path="/how-to-download-terabox-videos" element={<Navigate to="/terabox-video-downloader" replace />} />
            <Route path="/terabox-download-mobile" element={<Navigate to="/terabox-video-downloader" replace />} />
            <Route path="/terabox-download-pc" element={<Navigate to="/terabox-video-downloader" replace />} />
            <Route path="/terabox-zip-download" element={<Navigate to="/terabox-video-downloader" replace />} />
            <Route path="/how-to-download-terabox-folder" element={<Navigate to="/terabox-video-downloader" replace />} />
            <Route path="/how-to-watch-terabox-videos" element={<Navigate to="/terabox-video-player" replace />} />
            <Route path="/terabox-video-link-not-working" element={<Navigate to="/help-center" replace />} />
            <Route path="/terabox-public-link" element={<Navigate to="/help-center" replace />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </PageTransition>
      </AnimatePresence>
      <ConsentBanner />
    </>
  );
}

function MaintenanceScreen({ status }) {
  const [countdown, setCountdown] = useState("");

  // Update countdown every second
  useEffect(() => {
    if (!status.schedule_end) return;
    const update = () => setCountdown(getCountdown(status.schedule_end) || "");
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [status.schedule_end]);

  // Render parsed markdown links
  function renderMessage(message) {
    if (!message) return null;
    const parts = parseMarkdownLinks(message);
    return (
      <span className="whitespace-pre-wrap">
        {parts.map((part, i) =>
          part.type === "link" ? (
            <a
              key={i}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              {part.text}
            </a>
          ) : (
            <span key={i}>{part.content}</span>
          )
        )}
      </span>
    );
  }

  const announcement = status.announcement || {};
  const isScheduled = status.scheduled;
  const scheduleEnd = status.schedule_end;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
        {announcement.icon ? (
          <span className="text-4xl">{announcement.icon}</span>
        ) : (
          <Settings className="h-8 w-8 text-primary" />
        )}
      </div>
      <h1 className="text-2xl font-bold">
        {announcement.title || (isScheduled ? "Scheduled Maintenance" : "Under Maintenance")}
      </h1>
      {announcement.message && (
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          {renderMessage(announcement.message)}
        </p>
      )}
      {!announcement.message && !announcement.title && (
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          TeraPlayer is briefly under maintenance. Please check back in a few minutes.
        </p>
      )}

      {/* Buttons */}
      {announcement.buttons?.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {announcement.buttons
            .filter((b) => b.enabled)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((button) => (
              <a
                key={button.id}
                href={button.url}
                target={button.open_in_new_tab ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className={`
                  inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors
                  ${button.open_in_new_tab ? "pr-3" : ""}
                  ${
                    button.style === "primary"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : button.style === "secondary"
                      ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    : button.style === "success"
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : button.style === "warning"
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                    : button.style === "danger"
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "border border-border bg-transparent hover:bg-secondary"
                  }
                `}
              >
                {button.icon && <span>{button.icon}</span>}
                {button.text}
                {button.open_in_new_tab && <ExternalLink className="h-3.5 w-3.5" />}
              </a>
            ))}
        </div>
      )}

      {/* Countdown */}
      {(isScheduled || scheduleEnd) && countdown && (
        <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-700">
            Expected back in: <span className="font-mono font-bold ml-1">{countdown}</span>
          </span>
          {scheduleEnd && (
            <span className="text-xs text-amber-600">
              ({new Date(scheduleEnd).toLocaleString()})
            </span>
          )}
        </div>
      )}

      {/* Powered by */}
      <p className="mt-8 text-xs text-muted-foreground/60">
        Powered by TeraPlayer
      </p>
    </div>
  );
}

function MaintenanceGate({ children }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSiteStatus()
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch(() => {
        if (!cancelled) setStatus({ maintenance_mode: false, announcement: "" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Render children immediately so the homepage is never blocked waiting on a
  // network request; if maintenance is actually enabled we swap in the screen.
  if (status?.maintenance_mode) return <MaintenanceScreen status={status} />;
  return children;
}

function AdminShell() {
  return (
    <AdminProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="search-console" element={<SearchConsole />} />
            <Route path="extraction" element={<Extraction />} />
            <Route path="extraction-analytics" element={<ExtractionAnalytics />} />
            <Route path="errors" element={<Errors />} />
            <Route path="admins" element={<Admins />} />
            <Route path="activity" element={<Activity />} />
            <Route path="system" element={<System />} />
            <Route path="site" element={<Site />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="login" replace />} />
        </Routes>
      </Suspense>
    </AdminProvider>
  );
}

function SkipLink() {
  const { t } = useLang();
  return (
    <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white">
      {t("skip.link")}
    </a>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
      <HelmetProvider>
        <MotionConfig reducedMotion="user">
          <div className="App noise">
          <Helmet>
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "TeraPlayer",
                url: "https://www.teraplayer.in/",
                description: "Watch, stream and download TeraBox videos online for free.",
                inLanguage: "en",
              })}
            </script>
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "TeraPlayer",
                url: "https://www.teraplayer.in/",
                logo: "https://www.teraplayer.in/logo.png",
              })}
            </script>
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "TeraPlayer",
                url: "https://www.teraplayer.in/",
                applicationCategory: "MultimediaApplication",
                operatingSystem: "All",
                browserRequirements: "Requires JavaScript",
                description: "Free online TeraBox video player and downloader.",
              })}
            </script>
          </Helmet>
          <SkipLink />
          <BrowserRouter>
            <Routes>
              <Route path="/admin/*" element={<AdminShell />} />
              <Route path="*" element={<MaintenanceGate><PublicShell /></MaintenanceGate>} />
            </Routes>
            <Toaster
              position="bottom-right"
              richColors
              theme="system"
              toastOptions={{ style: { fontFamily: "Inter, sans-serif" } }}
            />
          </BrowserRouter>
          </div>
        </MotionConfig>
      </HelmetProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;