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
import { useLang } from "../i18n/LanguageContext";

const META = {
  [EXT_STATUS.CREATING]: { titleKey: "ext.creating", icon: Loader2, spin: true },
  [EXT_STATUS.OPENING]: { titleKey: "ext.opening", icon: ExternalLink, spin: false },
  [EXT_STATUS.EXTRACTING]: { titleKey: "ext.extracting", icon: Loader2, spin: true },
  [EXT_STATUS.VERIFICATION]: { titleKey: "ext.verify", icon: ShieldAlert, spin: false },
  [EXT_STATUS.DONE]: { titleKey: "ext.done", icon: CheckCircle2, spin: false },
  [EXT_STATUS.ERROR]: { titleKey: "ext.error", icon: AlertTriangle, spin: false },
  [EXT_STATUS.EXTENSION_REQUIRED]: { titleKey: "ext.required", icon: Puzzle, spin: false },
  [EXT_STATUS.IDLE]: { titleKey: "ext.idle", icon: Loader2, spin: false },
};

export default function ExtensionStatus({ status, message, onRetry, retrying = false }) {
  const { t } = useLang();
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
          <div className="font-semibold">{t(meta.titleKey)}</div>
          {message && <p className="mt-1 text-sm opacity-90">{t(message)}</p>}

          {status === EXT_STATUS.VERIFICATION && (
            <p className="mt-1 text-xs opacity-70">
              {t("ext.verifyNote")}
            </p>
          )}

          {status === EXT_STATUS.EXTENSION_REQUIRED && (
            <p className="mt-1 text-xs opacity-70">
              {t("ext.extNote")}
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
              {retrying ? t("ext.retrying") : t("ext.retry")}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
