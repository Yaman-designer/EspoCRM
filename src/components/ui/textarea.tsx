import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-xl border border-border/70 bg-transparent px-4 py-3 text-base outline-none",
        "caret-primary shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200",
        "placeholder:text-muted-foreground/50",
        "hover:border-border/90 hover:shadow-[0_1px_4px_rgba(16,24,40,0.07)]",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:shadow-[0_1px_4px_rgba(16,24,40,0.06)]",
        "disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
