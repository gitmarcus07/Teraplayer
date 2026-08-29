import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  LayoutDashboard,
  BarChart3,
  BarChart2,
  Cable,
  Shield,
  History,
  Server,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Crown,
  User,
  Search,
  AlertTriangle,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/admin/NotificationBell";

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/search-console", label: "Search Console", icon: Search },
  { to: "/admin/extraction", label: "Extraction", icon: Cable },
  { to: "/admin/extraction-analytics", label: "Extraction Analytics", icon: BarChart2 },
  { to: "/admin/errors", label: "Errors", icon: AlertTriangle },
  { to: "/admin/admins", label: "Admins", icon: Shield, superOnly: true },
  { to: "/admin/activity", label: "Activity", icon: History },
  { to: "/admin/system", label: "System", icon: Server },
  { to: "/admin/site", label: "Site", icon: Settings },
];

export default function AdminLayout() {
  const { admin, logout } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuper = admin?.role === "SUPER_ADMIN";
  const items = NAV.filter((item) => !item.superOnly || isSuper);

  async function handleLogout() {
    await logout();
    window.location.href = "/admin/login";
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/30">
          <Crown className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">TeraPlayer Admin</p>
          <p className="truncate text-xs text-muted-foreground">Control Center</p>
        </div>
      </div>

      <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl border border-border/60 bg-surface-raised px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
          <User className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{admin?.name || admin?.email}</p>
          <p className="truncate text-[10px] text-muted-foreground">{admin?.email}</p>
        </div>
        <Badge variant={isSuper ? "default" : "secondary"} className="text-[10px]">
          {admin?.role === "SUPER_ADMIN" ? "SUPER" : "ADMIN"}
        </Badge>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border/60 p-3 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => (window.location.href = "/")}
        >
          <ExternalLink className="mr-2 h-4 w-4" /> View site
        </Button>
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border/60 bg-surface-raised/60 backdrop-blur-xl md:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-border/60 bg-background">
            <button
              className="absolute right-3 top-3 rounded-lg p-2 hover:bg-secondary"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              teraplayer.in
            </Link>
            <Badge variant="outline" className="hidden sm:inline-flex">
              v2.0.0
            </Badge>
            <NotificationBell />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}