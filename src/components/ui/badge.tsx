import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-[22px] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-all duration-250 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        /* ── Base variants ── */
        default:     "bg-primary text-primary-foreground",
        secondary:   "bg-secondary text-secondary-foreground border-border",
        outline:     "border-border text-foreground bg-transparent",
        ghost:       "bg-muted text-muted-foreground",
        destructive: "bg-brand-crimson-soft text-brand-crimson",
        success:     "bg-brand-emerald-soft text-brand-emerald",
        warning:     "bg-chart-4/15 text-chart-4",
        error:       "bg-brand-crimson-soft text-brand-crimson",
        info:        "bg-brand-azure-soft text-brand-azure",
        /* ── Brand status variants ── */
        won:         "bg-brand-emerald-soft  text-brand-emerald",
        negotiating: "bg-brand-azure-soft    text-brand-azure",
        "new-lead":  "bg-brand-teal-soft     text-brand-teal",
        "on-process":"bg-brand-lavender-soft text-brand-lavender",
        visit:       "bg-brand-navy-soft     text-brand-navy",
        cancelled:   "bg-brand-crimson-soft  text-brand-crimson",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
