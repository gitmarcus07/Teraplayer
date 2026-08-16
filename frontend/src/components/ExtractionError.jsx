import { motion } from "framer-motion";
import { AlertTriangle, Link2, RotateCw } from "lucide-react";
import { Button } from "./ui/button";
import { ERROR_CATEGORIES, ERROR_COPY } from "../utils/errorHandling";

// Consistent error presentation for the core extraction flow.
//
// `error` is the object produced by classifyPreviewError() in utils/errorHandling.js.
// The original URL is never cleared by this component — retry re-uses the same
// sanitized URL passed by the parent.
export default function ExtractionError({ error, onRetry, onCheckLink }) {
  const copy = (error && ERROR_COPY[error.category]) || ERROR_COPY[ERROR_CATEGORIES.UNKNOWN];
  const isInvalid = error && error.category === ERROR_CATEGORIES.INVALID_LINK;
  const handleAction = isInvalid ? onCheckLink : onRetry;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto mb-6 max-w-3xl rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-destructive sm:mb-10 sm:p-6"
      role="alert"
      aria-live="polite"
      data-testid="extraction-error error-panel"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{copy.title}</div>
          <p className="mt-1 text-sm opacity-90">
            {isInvalid && error.showRaw && error.raw ? error.raw : copy.description}
          </p>
          <Button
            className="mt-3"
            size="sm"
            variant="outline"
            onClick={handleAction}
            data-testid="extraction-error-action"
          >
            {isInvalid ? (
              <>
                <Link2 className="mr-1.5 h-4 w-4" />
                {copy.actionLabel}
              </>
            ) : (
              <>
                <RotateCw className="mr-1.5 h-4 w-4" />
                {copy.actionLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}