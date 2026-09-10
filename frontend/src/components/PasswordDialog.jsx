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
import { useLang } from "../i18n/LanguageContext";

export default function PasswordDialog({ open, onOpenChange, onSubmit, url, incorrect }) {
  const { t } = useLang();
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
      <DialogContent data-testid="password-dialog" className="bg-surface-raised border-border">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <DialogTitle>
            {incorrect ? t("pwd.titleBad") : t("pwd.titleLock")}
          </DialogTitle>
          <DialogDescription>
            {incorrect ? t("pwd.descBad") : t("pwd.descLock")}
          </DialogDescription>
        </DialogHeader>
        {incorrect && (
          <div
            className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            data-testid="password-incorrect-hint"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {t("pwd.hint")}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            autoFocus
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder={t("pwd.ph")}
            data-testid="password-input"
            className="h-10 bg-surface-overlay border-border"
          />
          {url && (
            <div className="line-clamp-1 rounded-lg border border-border bg-surface-overlay/50 px-3 py-2 font-mono text-xs text-muted-foreground">
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
              {t("pwd.cancel")}
            </Button>
            <Button type="submit" disabled={!pwd.trim()} data-testid="password-submit-btn">
              {incorrect ? t("pwd.retry") : t("pwd.unlock")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
