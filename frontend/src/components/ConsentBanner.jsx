import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Cookie, Settings, ShieldCheck, Sparkles, X } from "lucide-react";
import { Button } from "./ui/button";
import { useLang } from "../i18n/LanguageContext";

const CONSENT_KEY = "teraplayer-consent";

export default function ConsentBanner() {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);

  useEffect(() => {
    let value = null;
    try {
      value = localStorage.getItem(CONSENT_KEY);
    } catch {
      /* storage unavailable */
    }
    if (value === null) setVisible(true);
  }, []);

  const choose = (choice) => {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      /* storage unavailable */
    }
    setVisible(false);
    if (choice === "accepted") {
      window.__tpInitGtag?.();
      window.__tpInitPosthog?.();
      window.__tpInitAdsense?.();
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[2147483647] flex items-end justify-center"
      style={{ zIndex: 2147483647 }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/60" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("consent.dialogAria")}
        data-testid="consent-banner"
        className="relative mb-4 w-full max-w-[520px] overflow-hidden rounded-[24px] border border-primary/10 bg-surface-raised shadow-[0_24px_80px_-16px_rgba(0,0,0,0.85)] sm:mb-5"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-28"
          style={{
            background:
              "radial-gradient(70% 100% at 50% 0%, hsl(217 100% 55% / 0.1), transparent 75%)",
          }}
        />
        <div className="relative max-h-[calc(100dvh-2rem)] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/15 text-primary ring-1 ring-primary/20">
              <Cookie className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <h2 className="font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
              {t("consent.title")}
            </h2>
          </div>

          <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
            {t("consent.bodyA")}{" "}
            <Link
              to="/privacy"
              className="font-medium text-primary hover:underline"
            >
              {t("consent.privacyLink")}
            </Link>
          </p>

          {customizing && (
            <div className="mt-3.5 space-y-2.5 rounded-2xl border border-border/50 bg-surface/80 p-3.5">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-foreground">{t("consent.analyticsT")}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {t("consent.analyticsB")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-foreground">{t("consent.adsT")}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {t("consent.adsB")}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Button
              size="lg"
              variant="outline"
              className="h-10 border-border/60 bg-transparent px-5 text-xs font-semibold uppercase tracking-wider text-foreground/90 hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
              aria-expanded={customizing}
              onClick={() => setCustomizing((value) => !value)}
            >
              <Settings aria-hidden="true" />
              {customizing ? t("consent.hide") : t("consent.customize")}
            </Button>
            <Button
              size="lg"
              className="h-10 px-5 text-xs font-semibold uppercase tracking-wider text-white shadow-lg shadow-primary/30 hover:bg-primary/90 hover:text-white"
              onClick={() => choose("accepted")}
            >
              <Check strokeWidth={2.5} aria-hidden="true" />
              {t("consent.accept")}
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div aria-hidden="true" className="h-px flex-1 bg-border/40" />
            <button
              type="button"
              onClick={() => choose("declined")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {t("consent.decline")}
            </button>
            <div aria-hidden="true" className="h-px flex-1 bg-border/40" />
          </div>
          <p className="mt-2.5 text-center text-[11px] text-muted-foreground/60">
            {t("consent.essential")}
          </p>
        </div>
      </div>
    </div>
  );
}