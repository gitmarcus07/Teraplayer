import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Activity,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
  Search,
  Server,
  Shield,
  AlertTriangle,
  Zap,
  ExternalLink,
  Settings,
  Bell,
  ArrowUpRight,
  Database,
  Globe,
  Clock,
  BarChart2,
  Info,
} from "lucide-react";
import { getDashboard } from "@/services/adminApi";
import { getSearchConsoleStatus } from "@/services/adminApi";
import { getSystemHealth } from "@/services/adminApi";
import { getUnreadNotificationCount } from "@/services/adminApi";
import { getSiteSettings } from "@/services/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

function StatCard({ icon: Icon, label, value, sub, tone = "default", trend }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon
            className={
              tone === "success"
                ? "h-5 w-5 text-emerald-500"
                : tone === "danger"
                ? "h-5 w-5 text-destructive"
                : tone === "warning"
                ? "h-5 w-5 text-amber-500"
                : "h-5 w-5 text-primary"
            }
          />
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: trend >= 0 ? "rgb(16 185 129)" : "rgb(239 68 68)" }}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{trend >= 0 ? "+" : ""}{trend.toFixed(1)}%</span>
            <span className="text-muted-foreground">vs prev</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon: Icon, label, description, onClick, variant = "outline", danger = false }) {
  return (
    <Button
      variant={danger ? "destructive" : variant}
      className="w-full justify-start gap-3 p-4 h-auto text-left"
      onClick={onClick}
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", danger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [searchConsoleStatus, setSearchConsoleStatus] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [dash, scStatus, sysHealth, notifCount, site] = await Promise.allSettled([
          getDashboard(),
          getSearchConsoleStatus(),
          getSystemHealth(),
          getUnreadNotificationCount(),
          getSiteSettings(),
        ]);
        setData(dash.status === "fulfilled" ? dash.value : null);
        setSearchConsoleStatus(scStatus.status === "fulfilled" ? scStatus.value : null);
        setSystemHealth(sysHealth.status === "fulfilled" ? sysHealth.value : null);
        setUnreadNotifications(notifCount.status === "fulfilled" ? notifCount.value.unread_count : 0);
        setSiteSettings(site.status === "fulfilled" ? site.value : null);
      } catch (err) {
        setError(err?.response?.data?.detail || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  if (error) {
    return (
      <>
        <Helmet>
          <title>Dashboard | TeraPlayer Admin</title>
        </Helmet>
        <Card>
          <CardContent className="p-8 text-center text-sm text-destructive">{error}</CardContent>
        </Card>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Dashboard | TeraPlayer Admin</title>
        </Helmet>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Helmet>
          <title>Dashboard | TeraPlayer Admin</title>
        </Helmet>
        <Card>
          <CardContent className="p-8 text-center text-sm text-destructive">Failed to load dashboard data</CardContent>
        </Card>
      </>
    );
  }

  const m = data.metrics || {};
  const isMaintenance = siteSettings?.operating_mode === "maintenance";
  const isEmergency = siteSettings?.operating_mode === "emergency";
  const overallHealth = systemHealth?.status || "unknown";

  return (
    <>
      <Helmet>
        <title>Dashboard | TeraPlayer Admin</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Executive overview of TeraPlayer performance and health</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("px-2 py-1 rounded-full text-xs font-medium",
              isEmergency && "bg-destructive/10 text-destructive",
              isMaintenance && "bg-amber-100 text-amber-700",
              !isMaintenance && !isEmergency && "bg-emerald-100 text-emerald-700"
            )}>
              {isEmergency ? "EMERGENCY" : isMaintenance ? "MAINTENANCE" : "NORMAL"}
            </span>
            {unreadNotifications > 0 && (
              <Button variant="ghost" size="icon" className="text-destructive">
                <Bell className="h-5 w-5" />
                <span className="sr-only">{unreadNotifications} unread notifications</span>
              </Button>
            )}
          </div>
        </div>

        {/* System Status Alert */}
        {(isMaintenance || isEmergency || overallHealth !== "healthy") && (
          <Alert variant={isEmergency || overallHealth === "unhealthy" ? "destructive" : isMaintenance || overallHealth === "degraded" ? "default" : "default"} className="border-primary/30 bg-primary/5">
            <div className="flex items-start gap-3">
              {isEmergency ? (
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              ) : isMaintenance ? (
                <Settings className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              ) : overallHealth === "unhealthy" ? (
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              ) : overallHealth === "degraded" ? (
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertTitle className="flex items-center gap-2">
                  {isEmergency ? "Emergency Mode Active" : isMaintenance ? "Maintenance Mode Active" : overallHealth === "unhealthy" ? "System Unhealthy" : overallHealth === "degraded" ? "System Degraded" : "Notice"}
                  <Badge variant={isEmergency ? "destructive" : isMaintenance || overallHealth === "degraded" ? "secondary" : "destructive"} className="text-[10px]">
                    {isEmergency ? "EMERGENCY" : isMaintenance ? "MAINTENANCE" : overallHealth.toUpperCase()}
                  </Badge>
                </AlertTitle>
                <AlertDescription className="mt-1">
                  {isEmergency && "Public access disabled. Admin access preserved."}
                  {isMaintenance && "Public API requests returning 503. Admin access normal."}
                  {overallHealth === "unhealthy" && "One or more critical services are down."}
                  {overallHealth === "degraded" && "Some services are experiencing degraded performance."}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Key Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={Activity}
            label="Total Requests"
            value={m.available ? m.total?.toLocaleString() : "—"}
            sub="All time"
          />
          <StatCard
            icon={CheckCircle2}
            label="Success Rate"
            value={m.available ? `${m.success_rate}%` : "—"}
            sub={`${m.success?.toLocaleString?.() ?? m.success} successes`}
            tone="success"
          />
          <StatCard
            icon={XCircle}
            label="Failures"
            value={m.available ? m.failure?.toLocaleString() : "—"}
            sub="All time"
            tone="danger"
          />
          <StatCard
            icon={TrendingUp}
            label="Today"
            value={m.available ? m.today_total?.toLocaleString() : "—"}
            sub={`${m.today_success ?? 0} successful`}
          />
          <StatCard
            icon={Zap}
            label="Avg Response"
            value="—"
            sub="Response time tracking coming soon"
            tone="warning"
          />
        </div>

        {/* Search Console Summary */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" /> Search Console
              </CardTitle>
              <CardDescription>Google Search performance for teraplayer.in</CardDescription>
            </CardHeader>
            <CardContent>
              {searchConsoleStatus?.connected ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-4 mb-4">
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <p className="text-sm text-emerald-700 font-medium">Clicks</p>
                      <p className="text-2xl font-bold text-emerald-900">—</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm text-blue-700 font-medium">Impressions</p>
                      <p className="text-2xl font-bold text-blue-900">—</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-sm text-amber-700 font-medium">CTR</p>
                      <p className="text-2xl font-bold text-amber-900">—</p>
                    </div>
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive font-medium">Position</p>
                      <p className="text-2xl font-bold text-destructive">—</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Connect Search Console to view detailed metrics</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.href = "/admin/search-console"}>
                    <ArrowUpRight className="mr-2 h-4 w-4" /> View Search Console
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">Search Console not connected</p>
                  <Button variant="outline" className="mt-2" onClick={() => window.location.href = "/admin/search-console"}>
                    <Settings className="mr-2 h-4 w-4" /> Configure
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" /> System Health
              </CardTitle>
              <CardDescription>Real-time service status and uptime</CardDescription>
            </CardHeader>
            <CardContent>
              {systemHealth?.checks ? (
                <>
                  <div className="space-y-3 mb-4">
                    {systemHealth.checks.map((check) => (
                      <div key={check.name} className={cn("flex items-center justify-between gap-4 rounded-lg border p-3", check.status === "healthy" && "border-emerald-500/30 bg-emerald-500/5", check.status === "degraded" && "border-amber-500/30 bg-amber-500/5", check.status === "unhealthy" && "border-destructive/30 bg-destructive/5")}>
                        <div className="flex items-center gap-3">
                          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", check.status === "healthy" && "bg-emerald-100 text-emerald-600", check.status === "degraded" && "bg-amber-100 text-amber-600", check.status === "unhealthy" && "bg-destructive/10 text-destructive")}>
                            {check.status === "healthy" && <CheckCircle2 className="h-4 w-4" />}
                            {check.status === "degraded" && <AlertTriangle className="h-4 w-4" />}
                            {check.status === "unhealthy" && <XCircle className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{check.name.replace("_", " ")}</p>
                            <p className="text-sm text-muted-foreground">{check.details || check.error || "No details"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Badge variant={check.status === "healthy" ? "default" : check.status === "degraded" ? "secondary" : "destructive"} className="capitalize">
                            {check.status}
                          </Badge>
                          {check.latency_ms && (
                            <span className="font-mono"><Zap className="mr-1 h-3.5 w-3.5 inline" /> {check.latency_ms.toFixed(1)}ms</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Uptime</p>
                      <p className="text-xl font-bold font-mono">{systemHealth.system_info?.uptime_seconds ? `${Math.floor(systemHealth.system_info.uptime_seconds / 3600)}h ${Math.floor((systemHealth.system_info.uptime_seconds % 3600) / 60)}m` : "—"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Memory</p>
                      <p className="text-xl font-bold font-mono">{systemHealth.system_info?.memory_mb ? `${systemHealth.system_info.memory_mb} MB` : "—"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">CPU</p>
                      <p className="text-xl font-bold font-mono">{systemHealth.system_info?.cpu_percent !== undefined ? `${systemHealth.system_info.cpu_percent}%` : "—"}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Health checks unavailable</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Quick Actions
            </CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction
                icon={Settings}
                label="Maintenance Mode"
                description="Enable/disable maintenance mode"
                onClick={() => window.location.href = "/admin/site"}
              />
              <QuickAction
                icon={Bell}
                label="Create Announcement"
                description="Add maintenance announcement"
                onClick={() => window.location.href = "/admin/site?tab=announcement"}
              />
              <QuickAction
                icon={Search}
                label="Search Console"
                description="View Google Search performance"
                onClick={() => window.location.href = "/admin/search-console"}
              />
              <QuickAction
                icon={BarChart2}
                label="Extraction Analytics"
                description="View detailed extraction metrics"
                onClick={() => window.location.href = "/admin/extraction-analytics"}
              />
              <QuickAction
                icon={Shield}
                label="System Health"
                description="View detailed system status"
                onClick={() => window.location.href = "/admin/system"}
              />
              <QuickAction
                icon={AlertTriangle}
                label="Error Intelligence"
                description="View and analyze errors"
                onClick={() => window.location.href = "/admin/errors"}
              />
              <QuickAction
                icon={Activity}
                label="Activity Log"
                description="View admin audit trail"
                onClick={() => window.location.href = "/admin/activity"}
              />
              <QuickAction
                icon={Database}
                label="Manage Admins"
                description="Manage admin accounts"
                onClick={() => window.location.href = "/admin/admins"}
                danger
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest admin control-center actions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = "/admin/activity"}>
              <ArrowUpRight className="mr-2 h-4 w-4" /> View All
            </Button>
          </CardHeader>
          <CardContent>
            {data.recent_activity?.length ? (
              <ul className="space-y-3">
                {data.recent_activity.slice(0, 5).map((entry, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {entry.action}
                        {entry.target ? <span className="text-muted-foreground"> · {entry.target}</span> : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{entry.admin_email}</p>
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No admin activity yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Extractors Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Extractors
            </CardTitle>
            <CardDescription>Enabled state and configuration status (values never exposed)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.extractors?.map((ex) => (
                <Badge
                  key={ex.name}
                  variant={ex.configured ? "default" : "secondary"}
                  className="gap-1.5 font-mono text-xs"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${ex.configured ? "bg-emerald-400" : "bg-amber-400"}`} />
                  {ex.name}
                  {ex.configured ? "" : " · not configured"}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}