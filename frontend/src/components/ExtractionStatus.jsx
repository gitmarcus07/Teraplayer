import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Film } from "lucide-react";
import { useLang } from "../i18n/LanguageContext";

const LONG_WAIT_MS = 8000;

// Loading state for the core extraction flow.
//
// Reserves the same footprint as the PreviewCard (aspect-video media tile +
// a few metadata lines) so the transition into the result does not jump the
// layout. No fake progress percentages — just a clear branded status.
export default function ExtractionStatus() {
  const { t } = useLang();
  const [longWait, setLongWait] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setLongWait(true), LONG_WAIT_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto mb-6 max-w-[650px] sm:mb-8"
      role="status"
      aria-live="polite"
      data-testid="extraction-status"
    >
      <div className="md:mx-auto md:max-w-[470px]">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface-raised">
          <div className="relative aspect-video w-full overflow-hidden bg-surface-overlay">
            <div className="absolute inset-0 bg-secondary shimmer" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/25 px-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md">
                <Loader2 className="h-6 w-6 animate-spin" />
              </span>
              <div className="text-center">
                <div className="font-display text-base font-semibold text-white sm:text-lg">
                  {t("ex.prep")}
                </div>
                <p className="mt-1 text-xs text-white/80">
                  {longWait ? t("ex.still") : t("ex.resolving")}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-3.5">
            <div className="h-5 w-2/3 animate-pulse rounded-full bg-secondary shimmer" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-14 animate-pulse rounded-lg bg-secondary shimmer" />
              <div className="h-14 animate-pulse rounded-lg bg-secondary shimmer" />
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
              <Film className="h-3 w-3" />
              <span className="tracking-wide">TeraPlayer</span>
            </div>
            <div className="h-12 w-full animate-pulse rounded-xl bg-secondary shimmer" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}