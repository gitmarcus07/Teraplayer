import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Layers } from "lucide-react";

/**
 * QualityPicker
 * Renders a resolution picker if there are multiple video files that likely
 * represent different qualities of the same content.
 */
export default function QualityPicker({ options, value, onChange }) {
  if (!options || options.length < 2) return null;

  return (
    <div className="flex items-center gap-2" data-testid="quality-picker">
      <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">Quality</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 w-[180px] bg-surface-raised border-border" data-testid="quality-trigger">
          <SelectValue placeholder="Choose quality" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.id} value={opt.id} data-testid={`quality-option-${opt.id}`}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
