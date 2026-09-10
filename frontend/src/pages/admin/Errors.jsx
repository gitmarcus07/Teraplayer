import { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle,
  Bug,
  Server,
  Database,
  Globe,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { getErrors, getErrorSummary, exportErrorsCsv } from "@/services/adminApi";
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
import { Input } from "@/components/ui/input";
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
import { format } from "date-fns";
import { Label } from "@/components/ui/label";

export default function Errors() {
  const [data, setData] = useState({ errors: [], total: 0 });
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    limit: 50,
    skip: 0,
    kind: "all",
    error_type: "all",
    start_date: "",
    end_date: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getErrors(filters);
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load errors");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const result = await getErrorSummary(7);
      setSummary(result);
    } catch (err) {
      console.error("Failed to load error summary", err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadSummary();
  }, [loadData, loadSummary]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, skip: 0 }));
  };

  const handleSearch = (e) => {
    handleFilterChange("error_type", e.target.value);
  };

  const handleKindChange = (value) => {
    handleFilterChange("kind", value);
  };

  const handleErrorTypeChange = (value) => {
    handleFilterChange("error_type", value);
  };

  const handleDateChange = (key, date) => {
    handleFilterChange(key, date ? format(date, "yyyy-MM-dd") : "");
  };

  const clearFilters = () => {
    setFilters({
      limit: 50,
      skip: 0,
      kind: "all",
      error_type: "all",
      start_date: "",
      end_date: "",
    });
  };

  const hasActiveFilters = filters.kind || filters.error_type || filters.start_date || filters.end_date;

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportErrorsCsv(filters);
      const url = URL.createObjectURL(new Blob([blob], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `teraplayer_errors_${format(new Date(), "yyyyMMdd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Errors exported");
    } catch (err) {
      toast.error("Failed to export errors");
    } finally {
      setExporting(false);
    }
  };

  const goToPage = (page) => {
    setFilters((prev) => ({ ...prev, skip: page * prev.limit }));
  };

  const totalPages = Math.ceil(data.total / filters.limit);
  const currentPage = Math.floor(filters.skip / filters.limit) + 1;

  const getTypeColor = (type) => {
    switch (type) {
      case "extraction": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "api": return "bg-blue-100 text-blue-700 border-blue-200";
      case "stream": return "bg-amber-100 text-amber-700 border-amber-200";
      case "database": return "bg-purple-100 text-purple-700 border-purple-200";
      case "search_console": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "scheduler": return "bg-pink-100 text-pink-700 border-pink-200";
      case "auth": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getErrorTypeColor = (type) => {
    switch (type) {
      case "timeout": return "bg-amber-100 text-amber-700";
      case "network": return "bg-blue-100 text-blue-700";
      case "parse": return "bg-purple-100 text-purple-700";
      case "validation": return "bg-emerald-100 text-emerald-700";
      case "auth": return "bg-red-100 text-red-700";
      case "rate_limit": return "bg-orange-100 text-orange-700";
      case "not_found": return "bg-gray-100 text-gray-700";
      case "server_error": return "bg-destructive/10 text-destructive";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getKindIcon = (kind) => {
    switch (kind) {
      case "extraction": return <Bug className="h-3.5 w-3.5" />;
      case "api": return <Globe className="h-3.5 w-3.5" />;
      case "stream": return <Server className="h-3.5 w-3.5" />;
      case "database": return <Database className="h-3.5 w-3.5" />;
      case "search_console": return <Search className="h-3.5 w-3.5" />;
      case "scheduler": return <AlertCircle className="h-3.5 w-3.5" />;
      case "auth": return <Shield className="h-3.5 w-3.5" />;
      default: return <AlertTriangle className="h-3.5 w-3.5" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Error Intelligence | TeraPlayer Admin</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Error Intelligence</h1>
            <p className="text-sm text-muted-foreground">Track, analyze, and resolve application errors</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
              <Download className={cn("mr-2 h-4 w-4", exporting && "animate-spin")} />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => { loadData(); loadSummary(); }} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && summary.available && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Errors (7d)</p>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <p className="mt-2 text-2xl font-bold text-destructive">{summary.total}</p>
              </CardContent>
            </Card>
            {Object.entries(summary.by_kind || {}).slice(0, 3).map(([kind, count]) => (
              <Card key={kind}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {getKindIcon(kind)}
                      {kind}
                    </p>
                    <Badge variant="outline" className={getTypeColor(kind)}>
                      {count}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" /> Filters
            </CardTitle>
            <CardDescription>Filter and search errors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="error-search" className="text-sm">Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="error-search"
                    type="text"
                    placeholder="Search error type or message..."
                    value={filters.error_type}
                    onChange={handleSearch}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="min-w-[180px]">
                <Label htmlFor="error-kind" className="text-sm">Kind</Label>
                <Select value={filters.kind} onValueChange={handleKindChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All kinds" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All kinds</SelectItem>
                    <SelectItem value="extraction">Extraction</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="stream">Stream</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="search_console">Search Console</SelectItem>
                    <SelectItem value="scheduler">Scheduler</SelectItem>
                    <SelectItem value="auth">Auth</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[180px]">
                <Label htmlFor="error-type" className="text-sm">Error Type</Label>
                <Select value={filters.error_type} onValueChange={handleErrorTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="timeout">Timeout</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="parse">Parse</SelectItem>
                    <SelectItem value="validation">Validation</SelectItem>
                    <SelectItem value="auth">Auth</SelectItem>
                    <SelectItem value="rate_limit">Rate Limit</SelectItem>
                    <SelectItem value="not_found">Not Found</SelectItem>
                    <SelectItem value="server_error">Server Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[180px]">
                <Label htmlFor="error-start" className="text-sm">From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {filters.start_date ? format(new Date(filters.start_date), "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-2">
                      <input
                        type="date"
                        value={filters.start_date}
                        onChange={(e) => handleDateChange("start_date", e.target.value ? new Date(e.target.value) : null)}
                        className="w-full rounded-md border border-border px-3 py-2 text-sm"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="min-w-[180px]">
                <Label htmlFor="error-end" className="text-sm">To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {filters.end_date ? format(new Date(filters.end_date), "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-2">
                      <input
                        type="date"
                        value={filters.end_date}
                        onChange={(e) => handleDateChange("end_date", e.target.value ? new Date(e.target.value) : null)}
                        className="w-full rounded-md border border-border px-3 py-2 text-sm"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Button variant="outline" size="sm" onClick={clearFilters} disabled={!hasActiveFilters}>
                <X className="mr-2 h-4 w-4" /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Error Log
            </CardTitle>
            <CardDescription>
              {data.total} total errors {hasActiveFilters && <span className="text-primary"> (filtered)</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : data.errors?.length ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Kind</th>
                        <th className="pb-2 pr-4 font-medium">Error Type</th>
                        <th className="pb-2 pr-4 font-medium">Message</th>
                        <th className="pb-2 pr-4 font-medium">Detail</th>
                        <th className="pb-2 font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.errors.map((err, i) => (
                        <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/50">
                          <td className="py-2.5 pr-4">
                            <Badge variant="outline" className={cn("gap-1.5 font-mono text-[10px]", getTypeColor(err.kind))}>
                              {getKindIcon(err.kind)}
                              {err.kind}
                            </Badge>
                          </td>
                          <td className="py-2.5 pr-4">
                            <Badge variant="outline" className={getErrorTypeColor(err.error_type)}>
                              {err.error_type}
                            </Badge>
                          </td>
                          <td className="max-w-xs truncate py-2.5 pr-4 text-muted-foreground">{err.message}</td>
                          <td className="max-w-xs truncate py-2.5 pr-4 text-xs text-muted-foreground font-mono">{err.detail ? JSON.stringify(err.detail) : "—"}</td>
                          <td className="whitespace-nowrap py-2.5 text-xs text-muted-foreground">
                            {format(new Date(err.created_at), "PPp")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 2)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {hasActiveFilters ? "No matching errors found" : "No errors recorded yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}