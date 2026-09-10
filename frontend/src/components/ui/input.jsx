import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, "aria-invalid": ariaInvalid, ...props }, ref) => {
  return (
    <input
      type={type}
      aria-invalid={ariaInvalid}
      className={cn(
        "flex h-11 min-h-[44px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors duration-fast file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-muted-foreground/40 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive/20 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Input.displayName = "Input"

export { Input }
