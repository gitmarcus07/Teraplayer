import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow hover:bg-primary/90 active:bg-primary/95 data-[loading=true]:opacity-80 data-[error=true]:bg-destructive data-[error=true]:text-destructive-foreground",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/95",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-secondary hover:text-foreground hover:border-muted-foreground/40 active:bg-secondary/80",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:text-foreground active:bg-secondary/70",
        ghost: "hover:bg-secondary hover:text-foreground active:bg-secondary/80",
        link: "text-primary underline-offset-4 hover:underline rounded-md min-h-0",
      },
      size: {
        default: "h-10 min-h-[44px] px-4 py-2",
        sm: "h-9 min-h-[36px] rounded-lg px-3 text-xs",
        lg: "h-12 min-h-[48px] rounded-2xl px-8 text-base",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
