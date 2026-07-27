import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Button } from "./ui/button";
import { History as HistoryIcon, Trash2, X, Play, Star } from "lucide-react";
import { getSessionId } from "../lib/session";
import { getHistory, clearHistory, deleteHistoryItem, getFavorites, deleteFavorite } from "../services/api";
import { toast } from "sonner";

export default function HistoryDrawer({ open, onOpenChange, mode = "history", onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const sessionId = getSessionId();
  const isFav = mode === "favorites";

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = isFav ? await getFavorites(sessionId) : await getHistory(sessionId);
        if (mounted) setItems(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, isFav, sessionId]);

  const handleClearAll = async () => {
    if (isFav) return;
    try {
      await clearHistory(sessionId);
      setItems([]);
      toast.success("History cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  };

  const handleDelete = async (id) => {
    try {
      if (isFav) await deleteFavorite(id, sessionId);
      else await deleteHistoryItem(id, sessionId);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.error("Failed to delete item");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-md overflow-y-auto p-0 sm:max-w-md"
        data-testid={isFav ? "favorites-drawer" : "history-drawer"}
      >
        <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background px-6 py-4 text-left">
          <SheetTitle className="flex items-center gap-2">
            {isFav ? <Star className="h-5 w-5 text-primary" /> : <HistoryIcon className="h-5 w-5 text-primary" />}
            {isFav ? "Favorites" : "Recent Links"}
          </SheetTitle>
          <SheetDescription>
            {isFav
              ? "Your saved TeraBox links."
              : "The last links you've analyzed. Stored on this device."}
          </SheetDescription>
          {!isFav && items.length > 0 && (
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={handleClearAll} data-testid="clear-history-btn">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Clear all
              </Button>
            </div>
          )}
        </SheetHeader>

        <div className="space-y-2 px-4 py-4">
          {loading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
          {!loading && items.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {isFav ? "No favorites yet." : "No history yet."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Paste a link on the home screen to get started.
              </p>
            </div>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors duration-200 hover:border-primary/60"
              data-testid="history-item"
            >
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Play className="h-5 w-5" />
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  onSelect?.(item.url);
                  onOpenChange?.(false);
                }}
                className="flex-1 text-left"
                data-testid="history-open-btn"
              >
                <div className="line-clamp-1 text-sm font-medium">{item.title || item.url}</div>
                <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {item.size_str ? `${item.size_str} · ` : ""}
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="rounded-lg p-2 text-muted-foreground opacity-0 transition-colors duration-200 hover:bg-secondary hover:text-foreground group-hover:opacity-100"
                aria-label="Delete"
                data-testid="history-delete-btn"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
