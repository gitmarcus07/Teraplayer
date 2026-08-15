import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { History, Loader2 } from "lucide-react";
import { getActivity } from "@/services/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Activity() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getActivity(100)
      .then(setData)
      .catch((err) => setError(err?.response?.data?.detail || "Failed to load activity log"));
  }, []);

  return (
    <>
      <Helmet>
        <title>Activity | TeraPlayer Admin</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Activity</h1>
          <p className="text-sm text-muted-foreground">Audit trail of every admin action. Immutable — appended only.</p>
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
                <History className="h-5 w-5 text-primary" /> Audit log
              </CardTitle>
              <CardDescription>{data.entries?.length ?? 0} recent entries</CardDescription>
            </CardHeader>
            <CardContent>
              {data.entries?.length ? (
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
                        <tr key={i} className="border-b border-border/40 last:border-0">
                          <td className="py-2.5 pr-4">
                            <Badge variant="secondary" className="font-mono text-[10px]">{entry.action}</Badge>
                          </td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{entry.admin_email}</td>
                          <td className="py-2.5 pr-4">{entry.target || "—"}</td>
                          <td className="max-w-xs truncate py-2.5 pr-4 text-muted-foreground">{entry.detail || "—"}</td>
                          <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{entry.ip || "—"}</td>
                          <td className="whitespace-nowrap py-2.5 text-xs text-muted-foreground">
                            {new Date(entry.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No admin activity recorded yet.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}