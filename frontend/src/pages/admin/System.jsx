import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Server,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Cpu,
  HardDrive,
  MemoryStick,
  Clock,
  Shield,
  Search,
  Zap,
  Wifi,
  Activity,
} from "lucide-react";
import { getSystem, getSystemHealth } from "@/services/adminApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function statusBadge(status) {
  if (status === "healthy") return <Badge variant="outline" className="gap-1.5 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Healthy</Badge>;
  if (status === "degraded") return <Badge variant="outline" className="gap-1.5 text-amber-600"><AlertTriangle className="h-3.5 w-3.5" /> Degraded</Badge>;
  if (status === "unhealthy") return <Badge variant="outline" className="gap-1.5 text-destructive"><XCircle className="h-3.5 w-3.5" /> Unhealthy</Badge>;
  return <Badge variant="outline" className="gap-1.5 text-muted-foreground"><Activity className="h-3.5 w-3.5" /> Unknown</Badge>;
}

function statusIcon(status) {
  if (status === "healthy") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (status === "degraded") return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  if (status === "unhealthy") return <XCircle className="h-5 w-5 text-destructive" />;
  return <Activity className="h-5 w-5 text-muted-foreground" />;
}

export default function System() {
  const [data, setData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [sys, health] = await Promise.all([
          getSystem(),
          getSystemHealth(),
        ]);
        setData(sys);
        setHealthData(health);
      } catch (err) {
        setError(err?.response?.data?.detail || "Failed to load system info");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const [sys, health] = await Promise.all([
        getSystem(),
        getSystemHealth(),
      ]);
      setData(sys);
      setHealthData(health);
      // toast.success("System info refreshed"); // avoid import
    } catch (err) {
      // toast.error("Failed to refresh"); // avoid import
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <>
        <Helmet>
          <title>System | TeraPlayer Admin</title>
        </Helmet>
        <Card>
          <CardContent className="p-8 text-center text-sm text-destructive">{error}</CardContent>
        </Card>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Helmet>
          <title>System | TeraPlayer Admin</title>
        </Helmet>
        <Skeleton className="h-64 rounded-xl" />
      </>
    );
  }

  const overallStatus = data.status || "unknown";
  const checks = data.health_checks || [];
  const sysInfo = data.system_info || {};
  const secretVars = data.secret_vars || {};

  return (
    <>
      <Helmet>
        <title>System | TeraPlayer Admin</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">System</h1>
            <p className="text-sm text-muted-foreground">Runtime health, configuration status, and system information.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <Card className={cn("border-l-4", overallStatus === "healthy" && "border-emerald-500", overallStatus === "degraded" && "border-amber-500", overallStatus === "unhealthy" && "border-destructive")}>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", overallStatus === "healthy" && "bg-emerald-100", overallStatus === "degraded" && "bg-amber-100", overallStatus === "unhealthy" && "bg-destructive/10")}>
                  {statusIcon(overallStatus)}
                </div>
                <div>
                  <p className="text-xl font-semibold capitalize">System Status: {overallStatus}</p>
                  <p className="text-sm text-muted-foreground">Last checked: {data.timestamp ? new Date(data.timestamp).toLocaleString() : "—"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {[
              { id: "overview", label: "Overview", icon: Activity },
              { id: "health", label: "Health Checks", icon: Shield },
              { id: "info", label: "System Info", icon: Server },
            ].map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1.5 text-sm py-3">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Version</p>
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <p className="mt-2 text-2xl font-bold font-mono">{data.version || "2.0.0"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Python</p>
                    <Cpu className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="mt-2 text-2xl font-bold font-mono">{sysInfo.python || "—"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Platform</p>
                    <HardDrive className="h-5 w-5 text-amber-500" />
                  </div>
                  <p className="mt-2 text-xl font-bold font-mono truncate max-w-[200px]">{sysInfo.platform || "—"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Uptime</p>
                    <Clock className="h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="mt-2 text-2xl font-bold font-mono">
                    {sysInfo.uptime_seconds ? `${Math.floor(sysInfo.uptime_seconds / 3600)}h ${Math.floor((sysInfo.uptime_seconds % 3600) / 60)}m` : "—"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Secret Variables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Integrations & Secrets
                </CardTitle>
                <CardDescription>Configured or not — values are never shown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(secretVars).map(([name, configured]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="font-mono text-xs">{name}</span>
                    {configured ? (
                      <Badge variant="outline" className="gap-1.5 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Configured</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600">Not configured</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Database Info */}
            {sysInfo.database && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" /> Database
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Collections</p>
                    <p className="text-2xl font-bold">{sysInfo.database.collections || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data Size</p>
                    <p className="text-2xl font-bold">{sysInfo.database.data_size_mb || "—"} MB</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Storage Size</p>
                    <p className="text-2xl font-bold">{sysInfo.database.storage_size_mb || "—"} MB</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Indexes</p>
                    <p className="text-2xl font-bold">{sysInfo.database.indexes || "—"}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Process Info */}
            {(sysInfo.memory_mb || sysInfo.cpu_percent) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MemoryStick className="h-5 w-5 text-primary" /> Process
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  {sysInfo.memory_mb && (
                    <div>
                      <p className="text-sm text-muted-foreground">Memory</p>
                      <p className="text-2xl font-bold">{sysInfo.memory_mb} MB</p>
                    </div>
                  )}
                  {sysInfo.cpu_percent !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">CPU</p>
                      <p className="text-2xl font-bold">{sysInfo.cpu_percent}%</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Health Checks Tab */}
          <TabsContent value="health" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Health Checks
                </CardTitle>
                <CardDescription>Real-time service health verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {checks.length > 0 ? (
                  checks.map((check) => (
                    <div key={check.name} className={cn("flex items-center justify-between gap-4 rounded-xl border p-4", check.status === "healthy" && "border-emerald-500/30 bg-emerald-500/5", check.status === "degraded" && "border-amber-500/30 bg-amber-500/5", check.status === "unhealthy" && "border-destructive/30 bg-destructive/5")}>
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", check.status === "healthy" && "bg-emerald-100 text-emerald-600", check.status === "degraded" && "bg-amber-100 text-amber-600", check.status === "unhealthy" && "bg-destructive/10 text-destructive")}>
                          {statusIcon(check.status)}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{check.name.replace("_", " ")}</p>
                          <p className="text-sm text-muted-foreground">{check.details || check.error || "No details"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant={check.status === "healthy" ? "default" : check.status === "degraded" ? "secondary" : "destructive"} className="capitalize">
                          {check.status}
                        </Badge>
                        {check.latency_ms && (
                          <span className="font-mono"><Wifi className="mr-1 h-3.5 w-3.5 inline" /> {check.latency_ms.toFixed(1)}ms</span>
                        )}
                        {check.timestamp && (
                          <span>Updated: {new Date(check.timestamp).toLocaleTimeString()}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-3 text-sm text-muted-foreground">No health checks available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Info Tab */}
          <TabsContent value="info" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" /> Runtime Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div><dt className="text-sm text-muted-foreground">API Version</dt><dd className="font-mono font-medium">{data.version || "2.0.0"}</dd></div>
                  <div><dt className="text-sm text-muted-foreground">Python Version</dt><dd className="font-mono font-medium">{sysInfo.python || "—"}</dd></div>
                  <div><dt className="text-sm text-muted-foreground">Platform</dt><dd className="font-mono font-medium truncate max-w-[300px]">{sysInfo.platform || "—"}</dd></div>
                  <div><dt className="text-sm text-muted-foreground">Environment</dt><dd className="font-mono font-medium">{sysInfo.environment || "production"}</dd></div>
                  <div><dt className="text-sm text-muted-foreground">Uptime</dt><dd className="font-mono font-medium">{sysInfo.uptime_seconds ? `${Math.floor(sysInfo.uptime_seconds / 3600)}h ${Math.floor((sysInfo.uptime_seconds % 3600) / 60)}m` : "—"}</dd></div>
                  <div><dt className="text-sm text-muted-foreground">Memory</dt><dd className="font-mono font-medium">{sysInfo.memory_mb ? `${sysInfo.memory_mb} MB` : "—"}</dd></div>
                  <div><dt className="text-sm text-muted-foreground">CPU Usage</dt><dd className="font-mono font-medium">{sysInfo.cpu_percent !== undefined ? `${sysInfo.cpu_percent}%` : "—"}</dd></div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" /> Database Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sysInfo.database ? (
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div><dt className="text-sm text-muted-foreground">Database Name</dt><dd className="font-mono font-medium">{sysInfo.database.name || "—"}</dd></div>
                    <div><dt className="text-sm text-muted-foreground">Collections</dt><dd className="font-mono font-medium">{sysInfo.database.collections || "—"}</dd></div>
                    <div><dt className="text-sm text-muted-foreground">Data Size</dt><dd className="font-mono font-medium">{sysInfo.database.data_size_mb || "—"} MB</dd></div>
                    <div><dt className="text-sm text-muted-foreground">Storage Size</dt><dd className="font-mono font-medium">{sysInfo.database.storage_size_mb || "—"} MB</dd></div>
                    <div><dt className="text-sm text-muted-foreground">Indexes</dt><dd className="font-mono font-medium">{sysInfo.database.indexes || "—"}</dd></div>
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">Database statistics not available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" /> Environment Variables
                </CardTitle>
                <CardDescription>Only boolean presence is shown — values are never exposed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(secretVars).map(([name, configured]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="font-mono text-xs">{name}</span>
                    {configured ? (
                      <Badge variant="outline" className="gap-1.5 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Configured</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600">Not configured</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}