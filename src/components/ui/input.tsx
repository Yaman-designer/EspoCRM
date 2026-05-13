import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-lg border border-border bg-input px-4 py-1",
        "text-sm text-foreground transition-all duration-250 outline-none",
        "placeholder:text-muted-foreground",
        "hover:border-border/70",
        "focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/12",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20",
        "dark:bg-input dark:border-border",
        className
      )}
      {...props}
    />
  )
}

export { Input }
