import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap",
    "border border-transparent rounded-lg",
    "transition-all duration-250 ease-in-out",
    "outline-none select-none",
    "focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:border-ring/60",
    "active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        /* ── Base variants ── */
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-px shadow-design-sm hover:shadow-design-md",
        outline:
          "bg-card border-border text-foreground hover:bg-muted hover:border-border/70 dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground border-border hover:bg-muted hover:-translate-y-px",
        ghost:
          "text-muted-foreground hover:bg-accent/60 hover:text-primary",
        destructive:
          "bg-brand-crimson-soft text-brand-crimson border-brand-crimson/20 hover:bg-brand-crimson/15",
        link: "text-primary underline-offset-4 hover:underline",
        /* ── Brand solid variants ── */
        emerald:
          "bg-brand-emerald   text-white hover:bg-brand-emerald/90   hover:-translate-y-px shadow-design-sm hover:shadow-design-md",
        azure:
          "bg-brand-azure     text-white hover:bg-brand-azure/90     hover:-translate-y-px shadow-design-sm hover:shadow-design-md",
        teal:
          "bg-brand-teal      text-white hover:bg-brand-teal/90      hover:-translate-y-px shadow-design-sm hover:shadow-design-md",
        lavender:
          "bg-brand-lavender  text-white hover:bg-brand-lavender/90  hover:-translate-y-px shadow-design-sm hover:shadow-design-md",
        navy:
          "bg-brand-navy      text-white hover:bg-brand-navy/90      hover:-translate-y-px shadow-design-sm hover:shadow-design-md",
        crimson:
          "bg-brand-crimson   text-white hover:bg-brand-crimson/90   hover:-translate-y-px shadow-design-sm hover:shadow-design-md",
        /* ── Brand soft/outline variants ── */
        "emerald-soft":
          "bg-brand-emerald-soft  text-brand-emerald  hover:bg-brand-emerald/15",
        "azure-soft":
          "bg-brand-azure-soft    text-brand-azure    hover:bg-brand-azure/15",
        "teal-soft":
          "bg-brand-teal-soft     text-brand-teal     hover:bg-brand-teal/15",
        "lavender-soft":
          "bg-brand-lavender-soft text-brand-lavender hover:bg-brand-lavender/15",
        "navy-soft":
          "bg-brand-navy-soft     text-brand-navy     hover:bg-brand-navy/15",
        "crimson-soft":
          "bg-brand-crimson-soft  text-brand-crimson  hover:bg-brand-crimson/15",
      },
      size: {
        default:   "h-12 px-[22px] text-sm",
        xs:        "h-7  px-3 text-xs rounded-[10px]",
        sm:        "h-9  px-4 text-sm rounded-[10px]",
        lg:        "h-14 px-7 text-base",
        icon:      "size-10",
        "icon-xs": "size-7  rounded-[10px]",
        "icon-sm": "size-9  rounded-[10px]",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
