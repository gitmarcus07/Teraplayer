import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";
import { Menu, X, Home, Info, Mail, Download, Video, FolderOpen, Archive, LifeBuoy, Sun, Moon, Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../i18n/LanguageContext";
import { Button } from "./ui/button";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Lightweight focus trap: anything a keyboard/SR user can reach while the
// drawer is open. Kept dependency-free on purpose.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Header() {
  const location = useLocation();
  const { mode, setTheme } = useTheme();
  const { t, lang, setLang, langs } = useLang();
  const isDark = mode === "dark";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuBtnRef = useRef(null);
  const closeBtnRef = useRef(null);
  const drawerRef = useRef(null);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Move focus into the drawer when it opens so keyboard/SR users land inside
  // it instead of the page behind the overlay. Never runs while closed.
  useEffect(() => {
    if (mobileMenuOpen) {
      closeBtnRef.current?.focus();
    }
  }, [mobileMenuOpen]);

  // When the drawer closes, return focus to the trigger that opened it.
  // Fires only on the true → false transition; guards the initial mount.
  useEffect(() => {
    if (prevOpenRef.current && !mobileMenuOpen) {
      menuBtnRef.current?.focus();
    }
    prevOpenRef.current = mobileMenuOpen;
  }, [mobileMenuOpen]);

  // Escape closes the drawer; Tab / Shift+Tab stay trapped inside it so focus
  // can never escape behind the overlay. Listener is attached only while the
  // drawer is open and removed on close/unmount.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobileMenuOpen(false);
        return;
      }
      if (e.key !== "Tab") return;

      const node = drawerRef.current;
      if (!node) return;
      const focusables = Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute("disabled")
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !node.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !node.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className="z-30 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
        data-testid="app-header"
      >
        {/* Reference-style bar: brand left, three pill tool-tabs right */}
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Logo />

          <nav aria-label="Primary" className="flex items-center gap-3 sm:gap-4">
            <TabLink
              to="/terabox-video-player"
              active={location.pathname === "/terabox-video-player"}
              testId="nav-player"
              icon={Video}
              label={t("nav.video")}
            />
            <TabLink
              to="/terabox-video-downloader"
              active={location.pathname === "/terabox-video-downloader"}
              testId="nav-downloader"
              icon={Download}
              label={t("nav.downloader")}
            />
            <TabLink
              to="/help-center"
              active={location.pathname === "/help-center"}
              testId="nav-help"
              icon={LifeBuoy}
              label={t("nav.help")}
            />
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              data-testid="theme-toggle-btn"
              aria-label={isDark ? t("nav.themeLight") : t("nav.themeDark")}
              aria-pressed={isDark}
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  data-testid="language-switcher-btn"
                  aria-label={t("nav.language")}
                >
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" aria-label={t("nav.language")}>
                {langs.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    data-testid={`language-option-${l.code}`}
                  >
                    <span className="flex-1">{l.native}</span>
                    {lang === l.code && <Check className="h-4 w-4" aria-hidden="true" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              ref={menuBtnRef}
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full md:hidden"
              data-testid="mobile-menu-btn"
              aria-label={t("nav.openMenu")}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Background Overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Cinematic Drawer */}
            <motion.div
              ref={drawerRef}
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={t("nav.mobileTitle")}
              className="fixed top-0 right-0 z-50 h-screen w-[85vw] max-w-sm border-l border-border/60 bg-surface-raised/95 backdrop-blur-2xl md:hidden"
              style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
              initial={{ x: "100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.5 }}
              transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.8 }}
            >
              <div className="flex h-full flex-col">

                <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
                  <span onClick={() => setMobileMenuOpen(false)} className="inline-flex">
                    <Logo />
                  </span>

                  <Button
                    ref={closeBtnRef}
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-xl"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label={t("nav.closeMenu")}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <nav aria-label="Mobile" className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                  <DrawerLink to="/" onClick={() => setMobileMenuOpen(false)} icon={Home} testId="mobile-nav-home">
                    {t("nav.home")}
                  </DrawerLink>
                  <DrawerLink to="/terabox-video-player" onClick={() => setMobileMenuOpen(false)} icon={Video} testId="mobile-nav-player">
                    {t("nav.videoPlayer")}
                  </DrawerLink>
                  <DrawerLink to="/terabox-video-downloader" onClick={() => setMobileMenuOpen(false)} icon={Download} testId="mobile-nav-downloader">
                    {t("nav.downloader")}
                  </DrawerLink>
                  <DrawerLink to="/how-to-download-terabox-folder" onClick={() => setMobileMenuOpen(false)} icon={FolderOpen} testId="mobile-nav-folder">
                    {t("nav.folderDl")}
                  </DrawerLink>
                  <DrawerLink to="/terabox-zip-download" onClick={() => setMobileMenuOpen(false)} icon={Archive} testId="mobile-nav-zip">
                    {t("nav.zipDl")}
                  </DrawerLink>
                  <DrawerLink to="/help-center" onClick={() => setMobileMenuOpen(false)} icon={LifeBuoy} testId="mobile-nav-help">
                    {t("nav.helpCenter")}
                  </DrawerLink>
                  <DrawerLink to="/contact" onClick={() => setMobileMenuOpen(false)} icon={Mail} testId="mobile-nav-contact">
                    {t("nav.contact")}
                  </DrawerLink>
                  <DrawerLink to="/about" onClick={() => setMobileMenuOpen(false)} icon={Info} testId="mobile-nav-about">
                    {t("nav.about")}
                  </DrawerLink>
                  <button
                    type="button"
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    data-testid="mobile-theme-toggle-btn"
                    aria-pressed={isDark}
                    className="flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 transition-colors duration-fast hover:bg-surface-overlay hover:text-foreground active:bg-surface-overlay/80"
                  >
                    {isDark ? <Sun className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" /> : <Moon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />}
                    <span className="truncate">{isDark ? t("nav.themeLight") : t("nav.themeDark")}</span>
                  </button>
                  <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("nav.language")}
                  </p>
                  <div className="flex flex-wrap gap-2 px-4 pb-2" role="group" aria-label={t("nav.language")}>
                    {langs.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => setLang(l.code)}
                        data-testid={`mobile-language-option-${l.code}`}
                        aria-pressed={lang === l.code}
                        className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold transition-colors duration-fast ${lang === l.code
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        {l.native}
                      </button>
                    ))}
                  </div>
                </nav>
                <div className="border-t border-border/50 p-4">
                  <p className="text-center text-xs text-muted-foreground">
                    {t("nav.tagline")}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

const TabLink = ({ to, active, icon: Icon, label, testId }) => (
  <Link
    to={to}
    data-testid={testId}
    aria-current={active ? "page" : undefined}
    className={`group/nav flex items-center transition-all duration-300 ${active ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
      }`}
  >
    <span
      aria-hidden="true"
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${active
        ? "bg-indigo-50 text-indigo-600"
        : "bg-transparent text-slate-400 group-hover/nav:bg-slate-50 group-hover/nav:text-slate-500"
        }`}
    >
      <Icon className="h-5 w-5" />
    </span>
    <span className="ml-2 hidden text-sm font-bold tracking-tight sm:inline">{label}</span>
  </Link>
);

const DrawerLink = ({ to, onClick, icon: Icon, children, testId }) => (
  <Link
    to={to}
    onClick={onClick}
    data-testid={testId}
     className="flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 transition-colors duration-fast hover:bg-surface-overlay hover:text-foreground active:bg-surface-overlay/80"
  >
    <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    <span className="truncate">{children}</span>
  </Link>
);