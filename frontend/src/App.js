import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
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

function AppRoutes() {
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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HelmetProvider>
          <div className="App noise">
            <Helmet>
              <script
                async
                src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1829462522713040"
                crossOrigin="anonymous"
              />
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
              <AppRoutes />
            </BrowserRouter>
            <Toaster
              position="bottom-right"
              richColors
              theme="system"
              toastOptions={{ style: { fontFamily: "Inter, sans-serif" } }}
            />
          </div>
        </HelmetProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
