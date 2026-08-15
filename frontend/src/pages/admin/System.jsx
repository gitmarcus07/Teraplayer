import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Server, Database, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { getSystem } from "@/services/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function statusBadge(status) {
  if (status === "connected" || status === "Healthy") return <Badge variant="outline" className="gap-1.5 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Connected</Badge>;
  if (status === "degraded" || status === "Degraded") return <Badge variant="outline" className="gap-1.5 text-amber-600"><AlertTriangle className="h-3.5 w-3.5" /> Degraded</Badge>;
  return <Badge variant="outline" className="gap-1.5 text-muted-foreground"><XCircle className="h-3.5 w-3.5" /> Not configured</Badge>;
}

export default function System() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSystem()
      .then(setData)
      .catch((err) => setError(err?.response?.data?.detail || "Failed to load system info"));
  }, []);

  return (
    <>
      <Helmet>
        <title>System | TeraPlayer Admin</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">System</h1>
          <p className="text-sm text-muted-foreground">Runtime health and configuration status. Only booleans are exposed.</p>
        </div>

        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : !data ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" /> Runtime
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span>{data.mongo === "connected" ? "Healthy" : data.mongo === "degraded" ? "Degraded" : "Unavailable"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">MongoDB</span>
                  {statusBadge(data.mongo)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Database</span>
                  <span className="font-mono">{data.db_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">API version</span>
                  <span className="font-mono">{data.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Python</span>
                  <span className="font-mono">{data.python}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" /> Integrations
                </CardTitle>
                <CardDescription>Configured or not — values are never shown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {Object.entries(data.secret_vars || {}).map(([name, configured]) => (
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
          </div>
        )}
      </div>
    </>
  );
}