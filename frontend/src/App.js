import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { ThemeProvider } from "@/context/ThemeContext";
import { AdminProvider } from "@/context/AdminContext";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Loader2 } from "lucide-react";
import { lazy, Suspense, useState, useEffect } from "react";
import Home from "@/pages/Home";
import ConsentBanner from "@/components/ConsentBanner";
import { getSiteStatus } from "@/services/adminApi";

// Non-critical pages and the entire admin shell are lazy-loaded so they never
// delay the initial hero render. Home stays in the critical path.
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const MeetTheDev = lazy(() => import("@/pages/MeetTheDev"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const AboutTeraPlayer = lazy(() => import("@/pages/AboutTeraPlayer"));
const Copyright = lazy(() => import("@/pages/Copyright"));
const TeraBoxVideoDownloader = lazy(() => import("@/pages/TeraBoxVideoDownloader"));
const TeraBoxVideoPlayer = lazy(() => import("@/pages/TeraBoxVideoPlayer"));
const HowToDownloadTeraBoxVideos = lazy(() => import("@/pages/HowToDownloadTeraBoxVideos"));
const HowToWatchTeraBoxVideos = lazy(() => import("@/pages/HowToWatchTeraBoxVideos"));
const TeraBoxVideoLinkNotWorking = lazy(() => import("@/pages/TeraBoxVideoLinkNotWorking"));
const HowToDownloadTeraBoxFolder = lazy(() => import("@/pages/HowToDownloadTeraBoxFolder"));
const TeraBoxZipDownload = lazy(() => import("@/pages/TeraBoxZipDownload"));
const TeraBoxPublicLink = lazy(() => import("@/pages/TeraBoxPublicLink"));
const TeraBoxDownloadMobile = lazy(() => import("@/pages/TeraBoxDownloadMobile"));
const TeraBoxDownloadPC = lazy(() => import("@/pages/TeraBoxDownloadPC"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AdminRoute = lazy(() => import("@/components/admin/AdminRoute"));
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Analytics = lazy(() => import("@/pages/admin/Analytics"));
const Extraction = lazy(() => import("@/pages/admin/Extraction"));
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
            <Route path="/meet-the-dev" element={<MeetTheDev />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/about-teraplayer" element={<AboutTeraPlayer />} />
            <Route path="/copyright" element={<Copyright />} />
            <Route path="/terabox-video-downloader" element={<TeraBoxVideoDownloader />} />
            <Route path="/terabox-video-player" element={<TeraBoxVideoPlayer />} />
            <Route path="/how-to-download-terabox-videos" element={<HowToDownloadTeraBoxVideos />} />
            <Route path="/how-to-watch-terabox-videos" element={<HowToWatchTeraBoxVideos />} />
            <Route path="/terabox-video-link-not-working" element={<TeraBoxVideoLinkNotWorking />} />
            <Route path="/how-to-download-terabox-folder" element={<HowToDownloadTeraBoxFolder />} />
            <Route path="/terabox-zip-download" element={<TeraBoxZipDownload />} />
            <Route path="/terabox-public-link" element={<TeraBoxPublicLink />} />
            <Route path="/terabox-download-mobile" element={<TeraBoxDownloadMobile />} />
            <Route path="/terabox-download-pc" element={<TeraBoxDownloadPC />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </PageTransition>
      </AnimatePresence>
      <ConsentBanner />
    </>
  );
}

function MaintenanceScreen({ announcement }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
      <h1 className="text-2xl font-bold">Under maintenance</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {announcement || "TeraPlayer is briefly under maintenance. Please check back in a few minutes."}
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
  if (status?.maintenance_mode) return <MaintenanceScreen announcement={status.announcement} />;
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
            <Route path="extraction" element={<Extraction />} />
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

function App() {
  return (
    <ThemeProvider>
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
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white">
            Skip to content
          </a>
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
    </ThemeProvider>
  );
}

export default App;