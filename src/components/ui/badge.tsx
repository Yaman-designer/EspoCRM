import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-[22px] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-all duration-250 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground",
        secondary:   "bg-secondary text-secondary-foreground border-border",
        outline:     "border-border text-foreground bg-transparent",
        ghost:       "bg-muted text-muted-foreground",
        destructive: "bg-[#FEF3F2] text-[#B42318]",
        success:     "bg-[#ECFDF3] text-[#027A48]",
        warning:     "bg-[#FFFAEB] text-[#B54708]",
        error:       "bg-[#FEF3F2] text-[#B42318]",
        info:        "bg-[#EFF8FF] text-[#0061BC]",
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
