import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Settings, Loader2, Save, Info } from "lucide-react";
import { toast } from "sonner";
import { getSiteSettings, updateSiteSettings } from "@/services/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Site() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [maintenance, setMaintenance] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteSettings()
      .then((s) => {
        setData(s);
        setMaintenance(!!s.maintenance_mode);
        setAnnouncement(s.announcement || "");
      })
      .catch((err) => setError(err?.response?.data?.detail || "Failed to load site settings"));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const updated = await updateSiteSettings({ maintenance_mode: maintenance, announcement });
      setData(updated);
      toast.success("Site settings saved");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Site | TeraPlayer Admin</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Site</h1>
          <p className="text-sm text-muted-foreground">Maintenance mode and announcements.</p>
        </div>

        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : !data ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {data.maintenance_mode && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Maintenance mode is ON</AlertTitle>
                <AlertDescription>
                  Public API requests are returning 503. The admin control center and the public maintenance page still work.
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" /> General
                </CardTitle>
                <CardDescription>Changes apply immediately.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="maintenance">Maintenance mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable public API access while you work.
                    </p>
                  </div>
                  <Switch
                    id="maintenance"
                    checked={maintenance}
                    onCheckedChange={setMaintenance}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="announcement">Announcement</Label>
                  <Textarea
                    id="announcement"
                    rows={4}
                    placeholder="Optional message shown on the maintenance screen"
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}