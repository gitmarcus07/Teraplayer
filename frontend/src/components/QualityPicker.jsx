import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Layers } from "lucide-react";
import { compactSize } from "../utils/format";
import { useLang } from "../i18n/LanguageContext";

/**
 * QualityPicker
 * Renders a resolution picker if there are multiple video files that likely
 * represent different qualities of the same content.
 */
export default function QualityPicker({ options, value, onChange }) {
  const { t } = useLang();
  if (!options || options.length < 2) return null;

  const labelFor = (opt) => {
    const size =
      (typeof opt?.file?.size === "number" && opt.file.size > 0 && compactSize(opt.file.size)) ||
      opt?.file?.size_str ||
      "";
    return size ? `${opt.label} · ~${size}` : opt.label;
  };

  return (
    <div className="flex items-center gap-2" data-testid="quality-picker">
      <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">{t("qp.label")}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className="h-10 w-[180px] bg-surface-raised border-border"
          data-testid="quality-trigger"
          aria-label={t("qp.aria")}
        >
          <SelectValue placeholder={t("qp.ph")} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.id} value={opt.id} data-testid={`quality-option-${opt.id}`} title={opt.label}>
              {labelFor(opt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
