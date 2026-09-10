import { useEffect, useState, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  History,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { getActivityFiltered, exportActivityCsv } from "@/services/adminApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

export default function Activity() {
  const [data, setData] = useState({ entries: [], total: 0, actions: [] });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    limit: 50,
    skip: 0,
    admin_id: "all",
    action: "all",
    start_date: "",
    end_date: "",
    search: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getActivityFiltered(filters);
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load activity log");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, skip: 0 }));
  };

  const handleSearch = (e) => {
    handleFilterChange("search", e.target.value);
  };

  const handleActionChange = (value) => {
    handleFilterChange("action", value);
  };

  const handleAdminChange = (value) => {
    handleFilterChange("admin_id", value);
  };

  const handleDateChange = (key, date) => {
    handleFilterChange(key, date ? format(date, "yyyy-MM-dd") : "");
  };

  const clearFilters = () => {
    setFilters({
      limit: 50,
      skip: 0,
      admin_id: "all",
      action: "all",
      start_date: "",
      end_date: "",
      search: "",
    });
  };

  const hasActiveFilters = filters.admin_id !== "all" || filters.action !== "all" || filters.start_date || filters.end_date || filters.search;

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportActivityCsv(filters);
      const url = URL.createObjectURL(new Blob([blob], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `teraplayer_audit_${format(new Date(), "yyyyMMdd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Activity log exported");
    } catch (err) {
      toast.error("Failed to export activity log");
    } finally {
      setExporting(false);
    }
  };

  const goToPage = (page) => {
    setFilters((prev) => ({ ...prev, skip: page * prev.limit }));
  };

  const totalPages = Math.ceil(data.total / filters.limit);
  const currentPage = Math.floor(filters.skip / filters.limit) + 1;

  return (
    <>
      <Helmet>
        <title>Activity | TeraPlayer Admin</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Activity</h1>
            <p className="text-sm text-muted-foreground">Audit trail of every admin action. Immutable — appended only.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
              <Download className={cn("mr-2 h-4 w-4", exporting && "animate-spin")} />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" /> Filters
            </CardTitle>
            <CardDescription>Filter and search the audit log</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="activity-search" className="text-sm">Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="activity-search"
                    type="text"
                    placeholder="Search actions, targets, admins..."
                    value={filters.search}
                    onChange={handleSearch}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="min-w-[180px]">
                <Label htmlFor="activity-action" className="text-sm">Action</Label>
                <Select value={filters.action} onValueChange={handleActionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    {data.actions?.map((action) => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[180px]">
                <Label htmlFor="activity-admin" className="text-sm">Admin</Label>
                <Select value={filters.admin_id} onValueChange={handleAdminChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All admins" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All admins</SelectItem>
                    {data.entries?.map((entry) => (
                      <SelectItem key={entry.admin_id} value={entry.admin_id}>{entry.admin_email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[180px]">
                <Label htmlFor="activity-start" className="text-sm">From Date</Label>
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
                <Label htmlFor="activity-end" className="text-sm">To Date</Label>
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
              <History className="h-5 w-5 text-primary" /> Audit Log
            </CardTitle>
            <CardDescription>
              {data.total} total entries {hasActiveFilters && <span className="text-primary"> (filtered)</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : data.entries?.length ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Action</th>
                        <th className="pb-2 pr-4 font-medium">Admin</th>
                        <th className="pb-2 pr-4 font-medium">Target</th>
                        <th className="pb-2 pr-4 font-medium">Detail</th>
                        <th className="pb-2 pr-4 font-medium">IP</th>
                        <th className="pb-2 font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.entries.map((entry, i) => (
                        <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/50">
                          <td className="py-2.5 pr-4">
                            <Badge variant="secondary" className="font-mono text-[10px]">{entry.action}</Badge>
                          </td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{entry.admin_email}</td>
                          <td className="py-2.5 pr-4">{entry.target || "—"}</td>
                          <td className="max-w-xs truncate py-2.5 pr-4 text-muted-foreground">{entry.detail || "—"}</td>
                          <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{entry.ip || "—"}</td>
                          <td className="whitespace-nowrap py-2.5 text-xs text-muted-foreground">
                            {format(new Date(entry.created_at), "PPp")}
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
                <History className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {hasActiveFilters ? "No matching entries found" : "No admin activity recorded yet."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}