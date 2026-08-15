import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Activity, CheckCircle2, XCircle, TrendingUp, Loader2 } from "lucide-react";
import { getDashboard } from "@/services/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({ icon: Icon, label, value, sub, tone = "default" }) {
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
                : "h-5 w-5 text-primary"
            }
          />
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => setError(err?.response?.data?.detail || "Failed to load dashboard"));
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

  if (!data) {
    return (
      <>
        <Helmet>
          <title>Dashboard | TeraPlayer Admin</title>
        </Helmet>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </>
    );
  }

  const m = data.metrics || {};

  return (
    <>
      <Helmet>
        <title>Dashboard | TeraPlayer Admin</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live overview of extraction traffic and system health.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Activity} label="Total requests" value={m.available ? m.total?.toLocaleString() : "—"} sub="All time" />
          <StatCard
            icon={CheckCircle2}
            label="Success rate"
            value={m.available ? `${m.success_rate}%` : "—"}
            sub={`${m.success?.toLocaleString?.() ?? m.success} successes`}
            tone="success"
          />
          <StatCard icon={XCircle} label="Failures" value={m.available ? m.failure?.toLocaleString() : "—"} sub="All time" tone="danger" />
          <StatCard icon={TrendingUp} label="Today" value={m.available ? m.today_total?.toLocaleString() : "—"} sub={`${m.today_success ?? 0} successful`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>By operation</CardTitle>
              <CardDescription>Success and failure counts per endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              {m.available && m.by_kind && Object.keys(m.by_kind).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(m.by_kind).map(([kind, v]) => (
                    <div key={kind} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-[10px]">{kind}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {v.success}
                        </span>
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <XCircle className="h-3.5 w-3.5" /> {v.failure}
                        </span>
                        <span className="w-14 text-right font-medium text-foreground">{v.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No metrics recorded yet — traffic will appear here as extraction requests come in.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Latest admin control-center actions</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recent_activity?.length ? (
                <ul className="space-y-3">
                  {data.recent_activity.map((entry, i) => (
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Extractors</CardTitle>
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