import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const CONSENT_KEY = "teraplayer-consent";

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

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
      role="dialog"
      aria-label="Privacy consent"
      className="fixed inset-x-4 bottom-4 mx-auto max-w-xl rounded-2xl border border-border/70 bg-surface-raised/95 p-4 shadow-2xl shadow-black/40 sm:left-4 sm:right-auto"
      style={{ zIndex: 2147483647 }}
      data-testid="consent-banner"
    >
      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
        We use lightweight analytics (PostHog, Google Analytics) and may show ads
        (Google AdSense) to keep TeraPlayer free.{" "}
        <Link to="/privacy" className="font-medium text-primary hover:underline">
          Privacy Policy
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => choose("accepted")}>
          Accept
        </Button>
        <Button size="sm" variant="ghost" onClick={() => choose("declined")}>
          Decline
        </Button>
      </div>
    </div>
  );
}
