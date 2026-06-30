import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-xl border border-border/70 bg-input px-4 py-1",
        "text-sm text-foreground caret-primary shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200 outline-none",
        "placeholder:text-muted-foreground/50",
        "hover:border-border/90 hover:shadow-[0_1px_4px_rgba(16,24,40,0.07)]",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:shadow-[0_1px_4px_rgba(16,24,40,0.06)]",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "dark:bg-input dark:border-border",
        className
      )}
      {...props}
    />
  )
}

export { Input }
