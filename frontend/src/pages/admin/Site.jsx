import { useEffect, useState, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  Settings,
  Loader2,
  Save,
  Info,
  AlertTriangle,
  Shield,
  Calendar,
  Clock,
  History,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  ArrowUpDown,
  Bell,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSiteSettings,
  updateSiteSettings,
  setSiteOperatingMode,
  getMaintenanceHistory,
  previewMaintenancePage,
  checkScheduledMaintenance,
} from "@/services/adminApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  validateUrl,
  parseMarkdownLinks,
  BUTTON_STYLES,
  OPERATING_MODES,
  formatDateTime,
  formatRelativeTime,
  getCountdown,
  sortButtons,
  newButtonId,
} from "@/utils/siteUtils";

const emptyButton = {
  id: "",
  text: "",
  url: "",
  style: "primary",
  open_in_new_tab: true,
  icon: "",
  order: 0,
  enabled: true,
};

export default function Site() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");

  // Settings tab state
  const [operatingMode, setOperatingMode] = useState("normal");
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [pendingEmergencyMode, setPendingEmergencyMode] = useState(false);

  // Announcement tab state
  const [announcement, setAnnouncement] = useState({
    enabled: false,
    title: "",
    message: "",
    icon: "",
    buttons: [],
  });

  // Buttons tab state
  const [buttons, setButtons] = useState([]);
  const [editingButtonId, setEditingButtonId] = useState(null);
  const [buttonForm, setButtonForm] = useState(emptyButton);

  // Schedule tab state
  const [schedule, setSchedule] = useState({
    enabled: false,
    start_at: "",
    end_at: "",
    timezone: "UTC",
    announcement_snapshot: null,
  });
  const [scheduleError, setScheduleError] = useState(null);

  // History tab state
  const [history, setHistory] = useState({ entries: [], total: 0 });
  const [historyPage, setHistoryPage] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Preview tab state
  const [previewData, setPreviewData] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      const settings = await getSiteSettings();
      setData(settings);
      setOperatingMode(settings.operating_mode || "normal");
      setAnnouncement(settings.announcement || { enabled: false, title: "", message: "", icon: "", buttons: [] });
      setButtons(sortButtons(settings.announcement?.buttons || []));
      setSchedule(settings.schedule || { enabled: false, start_at: "", end_at: "", timezone: "UTC", announcement_snapshot: null });
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load site settings");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load history when tab is active
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const result = await getMaintenanceHistory(50, historyPage * 50);
      setHistory(result);
    } catch (err) {
      toast.error("Failed to load maintenance history");
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage]);

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab, historyPage, loadHistory]);

  // Save all settings
  async function handleSave(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const sortedButtons = sortButtons(buttons);
      const updatedAnnouncement = { ...announcement, buttons: sortedButtons };
      const updated = await updateSiteSettings({
        operating_mode: operatingMode,
        announcement: updatedAnnouncement,
        schedule,
      });
      setData(updated);
      setOperatingMode(updated.operating_mode);
      setAnnouncement(updated.announcement);
      setButtons(sortButtons(updated.announcement?.buttons || []));
      setSchedule(updated.schedule);
      toast.success("Site settings saved");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  // Handle operating mode change
  async function handleModeChange(mode) {
    if (mode === "emergency") {
      setPendingEmergencyMode(true);
      setShowEmergencyConfirm(true);
      return;
    }
    try {
      const updated = await setSiteOperatingMode(mode);
      setData(updated);
      setOperatingMode(updated.operating_mode);
      setAnnouncement(updated.announcement);
      setSchedule(updated.schedule);
      toast.success(`Operating mode changed to ${mode}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not change mode");
    }
  }

  async function confirmEmergencyMode() {
    try {
      const updated = await setSiteOperatingMode("emergency", true);
      setData(updated);
      setOperatingMode(updated.operating_mode);
      setAnnouncement(updated.announcement);
      setSchedule(updated.schedule);
      toast.success("Emergency mode enabled");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not enable emergency mode");
    } finally {
      setShowEmergencyConfirm(false);
      setPendingEmergencyMode(false);
    }
  }

  // Button management
  function openButtonEditor(button = null) {
    if (button) {
      setEditingButtonId(button.id);
      setButtonForm({ ...button });
    } else {
      setEditingButtonId(null);
      setButtonForm({ ...emptyButton, id: newButtonId(), order: buttons.length });
    }
  }

  function closeButtonEditor() {
    setEditingButtonId(null);
    setButtonForm(emptyButton);
  }

  async function saveButton(e) {
    e.preventDefault();
    const validation = validateUrl(buttonForm.url);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    if (!buttonForm.text.trim()) {
      toast.error("Button text is required");
      return;
    }

    const newButtons = editingButtonId
      ? buttons.map((b) => (b.id === editingButtonId ? { ...buttonForm, url: validation.url } : b))
      : [...buttons, { ...buttonForm, url: validation.url }];

    setButtons(sortButtons(newButtons));
    closeButtonEditor();
    toast.success(editingButtonId ? "Button updated" : "Button added");
  }

  function deleteButton(id) {
    setButtons(buttons.filter((b) => b.id !== id));
    toast.success("Button removed");
  }

  function moveButton(id, direction) {
    const index = buttons.findIndex((b) => b.id === id);
    if (index === -1) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= buttons.length) return;
    const newButtons = [...buttons];
    [newButtons[index], newButtons[newIndex]] = [newButtons[newIndex], newButtons[index]];
    setButtons(newButtons.map((b, i) => ({ ...b, order: i })));
  }

  // Schedule management
  function handleScheduleChange(field, value) {
    setSchedule((prev) => ({ ...prev, [field]: value }));
    setScheduleError(null);
  }

  function validateSchedule() {
    if (!schedule.enabled) return true;
    if (!schedule.start_at || !schedule.end_at) {
      setScheduleError("Start and end times are required when scheduling is enabled");
      return false;
    }
    const start = new Date(schedule.start_at);
    const end = new Date(schedule.end_at);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setScheduleError("Invalid date format");
      return false;
    }
    if (start >= end) {
      setScheduleError("End time must be after start time");
      return false;
    }
    if (start < new Date()) {
      setScheduleError("Start time cannot be in the past");
      return false;
    }
    return true;
  }

  // Preview
  async function generatePreview() {
    setGeneratingPreview(true);
    try {
      const preview = await previewMaintenancePage({
        operating_mode: operatingMode,
        announcement,
        scheduled: schedule.enabled,
        schedule_end: schedule.end_at,
      });
      setPreviewData(preview);
      setPreviewOpen(true);
    } catch (err) {
      toast.error("Failed to generate preview");
    } finally {
      setGeneratingPreview(false);
    }
  }

  // Check scheduled maintenance now
  async function handleCheckSchedule() {
    try {
      const result = await checkScheduledMaintenance();
      if (result.changed) {
        loadData();
        toast.success("Scheduled maintenance check completed - changes applied");
      } else {
        toast.info("No scheduled maintenance changes needed");
      }
    } catch (err) {
      toast.error("Failed to check scheduled maintenance");
    }
  }

  // Render parsed markdown links
  function renderMessage(message) {
    if (!message) return null;
    const parts = parseMarkdownLinks(message);
    return (
      <span className="whitespace-pre-wrap">
        {parts.map((part, i) =>
          part.type === "link" ? (
            <a
              key={i}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              {part.text}
            </a>
          ) : (
            <span key={i}>{part.content}</span>
          )
        )}
      </span>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Site | TeraPlayer Admin</title>
        </Helmet>
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={loadData}>
              <RotateCcw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Helmet>
          <title>Site | TeraPlayer Admin</title>
        </Helmet>
        <Skeleton className="h-96 rounded-xl" />
      </>
    );
  }

  const isMaintenance = operatingMode === "maintenance";
  const isEmergency = operatingMode === "emergency";
  const countdown = schedule.enabled && schedule.end_at ? getCountdown(schedule.end_at) : null;

  return (
    <>
      <Helmet>
        <title>Site | TeraPlayer Admin</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Site Control Center</h1>
          <p className="text-sm text-muted-foreground">
            Manage operating modes, maintenance announcements, scheduling, and history.
          </p>
        </div>

        {/* Current Status Banner */}
        {(isMaintenance || isEmergency) && (
          <Alert variant={isEmergency ? "destructive" : "default"} className="border-primary/30 bg-primary/5">
            <div className="flex items-start gap-3">
              {isEmergency ? (
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              ) : (
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertTitle className="flex items-center gap-2">
                  {isEmergency ? "Emergency Mode Active" : "Maintenance Mode Active"}
                  <Badge variant={isEmergency ? "destructive" : "secondary"} className="text-[10px]">
                    {operatingMode.toUpperCase()}
                  </Badge>
                </AlertTitle>
                <AlertDescription className="mt-1">
                  Public API requests are returning 503. The admin control center and the public maintenance page still work.
                  {countdown && <span className="ml-2 font-mono text-primary">Countdown: {countdown}</span>}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              {[
                { id: "settings", label: "Operating Mode", icon: Settings },
                { id: "announcement", label: "Announcement", icon: Bell },
                { id: "buttons", label: "Buttons", icon: Shield },
                { id: "schedule", label: "Schedule", icon: Calendar },
                { id: "history", label: "History", icon: History },
                { id: "preview", label: "Preview", icon: Eye },
              ].map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1.5 text-sm py-3">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" /> Operating Mode
                  </CardTitle>
                  <CardDescription>Controls how TeraPlayer behaves for public visitors.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {OPERATING_MODES.map((mode) => (
                      <div
                        key={mode.value}
                        className={cn(
                          "relative rounded-xl border p-4 transition-all",
                          operatingMode === mode.value
                            ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                            : "border-border/60 hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <span className="text-3xl shrink-0">{mode.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <label className="font-medium cursor-pointer">{mode.label}</label>
                              {operatingMode === mode.value && (
                                <Badge variant="outline" className="text-xs text-emerald-600">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{mode.description}</p>
                          </div>
                          <Button
                            type="button"
                            variant={operatingMode === mode.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleModeChange(mode.value)}
                            disabled={saving || operatingMode === mode.value}
                          >
                            {operatingMode === mode.value ? "Active" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Important Notes</AlertTitle>
                    <AlertDescription className="space-y-1 text-sm">
                      <p><strong>Normal:</strong> All services online. No maintenance page shown.</p>
                      <p><strong>Maintenance:</strong> Public users see maintenance page. Admins access /admin normally.</p>
                      <p><strong>Emergency:</strong> Immediately restricts public access. Requires confirmation. Admin access always preserved.</p>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Announcement Tab */}
            <TabsContent value="announcement" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" /> Maintenance Announcement
                  </CardTitle>
                  <CardDescription>
                    Shown on the maintenance page when mode is Maintenance or Emergency.
                    Supports markdown links: <code className="px-1.5 py-0.5 bg-muted rounded text-xs">[Link Text](https://example.com)</code>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="announcement-enabled">Enable Announcement</Label>
                      <p className="text-sm text-muted-foreground">Show announcement on maintenance page</p>
                    </div>
                    <Switch
                      id="announcement-enabled"
                      checked={announcement.enabled}
                      onCheckedChange={(checked) => setAnnouncement((a) => ({ ...a, enabled: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="announcement-title">Title</Label>
                    <Input
                      id="announcement-title"
                      placeholder="e.g., Scheduled Maintenance"
                      value={announcement.title}
                      onChange={(e) => setAnnouncement((a) => ({ ...a, title: e.target.value }))}
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="announcement-icon">Icon / Emoji (optional)</Label>
                    <Input
                      id="announcement-icon"
                      placeholder="e.g., ⚙️ or 🔧"
                      value={announcement.icon}
                      onChange={(e) => setAnnouncement((a) => ({ ...a, icon: e.target.value }))}
                      maxLength={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="announcement-message">Message</Label>
                    <Textarea
                      id="announcement-message"
                      rows={6}
                      placeholder="We are currently upgrading TeraPlayer to improve performance and reliability.&#10;&#10;Need help? [Contact Support](https://example.com/support)"
                      value={announcement.message}
                      onChange={(e) => setAnnouncement((a) => ({ ...a, message: e.target.value }))}
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground">
                      Supports markdown links: <code>[Link Text](https://example.com)</code> — rendered as clickable links.
                    </p>
                  </div>

                  {announcement.message && (
                    <div className="rounded-lg border border-border/60 bg-muted/50 p-4">
                      <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                      <div className="text-sm">{renderMessage(announcement.message)}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Buttons Tab */}
            <TabsContent value="buttons" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" /> Announcement Buttons
                      </CardTitle>
                      <CardDescription>Clickable buttons displayed on the maintenance page.</CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => openButtonEditor()}>
                      <Plus className="mr-2 h-4 w-4" /> Add Button
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {buttons.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="h-12 w-12 mx-auto text-muted-foreground/50" />
                      <p className="mt-3 text-sm text-muted-foreground">No buttons configured</p>
                      <p className="text-xs text-muted-foreground">Add buttons to provide quick links on the maintenance page</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortButtons(buttons).map((button, index) => (
                        <div
                          key={button.id}
                          className="flex items-center gap-3 rounded-xl border border-border/60 p-4"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => moveButton(button.id, -1)}
                            disabled={index === 0}
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-xs font-medium",
                                  getButtonStyleClass(button.style)
                                )}
                              >
                                {button.text}
                              </span>
                              <Badge variant="secondary" className="text-[10px] font-mono">
                                {button.style}
                              </Badge>
                              {button.icon && <span className="text-lg">{button.icon}</span>}
                              {button.open_in_new_tab && (
                                <span className="text-[10px] text-muted-foreground">↗ New tab</span>
                              )}
                              {!button.enabled && (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                  Disabled
                                </Badge>
                              )}
                            </div>
                            <p className="truncate text-xs text-muted-foreground font-mono">{button.url}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openButtonEditor(button)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <GripVertical className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteButton(button.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> Scheduled Maintenance
                  </CardTitle>
                  <CardDescription>
                    Automatically enable/disable maintenance mode at specified times.
                    Uses server-side scheduler — works even after server restarts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="schedule-enabled">Enable Scheduling</Label>
                      <p className="text-sm text-muted-foreground">Automatically activate maintenance at the scheduled time</p>
                    </div>
                    <Switch
                      id="schedule-enabled"
                      checked={schedule.enabled}
                      onCheckedChange={(checked) => handleScheduleChange("enabled", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="schedule-start">Start Date & Time</Label>
                      <Input
                        id="schedule-start"
                        type="datetime-local"
                        value={schedule.start_at ? schedule.start_at.slice(0, 16) : ""}
                        onChange={(e) => handleScheduleChange("start_at", e.target.value ? new Date(e.target.value).toISOString() : "")}
                        disabled={!schedule.enabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schedule-end">End Date & Time</Label>
                      <Input
                        id="schedule-end"
                        type="datetime-local"
                        value={schedule.end_at ? schedule.end_at.slice(0, 16) : ""}
                        onChange={(e) => handleScheduleChange("end_at", e.target.value ? new Date(e.target.value).toISOString() : "")}
                        disabled={!schedule.enabled}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedule-timezone">Timezone</Label>
                    <Input
                      id="schedule-timezone"
                      value={schedule.timezone}
                      onChange={(e) => handleScheduleChange("timezone", e.target.value)}
                      placeholder="UTC"
                      disabled={!schedule.enabled}
                    />
                  </div>

                  {schedule.enabled && schedule.end_at && countdown && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-600">Countdown to auto-disable:</span>
                        <span className="font-mono text-lg text-amber-700">{countdown}</span>
                      </div>
                    </div>
                  )}

                  {scheduleError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{scheduleError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCheckSchedule}
                      disabled={!schedule.enabled}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" /> Check Schedule Now
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Manually trigger the scheduler check (runs automatically every minute)
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" /> Scheduled Announcement
                  </CardTitle>
                  <CardDescription>
                    Optional: Custom announcement for scheduled maintenance (different from regular announcement).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Use custom announcement for scheduled maintenance</Label>
                    <div className="space-y-4 pl-4 border-l-2 border-border/60">
                      <div className="space-y-2">
                        <Label htmlFor="sched-title">Title</Label>
                        <Input
                          id="sched-title"
                          value={schedule.announcement_snapshot?.title || ""}
                          onChange={(e) =>
                            setSchedule((s) => ({
                              ...s,
                              announcement_snapshot: {
                                ...(s.announcement_snapshot || { enabled: true, title: "", message: "", icon: "", buttons: [] }),
                                title: e.target.value,
                              },
                            }))
                          }
                          placeholder="Scheduled Maintenance"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sched-message">Message</Label>
                        <Textarea
                          id="sched-message"
                          rows={4}
                          value={schedule.announcement_snapshot?.message || ""}
                          onChange={(e) =>
                            setSchedule((s) => ({
                              ...s,
                              announcement_snapshot: {
                                ...(s.announcement_snapshot || { enabled: true, title: "", message: "", icon: "", buttons: [] }),
                                message: e.target.value,
                              },
                            }))
                          }
                          placeholder="Scheduled maintenance in progress..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sched-icon">Icon</Label>
                        <Input
                          id="sched-icon"
                          value={schedule.announcement_snapshot?.icon || ""}
                          onChange={(e) =>
                            setSchedule((s) => ({
                              ...s,
                              announcement_snapshot: {
                                ...(s.announcement_snapshot || { enabled: true, title: "", message: "", icon: "", buttons: [] }),
                                icon: e.target.value,
                              },
                            }))
                          }
                          placeholder="🔧"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" /> Maintenance History
                  </CardTitle>
                  <CardDescription>Complete audit trail of all maintenance mode changes.</CardDescription>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <Skeleton className="h-64 rounded-xl" />
                  ) : history.entries.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="h-12 w-12 mx-auto text-muted-foreground/50" />
                      <p className="mt-3 text-sm text-muted-foreground">No maintenance history yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                            <th className="pb-2 pr-4 font-medium">Mode</th>
                            <th className="pb-2 pr-4 font-medium">Started</th>
                            <th className="pb-2 pr-4 font-medium">Ended</th>
                            <th className="pb-2 pr-4 font-medium">Duration</th>
                            <th className="pb-2 pr-4 font-medium">Admin</th>
                            <th className="pb-2 pr-4 font-medium">Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.entries.map((entry, i) => {
                            const started = new Date(entry.started_at);
                            const ended = entry.ended_at ? new Date(entry.ended_at) : null;
                            const duration = ended
                              ? Math.round((ended - started) / 60000)
                              : Math.round((Date.now() - started) / 60000);
                            const durationStr = duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h ${duration % 60}m`;
                            const modeColors = {
                              normal: "text-emerald-600",
                              maintenance: "text-amber-600",
                              emergency: "text-destructive",
                            };
                            return (
                              <tr key={i} className="border-b border-border/40 last:border-0">
                                <td className="py-2.5 pr-4">
                                  <Badge
                                    variant="secondary"
                                    className={cn("font-mono text-[10px]", modeColors[entry.mode] || "")}
                                  >
                                    {entry.mode.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">
                                  {formatDateTime(entry.started_at)}
                                </td>
                                <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">
                                  {entry.ended_at ? formatDateTime(entry.ended_at) : (
                                    <span className="text-amber-600">Ongoing</span>
                                  )}
                                </td>
                                <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{durationStr}</td>
                                <td className="py-2.5 pr-4 text-muted-foreground">{entry.admin_email}</td>
                                <td className="py-2.5 pr-4">
                                  <Badge variant={entry.scheduled ? "outline" : "secondary"} className="text-[10px]">
                                    {entry.scheduled ? "Scheduled" : "Manual"}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {history.total > 50 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                        disabled={historyPage === 0}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {historyPage + 1} of {Math.ceil(history.total / 50)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage((p) => p + 1)}
                        disabled={history.entries.length < 50}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" /> Maintenance Page Preview
                  </CardTitle>
                  <CardDescription>
                    Preview how the maintenance page will look to public visitors.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={generatePreview}
                      disabled={generatingPreview}
                    >
                      {generatingPreview ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Generate Preview
                        </>
                      )}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Renders the maintenance page with current settings
                    </span>
                  </div>

                  {previewData && (
                    <div className="rounded-xl border border-border/60 bg-background p-6">
                      <div className="max-w-md mx-auto text-center space-y-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30 mx-auto">
                          {previewData.announcement?.icon ? (
                            <span className="text-3xl">{previewData.announcement.icon}</span>
                          ) : (
                            <Settings className="h-8 w-8 text-primary" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold">
                            {previewData.announcement?.title || "TeraPlayer is under maintenance"}
                          </h3>
                          <p className="text-muted-foreground">
                            {renderMessage(previewData.announcement?.message || "We'll be back soon!")}
                          </p>
                        </div>
                        {previewData.announcement?.buttons?.length > 0 && (
                          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                            {sortButtons(previewData.announcement.buttons)
                              .filter((b) => b.enabled)
                              .map((button) => (
                                <a
                                  key={button.id}
                                  href={button.url}
                                  target={button.open_in_new_tab ? "_blank" : "_self"}
                                  rel="noopener noreferrer"
                                  className={cn(
                                    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                    getButtonStyleClass(button.style)
                                  )}
                                >
                                  {button.icon && <span>{button.icon}</span>}
                                  {button.text}
                                </a>
                              ))}
                          </div>
                        )}
                        {previewData.scheduled && previewData.schedule_end && (
                          <div className="flex items-center justify-center gap-2 text-sm text-amber-600 pt-2 border-t border-border/60">
                            <Clock className="h-4 w-4" />
                            <span>Expected back: {formatDateTime(previewData.schedule_end)}</span>
                            <span className="font-mono text-lg">{getCountdown(previewData.schedule_end)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-4 border-t border-border/60">
            <Button type="submit" disabled={saving} className="w-full sm:w-auto min-w-[160px]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Emergency Mode Confirmation Dialog */}
      <AlertDialog open={showEmergencyConfirm} onOpenChange={setShowEmergencyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Enable Emergency Mode?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately disable public access to TeraPlayer services.
              <ul className="mt-3 space-y-1 text-sm">
                <li>• Public website functionality: <strong>Disabled</strong></li>
                <li>• Public extraction: <strong>Disabled</strong></li>
                <li>• Public API: <strong>Disabled</strong></li>
                <li>• Admin access (/admin): <strong>ALWAYS AVAILABLE</strong></li>
              </ul>
              <p className="mt-3 font-medium">This action requires explicit confirmation.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingEmergencyMode(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={confirmEmergencyMode}>
              Enable Emergency Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Button Editor Dialog */}
      <Dialog open={!!editingButtonId} onOpenChange={(open) => !open && closeButtonEditor()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingButtonId ? "Edit Button" : "Add Button"}</DialogTitle>
            <DialogDescription>Configure a clickable button for the maintenance announcement.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveButton} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="btn-text">Button Text *</Label>
              <Input
                id="btn-text"
                value={buttonForm.text}
                onChange={(e) => setButtonForm((f) => ({ ...f, text: e.target.value }))}
                placeholder="Join our Telegram"
                maxLength={50}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="btn-url">URL *</Label>
              <Input
                id="btn-url"
                type="url"
                value={buttonForm.url}
                onChange={(e) => setButtonForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://t.me/example"
                required
              />
              <p className="text-xs text-muted-foreground">Only http:// and https:// URLs allowed</p>
            </div>
            <div className="space-y-2">
              <Label>Button Style</Label>
              <div className="flex flex-wrap gap-2">
                {BUTTON_STYLES.map((style) => (
                  <Button
                    key={style.value}
                    type="button"
                    variant={buttonForm.style === style.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setButtonForm((f) => ({ ...f, style: style.value }))}
                    className={cn(style.className, "h-8")}
                  >
                    {style.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={buttonForm.open_in_new_tab}
                  onChange={(e) => setButtonForm((f) => ({ ...f, open_in_new_tab: e.target.checked }))}
                  className="rounded border-border"
                />
                Open in new tab
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={buttonForm.enabled}
                  onChange={(e) => setButtonForm((f) => ({ ...f, enabled: e.target.checked }))}
                  className="rounded border-border"
                />
                Enabled
              </label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="btn-icon">Icon / Emoji (optional)</Label>
              <Input
                id="btn-icon"
                value={buttonForm.icon}
                onChange={(e) => setButtonForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="💬"
                maxLength={10}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{editingButtonId ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}