import { useEffect, useState, useMemo, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import {
  Download,
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileText,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getExtractionAnalytics,
  getApiAnalytics,
  getAnalyticsBreakdown,
  getFailureReasons,
  getAnalyticsSeriesByKind,
  exportAnalyticsCsv,
} from "@/services/adminApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

const DATE_RANGES = [
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 28, label: "Last 28 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

const KIND_COLORS = {
  preview: "#10b981",
  watch: "#3b82f6",
  download: "#f59e0b",
  folder: "#8b5cf6",
  extension_create: "#ec4899",
  extension_submit: "#06b6d4",
  extension_result: "#84cc16",
  stream: "#ef4444",
};

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

function formatNumber(num) {
  if (num === null || num === undefined) return "—";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}

function formatPercent(val) {
  if (val === null || val === undefined) return "—";
  return val.toFixed(1) + "%";
}

export default function ExtractionAnalytics() {
  const [days, setDays] = useState(14);
  const [activeTab, setActiveTab] = useState("overview");
  const [exporting, setExporting] = useState(false);

  // Data states
  const [extractionData, setExtractionData] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [failures, setFailures] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [extractionLoading, setExtractionLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ext, api, brk, fail] = await Promise.all([
        getExtractionAnalytics(days),
        getApiAnalytics(days),
        getAnalyticsBreakdown(days),
        getFailureReasons(days),
      ]);
      setExtractionData(ext);
      setApiData(api);
      setBreakdown(brk.breakdown || []);
      setFailures(fail.failures || []);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportAnalyticsCsv(days);
      const url = URL.createObjectURL(new Blob([blob], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `teraplayer_analytics_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Analytics exported");
    } catch (err) {
      toast.error("Failed to export analytics");
    } finally {
      setExporting(false);
    }
  };

  const renderMetricCard = ({ label, value, change, icon: Icon, color }) => (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        {change !== null && change !== undefined && (
          <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: change >= 0 ? "rgb(16 185 129)" : "rgb(239 68 68)" }}>
            {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{change >= 0 ? "+" : ""}{change.toFixed(1)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading && !extractionData) {
    return (
      <>
        <Helmet>
          <title>Extraction Analytics | TeraPlayer Admin</title>
        </Helmet>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Extraction Analytics | TeraPlayer Admin</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Extraction Analytics</h1>
            <p className="text-sm text-muted-foreground">Detailed extraction performance and failure analysis</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-full min-w-[140px] flex-1 sm:w-[160px] sm:flex-none">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map((r) => (
                  <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="shrink-0" onClick={handleExport} disabled={exporting}>
              <Download className={cn("mr-2 h-4 w-4", exporting && "animate-spin")} />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" className="shrink-0" onClick={loadData} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {extractionData?.available && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {renderMetricCard({
              label: "Total Extractions",
              value: formatNumber(extractionData.summary?.total),
              change: null,
              icon: TrendingUp,
              color: "text-primary",
            })}
            {renderMetricCard({
              label: "Successful",
              value: formatNumber(extractionData.summary?.success),
              change: null,
              icon: TrendingUp,
              color: "text-emerald-500",
            })}
            {renderMetricCard({
              label: "Failed",
              value: formatNumber(extractionData.summary?.failure),
              change: null,
              icon: TrendingDown,
              color: "text-destructive",
            })}
            {renderMetricCard({
              label: "Success Rate",
              value: formatPercent(extractionData.summary?.success_rate),
              change: null,
              icon: BarChart2,
              color: "text-amber-500",
            })}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex h-auto w-full max-w-full items-center gap-1 overflow-x-auto p-1 md:grid md:grid-cols-4">
            {[
              { id: "overview", label: "Overview", icon: BarChart2 },
              { id: "by-kind", label: "By Kind", icon: FileText },
              { id: "failures", label: "Failures", icon: AlertTriangle },
              { id: "api", label: "API Analytics", icon: BarChart2 },
            ].map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-2.5 text-xs sm:px-3 sm:text-sm">
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Extractions Over Time</CardTitle>
                <CardDescription>Daily extraction requests (success vs failure)</CardDescription>
              </CardHeader>
              <CardContent>
                {extractionLoading ? (
                  <Skeleton className="h-80 rounded-xl" />
                ) : extractionData?.series?.length > 0 ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={extractionData.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" allowDecimals={false} />
                        <Tooltip formatter={(value, name) => [value.toLocaleString(), name]} />
                        <Legend />
                        <Line type="monotone" dataKey="success" name="Success" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="failure" name="Failure" stroke="#ef4444" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No Data</AlertTitle>
                    <AlertDescription>No extraction data for the selected period.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate Trend</CardTitle>
                <CardDescription>Daily success rate percentage</CardDescription>
              </CardHeader>
              <CardContent>
                {extractionLoading ? (
                  <Skeleton className="h-64 rounded-xl" />
                ) : extractionData?.series?.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={extractionData.series.map(d => ({
                        ...d,
                        success_rate: d.total > 0 ? Math.round((d.success / d.total) * 1000) / 10 : 0,
                      }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" domain={[0, 100]} />
                        <Tooltip formatter={(value, name) => name === "success_rate" ? [value.toFixed(1) + "%", name] : [value.toLocaleString(), name]} />
                        <Legend />
                        <Line type="monotone" dataKey="success_rate" name="Success Rate (%)" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No Data</AlertTitle>
                    <AlertDescription>No extraction data for the selected period.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Kind Tab */}
          <TabsContent value="by-kind" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Extraction by Kind
                </CardTitle>
                <CardDescription>Breakdown by extraction type (preview, watch, download, etc.)</CardDescription>
              </CardHeader>
              <CardContent>
                {extractionData?.by_kind && Object.keys(extractionData.by_kind).length > 0 ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                      {Object.entries(extractionData.by_kind).map(([kind, stats]) => (
                        <Card key={kind} className="border-l-4" style={{ borderLeftColor: KIND_COLORS[kind] || "#888" }}>
                          <CardContent className="p-5">
                            <p className="font-mono text-xs text-muted-foreground mb-2">{kind}</p>
                            <p className="text-2xl font-bold">{formatNumber(stats.total)}</p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="text-emerald-600">
                                <TrendingUp className="h-3 w-3 inline" /> {formatNumber(stats.success)}
                              </span>
                              <span className="text-destructive">
                                <TrendingDown className="h-3 w-3 inline" /> {formatNumber(stats.failure)}
                              </span>
                              <span className="font-medium">{formatPercent(stats.total > 0 ? (stats.success / stats.total) * 100 : 0)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Daily Breakdown by Kind</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {extractionData?.series?.length > 0 ? (
                          <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={extractionData.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                                <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" allowDecimals={false} />
                                <Tooltip formatter={(value, name) => [value.toLocaleString(), name]} />
                                <Legend />
                                {Object.keys(extractionData.by_kind).map((kind, i) => (
                                  <Bar key={kind} dataKey={`${kind}_total`} name={kind} fill={KIND_COLORS[kind] || COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                                ))}
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>No Data</AlertTitle>
                            <AlertDescription>No breakdown data for the selected period.</AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No Data</AlertTitle>
                    <AlertDescription>No extraction data by kind for the selected period.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Failures Tab */}
          <TabsContent value="failures" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" /> Failure Analysis
                </CardTitle>
                <CardDescription>Common failure reasons and trends</CardDescription>
              </CardHeader>
              <CardContent>
                {failures.length > 0 ? (
                  <>
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                            <th className="pb-2 pr-4 font-medium">Failure Reason</th>
                            <th className="pb-2 pr-4 font-medium">Count</th>
                            <th className="pb-2 pr-4 font-medium">Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {failures.map((f, i) => {
                            const totalFailures = failures.reduce((sum, item) => sum + item.count, 0);
                            return (
                              <tr key={i} className="border-b border-border/40 last:border-0">
                                <td className="py-2.5 pr-4 font-mono text-xs">{f.reason}</td>
                                <td className="py-2.5 pr-4 font-medium text-destructive">{formatNumber(f.count)}</td>
                                <td className="py-2.5 pr-4">{formatPercent(totalFailures > 0 ? (f.count / totalFailures) * 100 : 0)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Failure Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={failures}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="count"
                                nameKey="reason"
                                label={({ reason, count, percent }) => `${reason}: ${formatNumber(count)} (${(percent * 100).toFixed(1)}%)`}
                              >
                                {failures.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                              </Pie>
                              <Tooltip formatter={(value) => [formatNumber(value), "Failures"]} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No Failure Data</AlertTitle>
                    <AlertDescription>No detailed failure reasons recorded for the selected period.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Analytics Tab */}
          <TabsContent value="api" className="space-y-6 pt-4">
            {apiData?.available && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {renderMetricCard({
                    label: "Total API Requests",
                    value: formatNumber(apiData.summary?.total),
                    change: null,
                    icon: TrendingUp,
                    color: "text-primary",
                  })}
                  {renderMetricCard({
                    label: "Successful",
                    value: formatNumber(apiData.summary?.success),
                    change: null,
                    icon: TrendingUp,
                    color: "text-emerald-500",
                  })}
                  {renderMetricCard({
                    label: "Failed",
                    value: formatNumber(apiData.summary?.failure),
                    change: null,
                    icon: TrendingDown,
                    color: "text-destructive",
                  })}
                  {renderMetricCard({
                    label: "Success Rate",
                    value: formatPercent(apiData.summary?.success_rate),
                    change: null,
                    icon: BarChart2,
                    color: "text-amber-500",
                  })}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>API Requests Over Time</CardTitle>
                    <CardDescription>Daily API requests by endpoint</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {apiLoading ? (
                      <Skeleton className="h-80 rounded-xl" />
                    ) : apiData?.series?.length > 0 ? (
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={apiData.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                            <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                            <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" allowDecimals={false} />
                            <Tooltip formatter={(value, name) => [value.toLocaleString(), name]} />
                            <Legend />
                            <Line type="monotone" dataKey="success" name="Success" stroke="#10b981" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="failure" name="Failure" stroke="#ef4444" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Data</AlertTitle>
                        <AlertDescription>No API data for the selected period.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>API by Endpoint</CardTitle>
                    <CardDescription>Breakdown by API endpoint type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {apiData?.by_kind && Object.keys(apiData.by_kind).length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {Object.entries(apiData.by_kind).map(([kind, stats]) => (
                          <Card key={kind} className="border-l-4" style={{ borderLeftColor: KIND_COLORS[kind] || "#888" }}>
                            <CardContent className="p-5">
                              <p className="font-mono text-xs text-muted-foreground mb-2">{kind}</p>
                              <p className="text-2xl font-bold">{formatNumber(stats.total)}</p>
                              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="text-emerald-600">
                                  <TrendingUp className="h-3 w-3 inline" /> {formatNumber(stats.success)}
                                </span>
                                <span className="text-destructive">
                                  <TrendingDown className="h-3 w-3 inline" /> {formatNumber(stats.failure)}
                                </span>
                                <span className="font-medium">{formatPercent(stats.total > 0 ? (stats.success / stats.total) * 100 : 0)}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Data</AlertTitle>
                        <AlertDescription>No API endpoint data for the selected period.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}