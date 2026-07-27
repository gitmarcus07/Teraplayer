import { Link, useLocation } from "react-router-dom";
import { Film, History, Star, Sun, Moon, Monitor, LogIn, LogOut, User as UserIcon } from "lucide-react";
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

export default function Header({ onOpenHistory, onOpenFavorites }) {
  const { mode, setTheme } = useTheme();
  const { user, isAuthed, login, logout } = useAuth();
  const location = useLocation();

  const ThemeIcon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;

  return (
    <header
      className="sticky top-0 z-40 border-b border-border/60 glass"
      data-testid="app-header"
    >
      <div className="tp-container flex h-16 items-center justify-between">
        <Link to="/" data-testid="brand-link" className="group flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:-translate-y-0.5">
            <Film className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Tera<span className="text-primary">Player</span>
          </span>
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
          <button
            data-testid="nav-history"
            onClick={onOpenHistory}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
          >
            <History className="mr-1 inline h-4 w-4" /> History
          </button>
          <button
            data-testid="nav-favorites"
            onClick={onOpenFavorites}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
          >
            <Star className="mr-1 inline h-4 w-4" /> Favorites
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            data-testid="mobile-history-btn"
            onClick={onOpenHistory}
            className="rounded-lg p-2.5 text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground md:hidden"
            aria-label="History"
          >
            <History className="h-4 w-4" />
          </button>
          <button
            data-testid="mobile-favorites-btn"
            onClick={onOpenFavorites}
            className="rounded-lg p-2.5 text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground md:hidden"
            aria-label="Favorites"
          >
            <Star className="h-4 w-4" />
          </button>

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
  );
}

const NavLink = ({ to, active, children, testId }) => (
  <Link
    to={to}
    data-testid={testId}
    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
      active
        ? "bg-secondary text-foreground"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    }`}
  >
    {children}
  </Link>
);
