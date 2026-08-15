import logo from "./logo.png";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Info, Mail, Crown, Code2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Header() {
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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