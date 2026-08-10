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
import TeraBoxVideoDownloader from "@/pages/TeraBoxVideoDownloader";
import TeraBoxVideoPlayer from "@/pages/TeraBoxVideoPlayer";

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
                <Route path="/terabox-video-downloader" element={<TeraBoxVideoDownloader />} />
                <Route path="/terabox-video-player" element={<TeraBoxVideoPlayer />} />
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
              <script type="application/ld+json">
                {JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "WebSite",
                  name: "TeraPlayer",
                  url: "https://teraplayer.in/",
                  description: "Watch, stream and download TeraBox videos online for free.",
                  inLanguage: "en",
                })}
              </script>
              <script type="application/ld+json">
                {JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "WebApplication",
                  name: "TeraPlayer",
                  url: "https://teraplayer.in/",
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
