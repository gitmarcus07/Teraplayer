import { useEffect, useState, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  Search,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Link2,
  BarChart2,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Layers,
  ExternalLink,
  Settings,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSearchConsoleStatus,
  connectSearchConsole,
  disconnectSearchConsole,
  getSearchConsoleOverview,
  getSearchConsoleChart,
  getSearchConsoleQueries,
  getSearchConsolePages,
  getSearchConsoleCountries,
  getSearchConsoleDevices,
  getSearchConsoleSearchAppearance,
} from "@/services/adminApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";

const DATE_RANGES = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "28d", label: "Last 28 days" },
  { value: "3m", label: "Last 3 months" },
];

const CHART_COLORS = {
  clicks: "#10b981",
  impressions: "#3b82f6",
  ctr: "#f59e0b",
  position: "#ef4444",
};

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function SearchConsole() {
  const [status, setStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("7d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [compareEnabled, setCompareEnabled] = useState(true);

  // Data states
  const [overview, setOverview] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [queries, setQueries] = useState([]);
  const [pages, setPages] = useState([]);
  const [countries, setCountries] = useState([]);
  const [devices, setDevices] = useState([]);
  const [appearances, setAppearances] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [queriesLoading, setQueriesLoading] = useState(false);
  const [pagesLoading, setPagesLoading] = useState(false);

  // Connect dialog
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectForm, setConnectForm] = useState({ property_url: "", service_account_email: "" });
  const [connecting, setConnecting] = useState(false);

  // Disconnect confirmation
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);

  // Load status
  const loadStatus = useCallback(async () => {
    try {
      const s = await getSearchConsoleStatus();
      setStatus(s);
    } catch (err) {
      console.error("Failed to load Search Console status", err);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Load data when tab or date range changes
  const loadTabData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "overview":
          setOverviewLoading(true);
          const ov = await getSearchConsoleOverview(dateRange, customStart || null, customEnd || null);
          setOverview(ov);
          setOverviewLoading(false);
          break;
        case "chart":
          setChartLoading(true);
          const cd = await getSearchConsoleChart(dateRange, customStart || null, customEnd || null);
          setChartData(cd.data || []);
          setChartLoading(false);
          break;
        case "queries":
          setQueriesLoading(true);
          const q = await getSearchConsoleQueries(dateRange, customStart || null, customEnd || null);
          setQueries(q.queries || []);
          setQueriesLoading(false);
          break;
        case "pages":
          setPagesLoading(true);
          const p = await getSearchConsolePages(dateRange, customStart || null, customEnd || null);
          setPages(p.pages || []);
          setPagesLoading(false);
          break;
        case "countries":
          const c = await getSearchConsoleCountries(dateRange, customStart || null, customEnd || null);
          setCountries(c.countries || []);
          break;
        case "devices":
          const d = await getSearchConsoleDevices(dateRange, customStart || null, customEnd || null);
          setDevices(d.devices || []);
          break;
        case "appearances":
          const a = await getSearchConsoleSearchAppearance(dateRange, customStart || null, customEnd || null);
          setAppearances(a.appearances || []);
          break;
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange, customStart, customEnd]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  // Handle connect
  async function handleConnect(e) {
    e.preventDefault();
    if (connecting) return;
    setConnecting(true);
    try {
      await connectSearchConsole(connectForm.property_url, connectForm.service_account_email);
      toast.success("Search Console connected successfully");
      setConnectOpen(false);
      setConnectForm({ property_url: "", service_account_email: "" });
      loadStatus();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to connect");
    } finally {
      setConnecting(false);
    }
  }

  // Handle disconnect
  async function handleDisconnect() {
    try {
      await disconnectSearchConsole();
      toast.success("Search Console disconnected");
      setDisconnectConfirm(false);
      loadStatus();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to disconnect");
    }
  }

  // Refresh data
  async function handleRefresh() {
    loadTabData();
    toast.success("Data refreshed");
  }

  // Format numbers
  const formatNumber = (num) => {
    if (num === null || num === undefined) return "—";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const formatPercent = (val) => {
    if (val === null || val === undefined) return "—";
    return val.toFixed(2) + "%";
  };

  const formatPosition = (val) => {
    if (val === null || val === undefined) return "—";
    return val.toFixed(1);
  };

  const getChangeColor = (change) => {
    if (change === null || change === undefined) return "text-muted-foreground";
    return change >= 0 ? "text-emerald-600" : "text-destructive";
  };

  const getChangeIcon = (change) => {
    if (change === null || change === undefined) return null;
    return change >= 0 ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />;
  };

  if (!status) {
    return (
      <>
        <Helmet>
          <title>Search Console | TeraPlayer Admin</title>
        </Helmet>
        <Skeleton className="h-96 rounded-xl" />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Search Console | TeraPlayer Admin</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Search Console</h1>
            <p className="text-sm text-muted-foreground">Google Search Console performance for teraplayer.in</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            {status.connected ? (
              <Button variant="outline" size="sm" onClick={() => setDisconnectConfirm(true)}>
                <XCircle className="mr-2 h-4 w-4" /> Disconnect
              </Button>
            ) : (
              <Button onClick={() => setConnectOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Connect
              </Button>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <Card className={cn("border-l-4", status.connected ? "border-emerald-500" : "border-amber-500")}>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", status.connected ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600")}>
                  {status.connected ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium">
                    {status.connected ? "Connected" : "Not Connected"}
                  </p>
                  {status.property_url && (
                    <p className="text-sm text-muted-foreground font-mono">{status.property_url}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {status.last_sync_at && (
                  <>
                    <span>Last sync: </span>
                    <span className="font-medium">{new Date(status.last_sync_at).toLocaleString()}</span>
                  </>
                )}
                {status.last_error && (
                  <Alert className="w-auto h-auto p-2 bg-destructive/10 border-destructive/20 text-destructive" variant="destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <AlertDescription className="text-xs">{status.last_error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {!status.connected && (
          <Card>
            <CardContent className="p-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Search Console Not Connected</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>To view Search Console data, you need to connect using a Google Service Account.</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Create a service account in <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a></li>
                    <li>Enable the <strong>Google Search Console API</strong></li>
                    <li>Grant the service account <strong>Owner</strong> access in Search Console for your property</li>
                    <li>Download the JSON key and add it to <code>GOOGLE_SEARCH_CONSOLE_CREDENTIALS</code> environment variable</li>
                    <li>Click "Connect" and enter your property URL and service account email</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {status.connected && (
          <>
            {/* Date Range Selector */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Date Range</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_RANGES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                        <SelectItem value="custom" className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={showCustomRange}
                            onChange={(e) => setShowCustomRange(e.target.checked)}
                            className="rounded border-border"
                          />
                          Custom Range
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {showCustomRange && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="custom-start" className="text-sm">From</Label>
                      <Input
                        id="custom-start"
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-[160px]"
                      />
                      <Label htmlFor="custom-end" className="text-sm">To</Label>
                      <Input
                        id="custom-end"
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-[160px]"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Label htmlFor="compare" className="text-sm">
                      <input
                        id="compare"
                        type="checkbox"
                        checked={compareEnabled}
                        onChange={(e) => setCompareEnabled(e.target.checked)}
                        className="mr-2 rounded border-border"
                      />
                      Compare with previous period
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                {[
                  { id: "overview", label: "Overview", icon: BarChart2 },
                  { id: "chart", label: "Charts", icon: BarChart2 },
                  { id: "queries", label: "Queries", icon: Search },
                  { id: "pages", label: "Pages", icon: Link2 },
                  { id: "countries", label: "Countries", icon: Globe },
                  { id: "devices", label: "Devices", icon: Monitor },
                  { id: "appearances", label: "Appearance", icon: Layers },
                ].map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1.5 text-sm py-3">
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 pt-4">
                {overviewLoading ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                  </div>
                ) : overview ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { label: "Total Clicks", value: overview.current?.total_clicks, change: overview.current?.clicks_change, icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" /> },
                        { label: "Total Impressions", value: overview.current?.total_impressions, change: overview.current?.impressions_change, icon: <BarChart2 className="h-5 w-5 text-blue-500" /> },
                        { label: "Average CTR", value: overview.current?.avg_ctr !== undefined ? formatPercent(overview.current.avg_ctr) : "—", change: overview.current?.ctr_change, icon: <Search className="h-5 w-5 text-amber-500" /> },
                        { label: "Average Position", value: overview.current?.avg_position !== undefined ? formatPosition(overview.current.avg_position) : "—", change: overview.current?.position_change, icon: <Layers className="h-5 w-5 text-destructive" /> },
                      ].map((metric, i) => (
                        <Card key={i}>
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">{metric.label}</p>
                              <div className={cn("text-2xl font-bold", metric.change !== null && metric.change !== undefined && metric.change < 0 ? "text-destructive" : "")}>
                                {metric.value}
                              </div>
                            </div>
                            {metric.change !== null && metric.change !== undefined && (
                              <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: getChangeColor(metric.change) }}>
                                {getChangeIcon(metric.change)}
                                <span>{metric.change >= 0 ? "+" : ""}{metric.change.toFixed(1)}%</span>
                                <span className="text-muted-foreground">vs previous period</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Current period: <span className="font-medium text-foreground">{overview.current?.date_range}</span>
                        {overview.comparison && (
                          <>
                            <span className="mx-2">·</span>
                            Comparison: <span className="font-medium text-foreground">{overview.comparison.date_range}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No Data Available</AlertTitle>
                    <AlertDescription>No Search Console data for the selected period.</AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              {/* Chart Tab */}
              <TabsContent value="chart" className="space-y-6 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Over Time</CardTitle>
                    <CardDescription>Daily trends for the selected date range</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {chartLoading ? (
                      <Skeleton className="h-80 rounded-xl" />
                    ) : chartData.length > 0 ? (
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                            <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" domain={["auto", "auto"]} />
                            <Tooltip formatter={(value, name) => {
                              if (name === "ctr") return [value.toFixed(2) + "%", name];
                              if (name === "position") return [value.toFixed(1), name];
                              return [value.toLocaleString(), name];
                            }} />
                            <Legend />
                            {chartData.some(d => d.clicks !== undefined) && (
                              <Line yAxisId="left" type="monotone" dataKey="clicks" name="Clicks" stroke={CHART_COLORS.clicks} strokeWidth={2} dot={false} />
                            )}
                            {chartData.some(d => d.impressions !== undefined) && (
                              <Line yAxisId="left" type="monotone" dataKey="impressions" name="Impressions" stroke={CHART_COLORS.impressions} strokeWidth={2} dot={false} />
                            )}
                            {chartData.some(d => d.ctr !== undefined) && (
                              <Line yAxisId="right" type="monotone" dataKey="ctr" name="CTR (%)" stroke={CHART_COLORS.ctr} strokeWidth={2} dot={false} />
                            )}
                            {chartData.some(d => d.position !== undefined) && (
                              <Line yAxisId="right" type="monotone" dataKey="position" name="Position" stroke={CHART_COLORS.position} strokeWidth={2} dot={false} />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Chart Data</AlertTitle>
                        <AlertDescription>No data available for the selected period.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>CTR vs Position</CardTitle>
                    <CardDescription>Relationship between click-through rate and average position</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {chartLoading ? (
                      <Skeleton className="h-64 rounded-xl" />
                    ) : chartData.length > 0 ? (
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                            <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                            <Tooltip formatter={(value, name) => {
                              if (name === "ctr") return [value.toFixed(2) + "%", name];
                              return [value.toFixed(1), name];
                            }} />
                            <Legend />
                            {chartData.some(d => d.ctr !== undefined) && (
                              <Line yAxisId="left" type="monotone" dataKey="ctr" name="CTR (%)" stroke={CHART_COLORS.ctr} strokeWidth={2} dot={false} />
                            )}
                            {chartData.some(d => d.position !== undefined) && (
                              <Line yAxisId="right" type="monotone" dataKey="position" name="Position" stroke={CHART_COLORS.position} strokeWidth={2} dot={false} />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Data</AlertTitle>
                        <AlertDescription>No chart data available for the selected period.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Queries Tab */}
              <TabsContent value="queries" className="space-y-6 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-primary" /> Top Search Queries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {queriesLoading ? (
                      <Skeleton className="h-80 rounded-xl" />
                    ) : queries.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                              <th className="pb-2 pr-4 font-medium">Query</th>
                              <th className="pb-2 pr-4 font-medium">Clicks</th>
                              <th className="pb-2 pr-4 font-medium">Impressions</th>
                              <th className="pb-2 pr-4 font-medium">CTR</th>
                              <th className="pb-2 pr-4 font-medium">Position</th>
                              {compareEnabled && overview?.comparison && (
                                <>
                                  <th className="pb-2 pr-4 font-medium">Clicks Δ</th>
                                  <th className="pb-2 pr-4 font-medium">Impr. Δ</th>
                                  <th className="pb-2 pr-4 font-medium">CTR Δ</th>
                                  <th className="pb-2 pr-4 font-medium">Pos. Δ</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {queries.slice(0, 100).map((q, i) => (
                              <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/50">
                                <td className="py-2.5 pr-4 max-w-xs truncate font-mono text-xs">{q.query}</td>
                                <td className="py-2.5 pr-4 font-medium">{formatNumber(q.clicks)}</td>
                                <td className="py-2.5 pr-4 text-muted-foreground">{formatNumber(q.impressions)}</td>
                                <td className="py-2.5 pr-4">{formatPercent(q.ctr)}</td>
                                <td className="py-2.5 pr-4 font-mono">{formatPosition(q.position)}</td>
                                {compareEnabled && overview?.comparison && q.clicks_prev !== undefined && (
                                  <>
                                    <td className="py-2.5 pr-4 font-mono text-emerald-600">
                                      {q.clicks_prev !== null ? (q.clicks - q.clicks_prev >= 0 ? "+" : "") + (q.clicks - q.clicks_prev).toLocaleString() : "—"}
                                    </td>
                                    <td className="py-2.5 pr-4 font-mono text-blue-600">
                                      {q.impressions_prev !== null ? (q.impressions - q.impressions_prev >= 0 ? "+" : "") + (q.impressions - q.impressions_prev).toLocaleString() : "—"}
                                    </td>
                                    <td className="py-2.5 pr-4 font-mono text-amber-600">
                                      {q.ctr_prev !== null ? ((q.ctr - q.ctr_prev) >= 0 ? "+" : "") + (q.ctr - q.ctr_prev).toFixed(2) + "%" : "—"}
                                    </td>
                                    <td className="py-2.5 pr-4 font-mono text-destructive">
                                      {q.position_prev !== null ? ((q.position - q.position_prev) >= 0 ? "+" : "") + (q.position - q.position_prev).toFixed(1) : "—"}
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Queries</AlertTitle>
                        <AlertDescription>No search query data for the selected period.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pages Tab */}
              <TabsContent value="pages" className="space-y-6 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link2 className="h-5 w-5 text-primary" /> Top Pages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pagesLoading ? (
                      <Skeleton className="h-80 rounded-xl" />
                    ) : pages.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                              <th className="pb-2 pr-4 font-medium">Page</th>
                              <th className="pb-2 pr-4 font-medium">Clicks</th>
                              <th className="pb-2 pr-4 font-medium">Impressions</th>
                              <th className="pb-2 pr-4 font-medium">CTR</th>
                              <th className="pb-2 pr-4 font-medium">Position</th>
                              {compareEnabled && overview?.comparison && (
                                <>
                                  <th className="pb-2 pr-4 font-medium">Clicks Δ</th>
                                  <th className="pb-2 pr-4 font-medium">Impr. Δ</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {pages.slice(0, 100).map((p, i) => (
                              <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/50">
                                <td className="py-2.5 pr-4 max-w-xs truncate">
                                  <a href={p.page} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-primary underline hover:text-primary/80 flex items-center gap-1">
                                    {p.page}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </td>
                                <td className="py-2.5 pr-4 font-medium">{formatNumber(p.clicks)}</td>
                                <td className="py-2.5 pr-4 text-muted-foreground">{formatNumber(p.impressions)}</td>
                                <td className="py-2.5 pr-4">{formatPercent(p.ctr)}</td>
                                <td className="py-2.5 pr-4 font-mono">{formatPosition(p.position)}</td>
                                {compareEnabled && overview?.comparison && p.clicks_prev !== undefined && (
                                  <>
                                    <td className="py-2.5 pr-4 font-mono text-emerald-600">
                                      {p.clicks_prev !== null ? (p.clicks - p.clicks_prev >= 0 ? "+" : "") + (p.clicks - p.clicks_prev).toLocaleString() : "—"}
                                    </td>
                                    <td className="py-2.5 pr-4 font-mono text-blue-600">
                                      {p.impressions_prev !== null ? (p.impressions - p.impressions_prev >= 0 ? "+" : "") + (p.impressions - p.impressions_prev).toLocaleString() : "—"}
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Pages</AlertTitle>
                        <AlertDescription>No page data for the selected period.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Countries Tab */}
              <TabsContent value="countries" className="space-y-6 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" /> Countries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {countries.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                              <th className="pb-2 pr-4 font-medium">Country</th>
                              <th className="pb-2 pr-4 font-medium">Clicks</th>
                              <th className="pb-2 pr-4 font-medium">Impressions</th>
                              <th className="pb-2 pr-4 font-medium">CTR</th>
                              <th className="pb-2 pr-4 font-medium">Position</th>
                            </tr>
                          </thead>
                          <tbody>
                            {countries.map((c, i) => (
                              <tr key={i} className="border-b border-border/40 last:border-0">
                                <td className="py-2.5 pr-4 font-medium">{c.country}</td>
                                <td className="py-2.5 pr-4">{formatNumber(c.clicks)}</td>
                                <td className="py-2.5 pr-4 text-muted-foreground">{formatNumber(c.impressions)}</td>
                                <td className="py-2.5 pr-4">{formatPercent(c.ctr)}</td>
                                <td className="py-2.5 pr-4 font-mono">{formatPosition(c.position)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Country Data</AlertTitle>
                        <AlertDescription>No country breakdown available for the selected period.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Devices Tab */}
              <TabsContent value="devices" className="space-y-6 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-primary" /> Devices
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {devices.length > 0 ? (
                      <>
                        <div className="grid gap-4 sm:grid-cols-3">
                          {devices.map((d, i) => (
                            <Card key={i} className="text-center">
                              <CardContent className="p-6">
                                <div className="text-3xl mb-2">
                                  {d.device === "Mobile" && <Smartphone className="h-8 w-8 mx-auto text-blue-500" />}
                                  {d.device === "Desktop" && <Monitor className="h-8 w-8 mx-auto text-emerald-500" />}
                                  {d.device === "Tablet" && <Tablet className="h-8 w-8 mx-auto text-amber-500" />}
                                </div>
                                <p className="font-medium">{d.device}</p>
                                <div className="mt-4 space-y-2 text-sm">
                                  <div className="flex justify-between"><span className="text-muted-foreground">Clicks</span><span className="font-medium">{formatNumber(d.clicks)}</span></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">Impressions</span><span className="font-medium">{formatNumber(d.impressions)}</span></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">CTR</span><span className="font-medium">{formatPercent(d.ctr)}</span></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">Position</span><span className="font-mono font-medium">{formatPosition(d.position)}</span></div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        <div className="mt-6">
                          <CardTitle className="text-sm">Device Distribution (Clicks)</CardTitle>
                          <div className="h-64 w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={devices}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={100}
                                  fill="#8884d8"
                                  paddingAngle={2}
                                  dataKey="clicks"
                                  nameKey="device"
                                  label={({ device, clicks, percent }) => `${device}: ${formatNumber(clicks)} (${(percent * 100).toFixed(1)}%)`}
                                >
                                  {devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value) => [formatNumber(value), "Clicks"]} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Device Data</AlertTitle>
                        <AlertDescription>No device breakdown available for the selected period.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Search Appearance Tab */}
              <TabsContent value="appearances" className="space-y-6 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-primary" /> Search Appearance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {appearances.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                              <th className="pb-2 pr-4 font-medium">Search Appearance</th>
                              <th className="pb-2 pr-4 font-medium">Clicks</th>
                              <th className="pb-2 pr-4 font-medium">Impressions</th>
                              <th className="pb-2 pr-4 font-medium">CTR</th>
                              <th className="pb-2 pr-4 font-medium">Position</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appearances.map((a, i) => (
                              <tr key={i} className="border-b border-border/40 last:border-0">
                                <td className="py-2.5 pr-4 font-medium">{a.search_appearance}</td>
                                <td className="py-2.5 pr-4">{formatNumber(a.clicks)}</td>
                                <td className="py-2.5 pr-4 text-muted-foreground">{formatNumber(a.impressions)}</td>
                                <td className="py-2.5 pr-4">{formatPercent(a.ctr)}</td>
                                <td className="py-2.5 pr-4 font-mono">{formatPosition(a.position)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Search Appearance Data</AlertTitle>
                        <AlertDescription>No search appearance breakdown available for the selected period.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Connect Dialog */}
        <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Connect Search Console</DialogTitle>
              <DialogDescription>
                Enter your Search Console property URL and service account email.
                Ensure GOOGLE_SEARCH_CONSOLE_CREDENTIALS is set in backend environment.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sc-property">Property URL *</Label>
                <Input
                  id="sc-property"
                  type="url"
                  placeholder="https://teraplayer.in"
                  value={connectForm.property_url}
                  onChange={(e) => setConnectForm((f) => ({ ...f, property_url: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sc-email">Service Account Email *</Label>
                <Input
                  id="sc-email"
                  type="email"
                  placeholder="search-console@my-project.iam.gserviceaccount.com"
                  value={connectForm.service_account_email}
                  onChange={(e) => setConnectForm((f) => ({ ...f, service_account_email: e.target.value }))}
                  required
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={connecting}>
                  {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Connect"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Disconnect Confirmation */}
        <AlertDialog open={disconnectConfirm} onOpenChange={setDisconnectConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Search Console?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the Search Console connection and clear all cached data.
                You will need to reconnect to view Search Console data again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleDisconnect}>
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}