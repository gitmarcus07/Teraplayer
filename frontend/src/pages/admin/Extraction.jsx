import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Cable, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { getExtraction } from "@/services/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Extraction() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getExtraction()
      .then(setData)
      .catch((err) => setError(err?.response?.data?.detail || "Failed to load extractor status"));
  }, []);

  return (
    <>
      <Helmet>
        <title>Extraction | TeraPlayer Admin</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Extraction</h1>
          <p className="text-sm text-muted-foreground">
            Extractors are tried in order until one succeeds. Configuration status only — secrets are never exposed.
          </p>
        </div>

        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : !data ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cable className="h-5 w-5 text-primary" /> Extractor chain
              </CardTitle>
              <CardDescription>
                Order: xAPIverse → Playwright → Cloudflare Worker → hnn → teradl
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.extractors?.map((ex, i) => (
                <div
                  key={ex.name}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary font-mono text-xs">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-mono text-sm font-medium">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">{ex.enabled ? "Enabled" : "Disabled"}</p>
                    </div>
                  </div>
                  {ex.configured ? (
                    <Badge variant="outline" className="gap-1.5 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Configured
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1.5 text-amber-600">
                      <AlertTriangle className="h-3.5 w-3.5" /> Not configured
                    </Badge>
                  )}
                </div>
              ))}
              {!data.extractors?.length && (
                <p className="text-sm text-muted-foreground">No extractors registered.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}