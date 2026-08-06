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
        /* Premium secondary pass (2026-07-25). Was hover:border-border/70 —
           that *lowers* opacity on an already-pale border, so hover read as
           less defined, not more. Flipped to hover:border-foreground/15 so
           the border gains definition instead of fading. Also picked up the
           lift/shadow/icon-motion treatment every other variant already has
           (default/secondary/emerald/…) — outline was the one left flat.
           Icon shift scoped to :last-child only: outline is reused in
           pagination controls with opposing-direction arrows and in forms
           with leading icons, so a blanket [&_svg] shift would push a
           "back" arrow the wrong way. */
        outline:
          "bg-card border-border text-foreground shadow-design-xs " +
          "hover:bg-muted hover:border-foreground/15 hover:-translate-y-px hover:shadow-design-sm " +
          "active:translate-y-0 active:shadow-design-xs " +
          "dark:bg-input/30 dark:hover:bg-input/50 " +
          "transition-all duration-(--duration-medium) ease-(--ease-spring) " +
          "[&_svg]:transition-transform [&_svg]:duration-(--duration-medium) [&_svg]:ease-(--ease-spring) [&:hover_svg:last-child]:translate-x-0.5 " +
          "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 motion-reduce:[&:hover_svg]:translate-x-0",
        secondary:
          "bg-secondary text-secondary-foreground border-border hover:bg-muted hover:-translate-y-px",
        ghost:
          "text-muted-foreground hover:bg-accent/60 hover:text-primary",
        destructive:
          "bg-brand-crimson-soft text-brand-crimson border-brand-crimson/20 hover:bg-brand-crimson/15",
        link: "text-primary underline-offset-4 hover:underline",
        /* ── Elevated surface — high-emphasis secondary CTA ──
           Not filled (no solid bg-primary), not ghost (has a visible surface
           at rest), not outline (tinted, not bare card background). A tinted
           primary surface just under `outline`'s emphasis, for actions that
           need to stand out without competing with a real primary action on
           the same screen (e.g. "Full Specifications" beside a page that has
           no other primary CTA in view). Overrides base's font-medium →
           font-semibold and duration-250/ease-in-out → the standard
           card-lift token/ease-out, both via tailwind-merge (this string is
           concatenated after the base classes, then the whole thing passes
           through `cn()`). */
        surface:
          "bg-primary/7 text-primary font-semibold border-primary/25 " +
          // hover:shadow-design-sm looks right but is dead CSS: shadow-design-*
          // are hand-written plain classes in globals.css (not declared via
          // Tailwind v4's `@utility`), so the JIT engine can't generate a
          // `hover:` variant for them — confirmed via the compiled output,
          // zero `hover\:shadow-design-*` rules exist anywhere in this app.
          // shadow-[var(--shadow-md)] is Tailwind's native arbitrary-value
          // syntax, fully variant-capable, pointing at the exact same design
          // token. Pre-existing bug in every other variant using this
          // pattern (default/emerald/azure/…) — out of scope to fix here,
          // flagged rather than silently expanded into. Rest state bumped
          // sm→md's floor (shadow-design-sm) and hover one tier above that
          // (shadow-md) — Specifications Section pass (2026-07-25): this is
          // a reusable "elevated surface" variant, so it needs to consistently
          // out-rank a plain info-tile's shadow-design-xs, not match it.
          "shadow-design-sm hover:shadow-[var(--shadow-md)] " +
          "hover:bg-primary/10 hover:border-primary/35 hover:-translate-y-px active:translate-y-0 " +
          // ease-(--ease-premium), not Tailwind's built-in `ease-out` — a
          // different, unrelated curve (cubic-bezier(0,0,.2,1) vs this
          // token's cubic-bezier(.4,0,.2,1)). --ease-premium is this app's
          // own "standard deceleration" token (see globals.css) — the actual
          // existing motion token an ease-out feel maps to here.
          "transition-all duration-(--duration-standard) ease-(--ease-premium) " +
          "[&_svg]:transition-transform [&_svg]:duration-(--duration-standard) [&_svg]:ease-(--ease-premium) [&:hover_svg]:translate-x-0.5 " +
          // Reduced-motion guards live on the variant itself, not at each call
          // site — `surface` is meant to be reused by future CTAs (per its own
          // brief), and the base Button classes don't carry these, so a
          // consumer that forgets to add them locally would silently ship an
          // inaccessible button. Scoped to this one variant's string, not
          // base — doesn't touch `default`/`outline`/etc.
          "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 motion-reduce:[&:hover_svg]:translate-x-0",
        /* ── Ink — the one "special occasion" CTA surface ──
           A high-value secondary action that needs to command attention
           without borrowing `default`'s real primary-blue (would misread as
           "the page's main action" and compete with an actual primary CTA
           elsewhere) and without looking like every other neutral secondary
           control (`outline`/`secondary`). Monochrome fill on
           `foreground`/`background` — both already-declared semantic
           tokens, not new colors — the same "one crisp dark button in an
           otherwise light, colorful UI" convention Linear/Vercel/Stripe
           reserve for their single most consequential secondary action.
           Hierarchy comes from contrast + craftsmanship (shadow escalation,
           lift, icon motion), never from hue. No border at rest — a border
           drawn over a solid fill is over-articulation; the edge against
           the surrounding card *is* the fill. Motion mirrors `surface`'s
           timing (standard/premium — the more deliberate, "considered" feel
           vs outline's snappier spring) since this sits a tier above it.
           First use: PropertySpecsBar's "Full Specifications" (2026-07-26
           premium redesign — supersedes that button's prior
           surface→outline de-emphasis pass; this is a deliberate reversal,
           not a regression). */
        ink:
          "bg-foreground text-background font-semibold tracking-tight gap-2.5 border-transparent " +
          "shadow-design-sm hover:shadow-design-md active:shadow-design-xs " +
          "hover:bg-foreground/90 active:bg-foreground " +
          "hover:-translate-y-px active:translate-y-0 " +
          "transition-all duration-(--duration-standard) ease-(--ease-premium) " +
          "[&_svg]:transition-transform [&_svg]:duration-(--duration-standard) [&_svg]:ease-(--ease-premium) [&:hover_svg]:translate-x-0.5 " +
          "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 motion-reduce:[&:hover_svg]:translate-x-0",
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
