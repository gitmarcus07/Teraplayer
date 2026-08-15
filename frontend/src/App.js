import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { ThemeProvider } from "@/context/ThemeContext";
import { AdminProvider } from "@/context/AdminContext";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import MeetTheDev from "@/pages/MeetTheDev";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import AboutTeraPlayer from "@/pages/AboutTeraPlayer";
import Copyright from "@/pages/Copyright";
import TeraBoxVideoDownloader from "@/pages/TeraBoxVideoDownloader";
import TeraBoxVideoPlayer from "@/pages/TeraBoxVideoPlayer";
import HowToDownloadTeraBoxVideos from "@/pages/HowToDownloadTeraBoxVideos";
import HowToWatchTeraBoxVideos from "@/pages/HowToWatchTeraBoxVideos";
import TeraBoxVideoLinkNotWorking from "@/pages/TeraBoxVideoLinkNotWorking";
import HowToDownloadTeraBoxFolder from "@/pages/HowToDownloadTeraBoxFolder";
import TeraBoxZipDownload from "@/pages/TeraBoxZipDownload";
import TeraBoxPublicLink from "@/pages/TeraBoxPublicLink";
import TeraBoxDownloadMobile from "@/pages/TeraBoxDownloadMobile";
import TeraBoxDownloadPC from "@/pages/TeraBoxDownloadPC";
import Premium from "@/pages/Premium";
import AdminRoute from "@/components/admin/AdminRoute";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import Analytics from "@/pages/admin/Analytics";
import Extraction from "@/pages/admin/Extraction";
import Admins from "@/pages/admin/Admins";
import Activity from "@/pages/admin/Activity";
import System from "@/pages/admin/System";
import Site from "@/pages/admin/Site";
import { getSiteStatus } from "@/services/adminApi";

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

function PublicShell() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <PageTransition key={location.pathname}>
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
          <Route path="/premium" element={<Premium />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
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

  if (!status) return null;
  if (status.maintenance_mode) return <MaintenanceScreen announcement={status.announcement} />;
  return children;
}

function AdminShell() {
  return (
    <AdminProvider>
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
    </AdminProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <HelmetProvider>
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
      </HelmetProvider>
    </ThemeProvider>
  );
}

export default App;