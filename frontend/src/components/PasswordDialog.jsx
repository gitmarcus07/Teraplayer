import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { KeyRound, AlertCircle } from "lucide-react";

export default function PasswordDialog({ open, onOpenChange, onSubmit, url, incorrect }) {
  const [pwd, setPwd] = useState("");

  useEffect(() => {
    if (open) setPwd("");
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pwd.trim()) return;
    onSubmit?.(pwd);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="password-dialog">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <DialogTitle>
            {incorrect ? "Incorrect password" : "This link is password protected"}
          </DialogTitle>
          <DialogDescription>
            {incorrect
              ? "The password you entered didn't work. Please try again."
              : "Enter the share password to continue. The password is only sent to the extraction service."}
          </DialogDescription>
        </DialogHeader>
        {incorrect && (
          <div
            className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            data-testid="password-incorrect-hint"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Wrong password. Double-check for typos or trailing spaces.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            autoFocus
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Share password"
            data-testid="password-input"
          />
          {url && (
            <div className="line-clamp-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 font-mono text-xs text-muted-foreground">
              {url}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              data-testid="password-cancel-btn"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!pwd.trim()} data-testid="password-submit-btn">
              {incorrect ? "Try again" : "Unlock link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
