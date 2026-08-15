import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Puzzle,
  ShieldAlert,
} from "lucide-react";
import { Button } from "./ui/button";
import { EXT_STATUS } from "../services/extension";

const META = {
  [EXT_STATUS.CREATING]: { title: "Preparing browser extraction", icon: Loader2, spin: true },
  [EXT_STATUS.OPENING]: { title: "Opening TeraBox", icon: ExternalLink, spin: false },
  [EXT_STATUS.EXTRACTING]: { title: "Extracting link", icon: Loader2, spin: true },
  [EXT_STATUS.VERIFICATION]: { title: "Verification required", icon: ShieldAlert, spin: false },
  [EXT_STATUS.DONE]: { title: "Extraction complete", icon: CheckCircle2, spin: false },
  [EXT_STATUS.ERROR]: { title: "Extraction failed", icon: AlertTriangle, spin: false },
  [EXT_STATUS.EXTENSION_REQUIRED]: { title: "Browser extension required", icon: Puzzle, spin: false },
  [EXT_STATUS.IDLE]: { title: "Browser extraction", icon: Loader2, spin: false },
};

export default function ExtensionStatus({ status, message, onRetry, retrying = false }) {
  const meta = META[status] || META[EXT_STATUS.IDLE];
  const Icon = meta.icon;

  const showRetry =
    status === EXT_STATUS.VERIFICATION ||
    status === EXT_STATUS.ERROR ||
    status === EXT_STATUS.EXTENSION_REQUIRED;

  const isTone =
    status === EXT_STATUS.VERIFICATION ||
    status === EXT_STATUS.ERROR ||
    status === EXT_STATUS.EXTENSION_REQUIRED;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`mx-auto mb-6 max-w-3xl rounded-2xl border p-4 sm:p-5 ${
        isTone ? "border-amber-500/40 bg-amber-500/10" : "border-border bg-surface-raised"
      }`}
      data-testid="extension-status"
    >
      <div className="flex items-start gap-3">
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${meta.spin ? "animate-spin" : ""} ${
            isTone ? "text-amber-500" : "text-primary"
          }`}
        />
        <div className="flex-1">
          <div className="font-semibold">{meta.title}</div>
          {message && <p className="mt-1 text-sm opacity-90">{message}</p>}

          {status === EXT_STATUS.VERIFICATION && (
            <p className="mt-1 text-xs opacity-70">
              TeraBox will never be automated — complete the verification yourself, then retry.
            </p>
          )}

          {status === EXT_STATUS.EXTENSION_REQUIRED && (
            <p className="mt-1 text-xs opacity-70">
              Install the TeraPlayer browser extension and make sure you are logged into TeraBox
              in this browser.
            </p>
          )}

          {showRetry && onRetry && (
            <Button
              className="mt-3"
              size="sm"
              variant={status === EXT_STATUS.ERROR ? "outline" : "default"}
              onClick={onRetry}
              disabled={retrying}
              data-testid="extension-retry-btn"
            >
              {retrying ? "Retrying…" : "Retry"}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
