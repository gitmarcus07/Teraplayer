import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { getAnalytics } from "@/services/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const RANGES = [
  { days: 7, label: "7d" },
  { days: 14, label: "14d" },
  { days: 30, label: "30d" },
];

export default function Analytics() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAnalytics(days)
      .then(setData)
      .catch((err) => setError(err?.response?.data?.detail || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <>
      <Helmet>
        <title>Analytics | TeraPlayer Admin</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">Daily extraction request volume over time.</p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-border/60 p-1">
            {RANGES.map((r) => (
              <Button
                key={r.days}
                variant="ghost"
                size="sm"
                className={cn("h-8", days === r.days && "bg-primary text-primary-foreground")}
                onClick={() => setDays(r.days)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>

        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : loading ? (
          <Skeleton className="h-80 rounded-xl" />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Requests per day</CardTitle>
                <CardDescription>
                  {data?.summary?.total
                    ? `${data.summary.total.toLocaleString()} requests total · ${data.summary.success_rate}% success`
                    : "No data in this window yet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.series || []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="success" name="Success" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="failure" name="Failure" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Totals</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.summary?.available && data.summary.by_kind && Object.keys(data.summary.by_kind).length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(data.summary.by_kind).map(([kind, v]) => (
                      <div key={kind} className="rounded-xl border border-border/60 p-4">
                        <p className="font-mono text-xs text-muted-foreground">{kind}</p>
                        <p className="mt-1 text-xl font-bold">{v.total.toLocaleString()}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {v.success} success · {v.failure} failed
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No metrics recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}