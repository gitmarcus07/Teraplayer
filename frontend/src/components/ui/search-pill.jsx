import * as React from "react"
import { cn } from "@/lib/utils"
import { Search, ChevronDown, Calendar, Users } from "lucide-react"

/**
 * @typedef {Object} SearchPillProps
 * @property {string} [className]
 * @property {string} [placeholder]
 * @property {Function} [onClick]
 * @property {Array<{label: string, placeholder: string, icon: React.ReactNode}>} [segments]
 */

export function SearchPill({
  className,
  placeholder = "Where to?",
  onClick,
  segments = [
    { label: "Where", placeholder: "Where to?", icon: <Search className="w-4 h-4" /> },
    { label: "When", placeholder: "Add dates", icon: <Calendar className="w-4 h-4" /> },
    { label: "Who", placeholder: "Add guests", icon: <Users className="w-4 h-4" /> },
  ],
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "search-bar-pill w-full flex items-center gap-0",
        className
      )}
      aria-label="Search"
    >
      {segments.map((segment, index) => (
        <React.Fragment key={segment.label}>
          <div className="search-field-segment flex items-center gap-2 min-w-0">
            {segment.icon && (
              <span className="text-muted flex-shrink-0" aria-hidden="true">
                {segment.icon}
              </span>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-caption text-muted uppercase tracking-wider">{segment.label}</span>
              <span className="text-body-sm text-ink truncate font-cereal">
                {segment.placeholder}
              </span>
            </div>
          </div>
          {index < segments.length - 1 && (
            <div className="w-px h-10 bg-hairline mx-2" aria-hidden="true" />
          )}
        </React.Fragment>
      ))}
      <div className="search-orb ml-2 flex-shrink-0" aria-hidden="true">
        <Search className="w-6 h-6" />
      </div>
    </button>
  )
}

/**
 * @typedef {Object} SearchOrbProps
 * @property {string} [className]
 * @property {Function} [onClick]
 * @property {string} [aria-label]
 */

export function SearchOrb({ className, onClick, "aria-label": ariaLabel = "Search" }: SearchOrbProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("search-orb", className)}
      aria-label={ariaLabel}
    >
      <Search className="w-6 h-6" />
    </button>
  )
}

export function SearchFieldSegment({
  label,
  placeholder,
  icon,
  className,
}) {
  return (
    <div className={cn("search-field-segment flex items-center gap-2 flex-1 min-w-0", className)}>
      {icon && <span className="text-muted flex-shrink-0" aria-hidden="true">{icon}</span>}
      <div className="flex flex-col min-w-0">
        <span className="text-caption text-muted uppercase tracking-wider">{label}</span>
        <span className="text-body-sm text-ink truncate font-cereal">{placeholder}</span>
      </div>
    </div>
  )
}