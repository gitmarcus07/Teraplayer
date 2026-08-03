import logo from "./logo.png";
import { Link, useLocation } from "react-router-dom";
import { Film, History, Star, Sun, Moon, Monitor, LogIn, LogOut, User as UserIcon, Menu, X, Home, Info, Mail, } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Header({ onOpenHistory, onOpenFavorites }) {
  const { mode, setTheme } = useTheme();
  const { user, isAuthed, login, logout } = useAuth();
  const location = useLocation();

  const ThemeIcon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b border-border/60 glass"
        data-testid="app-header"
      >
        <div className="tp-container flex h-16 items-center justify-between">
          <Link to="/" data-testid="brand-link" className="group flex items-center gap-2.5">
            <img
              src={logo}
              alt="TeraPlayer"
              className="h-10 md:h-14 w-auto"
            />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" active={location.pathname === "/"} testId="nav-home">
              Home
            </NavLink>
            <NavLink to="/about" active={location.pathname === "/about"} testId="nav-about">
              About
            </NavLink>
            <NavLink to="/contact" active={location.pathname === "/contact"} testId="nav-contact">
              Contact
            </NavLink>
            {onOpenHistory && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenHistory();
                }}
                className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-secondary text-left"
              >
                <History className="h-5 w-5" />
                <span>History</span>
              </button>
            )}

            {onOpenFavorites && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenFavorites();
                }}
                className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-secondary text-left"
              >
                <Star className="h-5 w-5" />
                <span>Favorites</span>
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-xl"
              data-testid="mobile-menu-btn"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="theme-toggle"
                  className="rounded-lg text-muted-foreground hover:text-foreground"
                  aria-label="Toggle theme"
                >
                  <ThemeIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" data-testid="theme-menu">
                <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="theme-light" onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="theme-dark" onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="theme-system" onClick={() => setTheme("system")}>
                  <Monitor className="mr-2 h-4 w-4" /> System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthed ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="ml-1 rounded-full ring-1 ring-border transition-transform duration-200 hover:-translate-y-0.5"
                    data-testid="user-menu-btn"
                    aria-label="Account menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.picture} alt={user?.name || user?.email} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" data-testid="user-menu">
                  <DropdownMenuLabel>
                    <div className="line-clamp-1 text-sm font-medium">{user?.name || "Signed in"}</div>
                    <div className="line-clamp-1 text-xs text-muted-foreground">{user?.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} data-testid="logout-btn">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={login}
                variant="outline"
                size="sm"
                className="ml-1 hidden sm:inline-flex"
                data-testid="login-btn"
              >
                <LogIn className="mr-1.5 h-4 w-4" /> Sign in
              </Button>
            )}
            {!isAuthed && (
              <Button
                onClick={login}
                variant="outline"
                size="icon"
                className="ml-1 sm:hidden"
                data-testid="mobile-login-btn"
                aria-label="Sign in"
              >
                <UserIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Background Overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              className="fixed top-0 right-0 z-50 h-screen w-80 max-w-[85vw] bg-background border-l border-border shadow-2xl md:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25 }}
            >
              <div className="relative border-b border-border/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-5">

                <div className="flex items-center justify-between">

                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <img
                      src={logo}
                      alt="TeraPlayer"
                      className="h-17 w-auto"
                    />
                  </Link>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>

                </div>

              </div>

              <div className="flex flex-col gap-2 p-4">
                <div className="border-b border-border/50 p-4">

                  {isAuthed ? (
                    <div className="flex items-center gap-3">

                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user?.picture} />
                        <AvatarFallback>
                          {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {user?.name}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={logout}
                      >
                        <LogOut className="h-5 w-5" />
                      </Button>

                    </div>
                  ) : (
                    <Button
                      onClick={login}
                      className="w-full h-11 rounded-xl"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign in with Google
                    </Button>
                  )}

                </div>

                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-4 py-3 hover:bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <Home className="h-5 w-5" />
                    <span>Home</span>
                  </div>
                </Link>

                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-4 py-3 hover:bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5" />
                    <span>About</span>
                  </div>
                </Link>

                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-4 py-3 hover:bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5" />
                    <span>Contact</span>
                  </div>
                </Link>
                {(onOpenHistory || onOpenFavorites) && (
                  <div className="my-3 border-t border-border" />
                )}

                {onOpenHistory && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenHistory();
                    }}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-secondary text-left"
                  >
                    <History className="h-5 w-5" />
                    <span>History</span>
                  </button>
                )}

                {onOpenFavorites && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenFavorites();
                    }}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-secondary text-left"
                  >
                    <Star className="h-5 w-5" />
                    <span>Favorites</span>
                  </button>
                )}
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
    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${active
      ? "bg-secondary text-foreground"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
  >
    {children}
  </Link>
);
