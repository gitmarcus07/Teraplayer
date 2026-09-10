import { Languages } from "lucide-react";
import { useLang } from "../i18n/LanguageContext";

/**
 * LegalNotice — shown atop Privacy Policy and Terms of Service.
 * The binding legal text stays in English; this translated banner says so.
 */
export default function LegalNotice() {
  const { t, lang } = useLang();
  if (lang === "en") return null;
  return (
    <p
      data-testid="legal-language-notice"
      className="mx-auto mt-4 flex max-w-xl items-center justify-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-medium text-indigo-700"
    >
      <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {t("legal.notice")}
    </p>
  );
}
