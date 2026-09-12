import { useEffect, useState, useCallback } from "react";
import { Bell, Loader2, X, Check, Archive, ExternalLink, AlertTriangle } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { getNotifications, markNotificationRead, markAllNotificationsRead, archiveNotification, getUnreadNotificationCount } from "@/services/adminApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

export function NotificationBell() {
  const { admin } = useAdmin();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!admin) return;
    setLoading(true);
    try {
      const [notifs, count] = await Promise.all([
        getNotifications(false, 20, 0),
        getUnreadNotificationCount(),
      ]);
      setNotifications(notifs.notifications || []);
      setUnreadCount(count.unread_count || 0);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkRead = async (notification_id) => {
    try {
      await markNotificationRead(notification_id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification_id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const result = await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success(`${result.marked_read} notifications marked as read`);
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleArchive = async (notification_id) => {
    try {
      await archiveNotification(notification_id);
      setNotifications((prev) => prev.filter((n) => n.id !== notification_id));
      if (unreadCount > 0) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      toast.error("Failed to archive");
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    try {
      return format(new Date(isoString), "PPp");
    } catch {
      return isoString;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "critical": return "bg-destructive/10 text-destructive border-destructive/20";
      case "warning": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "critical": return <X className="h-4 w-4" />;
      case "warning": return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", unreadCount > 0 && "text-destructive")}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 max-h-[500px]" align="end" sideOffset={5}>
        <div className="flex flex-col">
          <DropdownMenuLabel className="flex items-center justify-between px-2 py-1">
            <span className="font-medium">Notifications</span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs px-2" onClick={handleMarkAllRead}>
                <Check className="mr-1 h-3 w-3" /> Mark all read
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ScrollArea className="h-[400px] w-full">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "p-3 rounded-lg border transition-colors hover:bg-muted/50",
                      !notif.read && "bg-primary/5 border-primary/20",
                      notif.read && "border-border/60"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0", getTypeColor(notif.type))}>
                        {getTypeIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("font-medium text-sm", !notif.read && "font-semibold")}>{notif.title}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(notif.created_at)}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{notif.message}</p>
                        {notif.action_url && notif.action_label && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-xs h-auto px-2"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = notif.action_url;
                              setOpen(false);
                            }}
                          >
                            <ExternalLink className="mr-1 h-3 w-3" />
                            {notif.action_label}
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {!notif.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-xs text-emerald-600 hover:bg-emerald-100"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMarkRead(notif.id);
                            }}
                            title="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleArchive(notif.id);
                          }}
                          title="Archive"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}