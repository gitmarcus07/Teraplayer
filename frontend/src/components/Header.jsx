import logo from "./logo.png";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Info, Mail, Crown, Code2, Play, Download } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Lightweight focus trap: anything a keyboard/SR user can reach while the
// drawer is open. Kept dependency-free on purpose.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Header() {
  const location = useLocation();

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
        className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
        data-testid="app-header"
      >
        <div className="tp-container flex h-12 sm:h-14 items-center justify-between">
          <a href="/" data-testid="brand-link" aria-label="TeraPlayer Home" className="group flex items-center gap-2.5">
            <img
              src={logo}
              alt="TeraPlayer"
              className="h-10 w-auto sm:h-12"
            />
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" active={location.pathname === "/"} testId="nav-home">
              Home
            </NavLink>
            <NavLink to="/terabox-video-player" active={location.pathname === "/terabox-video-player"} testId="nav-player">
              Player
            </NavLink>
            <NavLink to="/terabox-video-downloader" active={location.pathname === "/terabox-video-downloader"} testId="nav-downloader">
              Downloader
            </NavLink>
            <NavLink to="/premium" active={location.pathname === "/premium"} testId="nav-premium">
              Premium
            </NavLink>
            <NavLink to="/meet-the-dev" active={location.pathname === "/meet-the-dev"} testId="nav-meet-the-dev">
              Meet the Dev
            </NavLink>
            <NavLink to="/contact" active={location.pathname === "/contact"} testId="nav-contact">
              Contact
            </NavLink>
            <NavLink to="/about" active={location.pathname === "/about"} testId="nav-about">
              About
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              ref={menuBtnRef}
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10 rounded-xl"
              data-testid="mobile-menu-btn"
              aria-label="Open menu"
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
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="fixed top-0 right-0 z-50 h-screen w-[85vw] max-w-sm bg-surface-raised/95 backdrop-blur-2xl border-l border-border/60 md:hidden"
              style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
              initial={{ x: "100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.5 }}
              transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.8 }}
            >
              <div className="flex flex-col h-full">

                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                  <a
                    href="/"
                    aria-label="TeraPlayer Home"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3"
                  >
                    <img
                      src={logo}
                      alt="TeraPlayer"
                      className="h-9 w-auto"
                    />
                  </a>

                  <Button
                    ref={closeBtnRef}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
                  <DrawerLink to="/" onClick={() => setMobileMenuOpen(false)} icon={Home} testId="mobile-nav-home">
                    Home
                  </DrawerLink>
                  <DrawerLink to="/terabox-video-player" onClick={() => setMobileMenuOpen(false)} icon={Play} testId="mobile-nav-player">
                    Player
                  </DrawerLink>
                  <DrawerLink to="/terabox-video-downloader" onClick={() => setMobileMenuOpen(false)} icon={Download} testId="mobile-nav-downloader">
                    Downloader
                  </DrawerLink>
                  <DrawerLink to="/premium" onClick={() => setMobileMenuOpen(false)} icon={Crown} testId="mobile-nav-premium">
                    Premium
                  </DrawerLink>
                  <DrawerLink to="/meet-the-dev" onClick={() => setMobileMenuOpen(false)} icon={Code2} testId="mobile-nav-meet-the-dev">
                    Meet the Dev
                  </DrawerLink>
                  <DrawerLink to="/contact" onClick={() => setMobileMenuOpen(false)} icon={Mail} testId="mobile-nav-contact">
                    Contact
                  </DrawerLink>
                  <DrawerLink to="/about" onClick={() => setMobileMenuOpen(false)} icon={Info} testId="mobile-nav-about">
                    About
                  </DrawerLink>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

const NavLink = ({ to, active, children, testId }) => (
  <Link
    to={to}
    data-testid={testId}
    className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${active
      ? "text-foreground after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:w-3/4 after:bg-primary after:rounded-full"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
  >
    {children}
  </Link>
);

const DrawerLink = ({ to, onClick, icon: Icon, children, testId }) => (
  <Link
    to={to}
    onClick={onClick}
    data-testid={testId}
     className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-foreground/80 transition-colors duration-200 hover:bg-surface-overlay hover:text-foreground hover:scale-105 active:scale-[0.98]"
  >
    <Icon className="h-5 w-5 text-muted-foreground" />
    {children}
  </Link>
);