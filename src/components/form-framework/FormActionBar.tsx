'use client'

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { ArrowRight, Check, ChevronLeft, Cloud, CloudOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useFormFramework } from './context'
import type { FormFrameworkPlugin } from './types'

interface FormActionBarProps {
  submitLabel?: string
  onSubmit?: () => void
  onCancel?: () => void
  /**
   * True when `onCancel` will actually discard an in-progress draft (i.e.
   * the caller supplied `onDiscardDraft` to FormFramework) — flips this
   * button's label from the generic "Cancel" to "Discard".
   * Default false so any other FormFramework consumer keeps today's plain
   * "Cancel" wording unless it opts in.
   */
  isDiscardAction?: boolean
  plugins?: FormFrameworkPlugin[]
  className?: string
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function timeAgo(date: Date, t: TFunction): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 5) return t('formFramework.actionBar.justNow')
  if (s < 60) return t('formFramework.actionBar.secAgo', { count: s })
  const m = Math.floor(s / 60)
  if (m < 60) return t('formFramework.actionBar.minAgo', { count: m })
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** Re-renders every 5s so "Saved 20 sec ago" keeps advancing without touching saveState itself. */
function useRelativeTimeTick(active: boolean) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick(t => t + 1), 5000)
    return () => clearInterval(id)
  }, [active])
}

function subscribeToConnectivity(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function useOnlineStatus() {
  return useSyncExternalStore(
    subscribeToConnectivity,
    () => navigator.onLine,
    () => true, // SSR snapshot — corrected on the client after hydration
  )
}

/**
 * Measures the bar's own rendered height (mobile 3-row stack vs. desktop/
 * tablet single row, both variable with content/safe-area) and publishes it
 * as a CSS var on the document root. `<main>` reads this var for its bottom
 * padding — so "enough clearance for the last field" is derived from what
 * the bar actually renders, not a guessed-and-hardcoded breakpoint number
 * that silently drifts out of sync (see FormFramework.tsx).
 */
function usePublishBarHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const publish = () => {
      document.documentElement.style.setProperty('--ff-action-bar-h', `${el.offsetHeight}px`)
    }
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(el)
    return () => {
      ro.disconnect()
      document.documentElement.style.removeProperty('--ff-action-bar-h')
    }
  }, [])
  return ref
}

type AutosaveTone = 'idle' | 'busy' | 'ok' | 'error' | 'warn'

const AUTOSAVE_TONE_TEXT: Record<AutosaveTone, string> = {
  idle:  'text-muted-foreground/50',
  busy:  'text-primary/70',
  ok:    'text-brand-emerald/75',
  error: 'text-destructive/70',
  warn:  'text-muted-foreground/70',
}

export function FormActionBar({
  submitLabel,
  onSubmit,
  onCancel,
  isDiscardAction = false,
  plugins = [],
  className,
}: FormActionBarProps) {
  const { t } = useTranslation('common')
  const ctx = useFormFramework()
  const {
    config,
    currentStepIndex,
    totalSteps,
    progressPercent,
    isAnimating,
    isSubmitting,
    isSubmitSuccess,
    saveState,
    goNext,
    goPrevious,
  } = ctx

  const isFirstStep = currentStepIndex === 0
  const isLastStep  = currentStepIndex === totalSteps - 1
  const disabled    = isAnimating || isSubmitting || isSubmitSuccess

  // progressPercent is the framework's one canonical progress value (see
  // FormFrameworkContextValue.progressPercent in types.ts) — this bar used
  // to compute its own `(currentStepIndex+1)/phaseTotal*100` from a
  // separate `config.totalPhasesCount` denominator that the header/stepper
  // never read, which is exactly how the header and footer ended up
  // showing two different numbers (12% vs 13%) for the same step. Both
  // `totalPhasesCount` and the per-step `completion` field the header used
  // to read have been retired — every surface now reads this one value.

  // Bounded, single-word label at every tier — this is what actually
  // removes truncation/max-w from the equation, not a breakpoint swap.
  // "Discard Draft" (the longer variant) is deliberately retired: it bought
  // nothing the header/dialog copy doesn't already say, and it's the string
  // that pushed several locales (Greek "Απόρριψη προσχεδίου") past the
  // width budget below.
  const cancelLabel = isDiscardAction ? t('formFramework.actionBar.discard') : t('formFramework.actionBar.cancel')

  const nextStep = config.steps[currentStepIndex + 1]

  // Full, descriptive destination — announced to assistive tech only
  // (aria-label). The visible label is always the short/bounded one below;
  // this is what used to force a max-w+truncate on the visible text.
  const ctaAnnouncement = submitLabel
    ?? (isLastStep
      ? (config.submitLabel ?? t('formFramework.actionBar.createRecord', { entity: config.entityLabel ?? t('formFramework.actionBar.record') }))
      : t('formFramework.actionBar.continueTo', { step: nextStep?.title ?? t('formFramework.actionBar.next') }))

  // Visible CTA label — short and bounded at every tier, so it never needs
  // to shrink or ellipsize. The destination name is already visible in the
  // stepper above; repeating it here is what created the unbounded-width
  // risk in the first place.
  const ctaLabel = submitLabel
    ?? (isLastStep
      ? (config.submitLabel ?? t('formFramework.actionBar.createRecord', { entity: config.entityLabel ?? t('formFramework.actionBar.record') }))
      : t('formFramework.actionBar.continue'))

  const isOnline = useOnlineStatus()
  useRelativeTimeTick(saveState.status === 'saved' || saveState.status === 'autosaved')

  const autosave = !isOnline
    ? { icon: CloudOff, label: t('formFramework.actionBar.offline'), tone: 'warn' as AutosaveTone, spin: false }
    : saveState.status === 'saving'
    ? { icon: Loader2, label: t('formFramework.actionBar.saving'), tone: 'busy' as AutosaveTone, spin: true }
    : saveState.status === 'saving_draft'
    ? { icon: Loader2, label: t('formFramework.actionBar.syncing'), tone: 'busy' as AutosaveTone, spin: true }
    : saveState.status === 'failed'
    ? { icon: CloudOff, label: t('formFramework.actionBar.syncFailed'), tone: 'error' as AutosaveTone, spin: false }
    : saveState.status === 'saved' || saveState.status === 'autosaved'
    ? { icon: Cloud, label: saveState.savedAt ? t('formFramework.actionBar.savedAt', { time: timeAgo(saveState.savedAt, t) }) : t('formFramework.actionBar.saved'), tone: 'ok' as AutosaveTone, spin: false }
    : saveState.status === 'unsaved'
    ? { icon: Cloud, label: t('formFramework.actionBar.unsavedChanges'), tone: 'idle' as AutosaveTone, spin: false }
    : { icon: Cloud, label: t('formFramework.actionBar.autoSave'), tone: 'idle' as AutosaveTone, spin: false }

  const AutosaveIcon = autosave.icon

  const pluginAddons = plugins.map(p => p.renderActionBarAddon?.(ctx)).filter(Boolean)

  const barRef = usePublishBarHeight<HTMLDivElement>()

  // ════════════════════════════════════════════════════════════════════
  // ARCHITECTURE — read this before touching Row 0/1/2 or the container
  // query below. Every decision here was made to survive a *specific*
  // failure mode this bar hit live, not a stylistic preference — each
  // block's own comment (further down) has the measured evidence; this
  // is the index so a future change doesn't have to reconstruct it.
  //
  // • Stacked (mobile) vs. unified (desktop) tier, not one shrinking row:
  //   Discard, the progress pill, Previous, and Continue each have a hard
  //   content floor — a translated label, an icon, a 44px touch target —
  //   none of which can compress further. Below ~720px of *panel* width
  //   those floors physically can't share one line without clipping a
  //   label or shrinking a button. The two tiers trade horizontal space
  //   for vertical space instead: 3 short rows on mobile vs. 1 wide row
  //   on desktop. It's a real markup fork, not a CSS reflow of the same
  //   markup, because which elements are *grouped* together differs
  //   between tiers (see the progress-cluster point below), not just
  //   their position.
  //
  // • Container queries (`@container/panel` / `@footer-row/panel`), not
  //   viewport breakpoints: this bar renders inside the dashboard's
  //   persistent sidebar, so viewport width and the panel's own rendered
  //   width diverge — confirmed live, a 768–1024px *viewport* still left
  //   the panel too narrow for the unified row once the sidebar took its
  //   share. Only the panel's own width can answer "does this tier fit,"
  //   so the query is scoped to the panel, never the window.
  //
  // • The progress cluster (hairline + percent/phase) is grouped with its
  //   own tight `gap-1.5`, separate from the looser `gap-3` before the
  //   action row: it's one piece of information — "where am I" — not
  //   three independent rows that happen to stack. Proximity is what
  //   tells the eye "these belong together"; the asymmetric gap is doing
  //   that job on purpose.
  //
  // • Row 1's `grid-cols-[1fr_auto_1fr]`, not `[auto_1fr_auto]`: Discard
  //   and the autosave icon aren't the same width, so two `auto` flanks
  //   center the phase readout in whatever space is left over between
  //   them, not in the row itself — a visible off-center drift. Two `1fr`
  //   flanks (each pinned to its edge via `justify-self-start`/`-end`)
  //   absorb the leftover space symmetrically, which is what actually
  //   centers the middle column regardless of how wide Discard vs. the
  //   icon happen to be.
  //
  // • Buttons never shrink, in either tier: exactly two fixed heights
  //   (mobile/compact) per button, never a fluid or interpolated scale,
  //   and every button/column carries an explicit content floor
  //   (`shrink-0`, `auto`/`max-content` columns, `whitespace-nowrap`). A
  //   44px touch target and a fully-readable label are the
  //   non-negotiables — when space runs out it's the *layout* that yields
  //   (Row 2 wraps Previous onto its own line; see that row's comment),
  //   never a button's own size or label.
  //
  // Do not "simplify" by: collapsing the two tiers into one responsive
  // row, swapping a container query here for a viewport breakpoint,
  // merging the progress cluster's gap into the outer row gap, reverting
  // Row 1 to `[auto_1fr_auto]`, or adding `truncate`/`max-w`/flex-shrink
  // to any button or label. Each of those has shipped before, broken a
  // specific real case (documented at its own site below), and been
  // reverted — what's here now is the fix, not an arbitrary choice.
  // ════════════════════════════════════════════════════════════════════

  /* ── Shared CTA/Previous content — icon + bounded label, always both
     fully rendered. No `truncate`, no `max-w`, no shrink weighting: the
     unified row's grid columns and the mobile row's flex tracks are both
     content-floored (`auto`/`shrink-0` for Previous, `max-content`-floored
     `1fr`/`flex-1` for Continue), so there's nothing here that ever needs
     to give up width — see Row 2's own comment below for how the mobile
     tier additionally handles the case where neither floor fits at all.
     `size` picks one of exactly two fixed heights (mobile-tier vs.
     unified-row-tier) — never a fluid/interpolated scale. ── */

  const ctaContent = (
    isSubmitting ? (
      <><Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />{t('formFramework.actionBar.saving')}</>
    ) : isSubmitSuccess ? (
      <><Check className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />{t('formFramework.actionBar.savedExclaim')}</>
    ) : isLastStep ? (
      <><Check className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden /><span>{ctaLabel}</span></>
    ) : (
      <>
        {isAnimating && <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />}
        <span>{ctaLabel}</span>
        {!isAnimating && (
          <ArrowRight
            className={cn(
              // `rtl:rotate-180` — same reasoning as ChevronLeft above:
              // "forward" points toward reading-end, which is visually left
              // in RTL, not right.
              'h-4 w-4 shrink-0 rtl:rotate-180 transition-transform duration-(--duration-medium) ease-(--ease-spring)',
              'motion-reduce:transition-none',
            )}
            aria-hidden
          />
        )}
      </>
    )
  )

  const ctaAriaLabel = isSubmitting
    ? t('formFramework.actionBar.saving')
    : isSubmitSuccess
    ? t('formFramework.actionBar.saved')
    : ctaAnnouncement

  function renderCtaButton(size: 'mobile' | 'compact') {
    return (
      <Button
        type="button"
        variant="default"
        onClick={isLastStep ? onSubmit : () => goNext()}
        disabled={disabled}
        // Presentation-only hook, not a second submit path: Step 08's
        // Review & Publish page's own "Create Property" affordance finds
        // and clicks whichever copy of this button is actually visible
        // (mobile or unified row), so it triggers this exact
        // handler/disabled-guard rather than duplicating submit logic.
        data-ff-submit-trigger={isLastStep ? true : undefined}
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl font-semibold tracking-[0.01em] whitespace-nowrap',
          'shadow-design-md hover:shadow-design-lg',
          size === 'mobile'
            // `flex-1`, not `w-full`: this button is a flex item in Row 2
            // now (see that row's comment), and `flex-1` is what makes it
            // fill *whatever* space is actually available to it — the
            // full row when it's alone (step 1, or Previous has wrapped
            // to its own line) or the remainder next to Previous when
            // both fit on one line. `w-full` would force 100% of the row
            // width even on the shared line, drawing Continue directly
            // over Previous.
            ? 'h-12 flex-1 rounded-2xl text-[13.5px]'
            : 'h-11 shrink-0 px-5 text-[13px]',
          isSubmitSuccess && 'ff-success-pulse bg-brand-emerald border-brand-emerald hover:bg-brand-emerald/90',
        )}
        aria-label={ctaAriaLabel}
      >
        {ctaContent}
      </Button>
    )
  }

  function renderPreviousButton(size: 'mobile' | 'compact') {
    return (
      <button
        type="button"
        onClick={() => goPrevious()}
        disabled={disabled}
        aria-label={t('formFramework.actionBar.previous')}
        className={cn(
          'group flex items-center justify-center gap-1.5 rounded-xl',
          'border border-border text-foreground/60',
          'shadow-design-xs transition-all duration-(--duration-medium) ease-(--ease-spring)',
          'hover:-translate-y-px hover:border-foreground/15 hover:bg-muted hover:text-foreground/90 hover:shadow-design-sm',
          'active:translate-y-0 active:shadow-design-xs',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20',
          'disabled:pointer-events-none disabled:opacity-35 disabled:shadow-none',
          'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
          size === 'mobile'
            // No `shrink-0`, no `whitespace-nowrap`, `min-h-12` not `h-12`:
            // this button is standalone on its own full-width flex line
            // whenever Row 2 wraps (see that row's comment) — nothing left
            // to share space with at that point. But its label can still,
            // in principle, be too long even for the full row width alone.
            // `shrink-0` would hold it at its unwrapped width regardless
            // (that's the point of `shrink-0` everywhere else in this
            // file) — here that would force the overflow straight into the
            // panel's `overflow-hidden` and clip it, the exact failure Row
            // 2 was rebuilt to eliminate for Continue. Leaving the default
            // `flex-shrink: 1` in place instead lets the flex algorithm
            // shrink the button down — bounded at its own min-content
            // width (its longest word), never an arbitrary number — and
            // once the box is narrower than the unwrapped label, the text
            // wraps into it and the button grows past `min-h-12` to fit.
            // No `max-width` anywhere: the ceiling is always this button's
            // own content, at whatever width the row actually has.
            ? 'min-h-12 rounded-2xl px-5 py-2 text-[13.5px] font-semibold'
            : 'h-11 shrink-0 whitespace-nowrap px-4 text-[12.5px] font-medium',
        )}
      >
        <ChevronLeft
          className={cn(
            // `rtl:rotate-180`: "Previous" points toward reading-start,
            // which is visually right in RTL, not left — a bare ChevronLeft
            // would silently point the wrong way once the app ever ships an
            // RTL locale (it doesn't yet — see the RTL audit note above the
            // return statement below). The hover nudge flips the same way
            // for the same reason: it should still nudge toward
            // reading-start, not toward a hardcoded physical left.
            'h-3.5 w-3.5 shrink-0 rtl:rotate-180 transition-transform duration-(--duration-medium) ease-(--ease-spring)',
            'group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0',
            // Matches the CTA ArrowRight's explicit guard below — the hover
            // nudge is already neutralized above (0 → 0, nothing to see
            // either way), but this also stops the rtl:rotate-180 direction
            // flip itself from animating on the rare dir-attribute change.
            'motion-reduce:transition-none',
          )}
          aria-hidden
        />
        {t('formFramework.actionBar.previous')}
      </button>
    )
  }

  return (
    <div
      ref={barRef}
      className={cn(
        'sticky bottom-0 z-30 px-3 sm:px-4 lg:px-6',
        'pt-0',
        // Safe-area is *added* to the resting gutter at every tier (matches
        // the convention already used by floating-utility-button.tsx) —
        // never merely reserved-for, so notch/home-indicator devices always
        // get true clearance under the bar's own controls.
        'pb-[calc(0.5rem+env(safe-area-inset-bottom))]',
        'sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
        'lg:pb-[calc(1rem+env(safe-area-inset-bottom))]',
        className,
      )}
      data-slot="form-action-bar"
    >
      <div
        className={cn(
          // `@container` lives HERE — on the wrapper that's always present
          // regardless of which tier below is showing — not on either tier
          // individually. The tier switch itself is a container query (see
          // `@footer-row:` below — backed by the `--container-footer-row`
          // token in globals.css, not a hardcoded pixel value here), so the
          // container that decides "which tier" can't be one of the things
          // being decided between; it has to be their shared ancestor. This
          // is also what makes the switch correct when this component sits
          // inside the dashboard's own persistent sidebar: a 768px
          // *viewport* with a ~220px sidebar leaves this panel only ~548px,
          // and a viewport-based `md:` breakpoint has no way to know that —
          // confirmed live, it rendered the unified row into a container
          // ~220px too narrow for it and the nav cluster visually
          // overlapped the progress pill. Sizing off the panel's own
          // rendered width fixes that structurally instead of re-guessing a
          // viewport number.
          '@container/panel overflow-hidden rounded-3xl border border-border/10 @footer-row/panel:rounded-2xl @footer-row/panel:border-border/40',
          'bg-background/93 @footer-row/panel:bg-background/97 backdrop-blur-2xl',
          // Upward-facing elevation (bar sits at the bottom, so the lift has to read
          // *above* it) — the --shadow-* scale is authored for downward card elevation,
          // so this negative-y case stays a deliberate, documented exception to it.
          'shadow-[0_-1px_0_rgba(16,24,40,0.04),0_-4px_12px_rgba(16,24,40,0.07),0_-20px_48px_rgba(16,24,40,0.08)]',
          '@footer-row/panel:shadow-[0_-2px_20px_rgba(16,24,40,0.07),0_4px_24px_rgba(16,24,40,0.10)]',
        )}
      >

        {/* ══════════════════════════════════════════════════════════════
            STACKED TIER — shown whenever the panel's own rendered width is
            below `--container-footer-row` (720px — see globals.css for the
            token and the measurement its buffer is based on). A
            *container* query on `@container/panel`, not a viewport
            breakpoint: this is what makes it correct inside the sidebar
            layout at any viewport. 3-row Grid, intrinsic sizing.

            Row 0  edge-to-edge progress hairline   ─┐ tight gap-1.5: one
            Row 1  [Discard] ·· Phase 03/08 ·· [sync] ┘ scannable "where am I" group
            Row 2  grid-cols-[auto_1fr]: [Previous] [——— Continue ———]
                   (Previous omitted on step 1 — Continue alone fills the row)

            Row 0+1 sit inside their own gap-1.5 sub-grid, separated from Row 2
            by the outer gap-3 — deliberately tighter within the progress
            cluster than between it and the actions below, so proximity itself
            signals "these two belong together" instead of all three rows
            reading as one undifferentiated stack.

            Previous is ALWAYS a real labeled button here, never an icon-only
            square: the old icon-only treatment on this tier was the direct
            cause of the "buttons become icons" defect. Grid's `auto` column
            gives it a content-floored width (can't be compressed further)
            and the `1fr` column gives Continue the rest of the row with the
            same floor — neither button can shrink past its own label. ── */}
        <div className="grid gap-3 pt-0 @footer-row/panel:hidden">

          <div className="grid gap-1.5">

            {/* Row 0 — progress hairline, full width, rounds with the panel */}
            <div
              className="h-1 w-full overflow-hidden bg-border/30"
              role="progressbar"
              aria-valuenow={Math.round(progressPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('formFramework.actionBar.formCompletion')}
            >
              <div
                // `rounded-e-full` (logical), not `rounded-r-full`: this fill
                // grows from the inline-start edge by default block flow (no
                // extra rtl: needed for that part — it's already
                // direction-aware), so its rounded leading cap has to track
                // the same logical "end" edge, or it'd round the wrong
                // physical corner once the fill is flowing right-to-left.
                // `motion-reduce:transition-none`: the stepper's equivalent
                // progress fills (`.ff-connector-fill`, `.ff-mobile-progress`
                // in globals.css) already disable their width transition under
                // reduced motion — this footer fill used plain Tailwind
                // utilities instead of one of those shared classes, and had
                // no reduced-motion guard of its own. Width jumps instantly to
                // the new value instead of animating there.
                className="h-full rounded-e-full bg-primary transition-[width] duration-(--duration-large) ease-(--ease-premium) motion-reduce:transition-none"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Row 1 — Discard (left) · Phase (center) · autosave (right).
                `grid-cols-[1fr_auto_1fr]`, not `[auto_minmax(max-content,1fr)_auto]`:
                Discard (text button) and the autosave icon are very
                different intrinsic widths, so two `auto` flanks left the
                center column centered in whatever space was left over
                between them, not in the row — the phase readout visibly
                drifted off true-center. Two equal `1fr` flanks (each
                pinned to its own edge via `justify-self-start`/`-end`)
                absorb the leftover space symmetrically instead, so the
                `auto` center column lands exactly in the middle regardless
                of how wide Discard vs. the sync icon happen to be.
                Same anti-truncation guarantee as before, just redistributed:
                a `<flex>` track's automatic minimum is content-based (the
                same free floor `auto` tracks get) as long as the item's own
                `overflow` stays `visible` — true here, so Discard and the
                autosave zone still can't be crushed past their own content,
                same as when they were `auto` columns. The center `auto`
                column keeps the same guarantee it already had; it never
                relied on `minmax(max-content,1fr)` — `whitespace-nowrap` on
                the span was what actually protected it. */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={disabled}
                className={cn(
                  // `text-muted-foreground` at full opacity, not the previous
                  // /45 — axe-core flagged this at 1.80:1 against the panel
                  // background (needs 4.5:1 for 11.5px/500 text). The base
                  // --muted-foreground token itself only clears 4.5:1 by a
                  // ~0.1 margin at 100% opacity (measured), so stacking any
                  // further opacity reduction on top of an already-muted color
                  // was what pushed it below AA, not the color choice itself —
                  // the color alone still reads as secondary/quiet against
                  // full-strength text elsewhere in the bar.
                  'flex h-11 shrink-0 items-center justify-self-start rounded-lg px-2 text-[11.5px] font-medium whitespace-nowrap text-muted-foreground',
                  'transition-colors duration-(--duration-medium) ease-(--ease-premium) hover:bg-muted/50 hover:text-foreground/70',
                  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20',
                  'disabled:pointer-events-none disabled:opacity-30',
                )}
              >
                {cancelLabel}
              </button>

              {/* Percentage + phase, paired the same way the unified row pairs
                  them (`13%  ·  PHASE 01/08`) — the mobile tier previously
                  dropped the numeral and kept only the phase label, leaving
                  the row-0 hairline as the sole progress readout. A 4px hairline
                  communicates *that* progress exists, not *how much* — the
                  numeral is what a thumb-scrolling user actually reads at a
                  glance, so it belongs beside the phase label, not only in the
                  unified/desktop row. */}
              <span className="flex items-baseline justify-center gap-1.5 whitespace-nowrap text-center">
                <span className="text-[11px] font-extrabold tabular-nums text-foreground/70">
                  {Math.round(progressPercent)}%
                </span>
                <span className="h-2.5 w-px shrink-0 bg-border/40" aria-hidden />
                {/* `text-muted-foreground` at full opacity — same axe-core
                    contrast fix as Discard above (this span measured 2.26:1
                    at the previous /55). */}
                <span className="text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground">
                  {t('formFramework.actionBar.phase', { current: pad2(currentStepIndex + 1), total: pad2(totalSteps) })}
                </span>
              </span>

              <div className="flex h-11 shrink-0 items-center justify-self-end" aria-live="polite">
                <span className="sr-only">{autosave.label}</span>
                {pluginAddons.length > 0 && (
                  <div className="me-1 flex items-center gap-2">
                    {pluginAddons.map((addon, i) => <span key={i}>{addon}</span>)}
                  </div>
                )}
                <AutosaveIcon
                  className={cn('h-3.5 w-3.5', AUTOSAVE_TONE_TEXT[autosave.tone], autosave.spin && 'animate-spin')}
                  aria-hidden
                />
              </div>
            </div>
          </div>

          {/* Row 2 — actions: Previous + Continue, via `flex-wrap`, not a
              grid `auto`/`minmax(max-content,1fr)` split.

              The grid version guaranteed neither button could shrink below
              its own label, but had no answer for the case where *both*
              labels' full widths plus the gap exceed the row's available
              width: grid's `auto`/`max-content` floors don't yield, so the
              row's own intrinsic minimum grows past the panel — and the
              panel's `overflow-hidden` (load-bearing elsewhere, for
              content that's genuinely supposed to clip) silently ate
              whatever fell off the trailing edge. In LTR that's Continue:
              confirmed live, an unusually long Previous label at a
              375px/320px viewport left ~80% of Continue's box clipped and
              non-interactive, with no visible symptom — no scrollbar, no
              wrap, no ellipsis — to signal it. A translator writing one
              long word for "Previous" is all it takes; nothing here
              should depend on them not doing that.

              `flex-wrap` fixes this at the layout engine, not with a
              measured breakpoint: Previous stays `shrink-0`
              (content-floored, same guarantee as before) and Continue is
              `flex-1` (fills remaining space, floored at its own
              min-content width by the same `overflow: visible` automatic
              minimum the comment above this function documents). When
              both floors don't fit on one line, the browser — not a
              buffered pixel constant that needs remeasuring — wraps
              Continue onto its own line, where being the row's sole item
              makes it fill the full width, same as the step-1 case where
              there's no Previous to share with. Previous, alone on the
              line above it, keeps its natural content width rather than
              stretching to match: it's still the secondary action, and
              matching Continue's width would overstate it. Correct for a
              label of any length, in any language, with no remeasurement
              ever required. */}
          <div className="flex flex-wrap items-center gap-3 px-3 pb-2.5">
            {!isFirstStep && renderPreviousButton('mobile')}
            {renderCtaButton('mobile')}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            UNIFIED ROW — shown whenever the panel is ≥`--container-footer-row`
            wide (the `@footer-row/panel` container-query variant, defined
            in globals.css's `@theme` block — not a hardcoded pixel value
            here, so there is exactly one place to update if this row's
            content ever changes enough to need remeasuring). That token's
            own comment documents the measurement: a headless max-content
            probe of this row's three zones at their widest real case
            (Discard + full progress pill + Previous + Continue) found
            682px as the true never-overlap minimum (`--footer-min-inline-size`);
            the token adds a ~38px buffer over it for font-metric/locale
            variance.

            grid-cols-[auto_minmax(max-content,1fr)_auto]
            [Discard]   ··   [autosave · progress · phase]   ··   [Previous][Continue]

            Every column is content-floored — the outer two are `auto`
            (Grid's built-in equivalent of flexbox's `min-width:auto`), and
            the center is `minmax(max-content,1fr)`, NOT `minmax(0,1fr)`.
            That distinction is load-bearing: a `0` minimum legally lets
            Grid crush the center column to nothing while the pill inside
            it (deliberately `shrink-0`, so its own content never shrinks)
            keeps its full width — the column shrinks, the content doesn't,
            and the result is silent overlap, not a visible failure. That
            exact bug reproduced live in this row before the fix, at
            exactly the 768px-viewport/sidebar-narrowed case the container
            query above now routes around entirely. `max-content` as the
            floor means the column can never be asked to be smaller than
            what its content actually needs — if it ever were, the row
            would overflow visibly instead of overlapping invisibly.

            One fixed spacing scale, not a `lg:` viewport ladder: the tier
            switch is already container-driven, so a second, independently
            viewport-driven spacing scale on top of it would just be a new
            seam for the two to drift out of sync with each other. ── */}
        <div className="hidden @footer-row/panel:grid grid-cols-[auto_minmax(max-content,1fr)_auto] items-center gap-4 px-6 py-3.5">

          {/* ── Status zone — Discard + addons. `auto` column: content-floored. ── */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={disabled}
              className={cn(
                // See the mobile Discard button's comment for why this is
                // `text-muted-foreground` (full opacity) and not `/45` —
                // axe-core measured this exact combination at 1.80:1 against
                // the panel background (needs 4.5:1).
                'flex h-11 shrink-0 items-center rounded-lg px-3 text-[12.5px] font-medium whitespace-nowrap',
                'text-muted-foreground transition-colors duration-(--duration-medium) ease-(--ease-premium)',
                'hover:bg-muted/50 hover:text-foreground/70',
                'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20',
                'disabled:pointer-events-none disabled:opacity-35',
              )}
            >
              {cancelLabel}
            </button>
            {pluginAddons.map((addon, i) => <span key={i} className="shrink-0">{addon}</span>)}
          </div>

          {/* ── Progress zone — center column, the only flexible track.
              Every piece of text here is short and fixed; only the track
              itself scales continuously via `cqw`/`clamp()`. ── */}
          <div className="flex items-center justify-center gap-2.5">
            <div className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-border/18 bg-muted/22 px-4 py-2">
              <div className="flex shrink-0 items-center" aria-live="polite">
                <span className="sr-only">{autosave.label}</span>
                <AutosaveIcon
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 transition-colors duration-(--duration-medium) ease-(--ease-premium)',
                    AUTOSAVE_TONE_TEXT[autosave.tone],
                    autosave.spin && 'animate-spin',
                  )}
                  aria-hidden
                />
              </div>

              <span className="h-3 w-px shrink-0 bg-border/25" aria-hidden />

              <div className="flex shrink-0 items-center gap-2">
                <div
                  className="h-1.5 w-[clamp(1.75rem,7cqw,6rem)] overflow-hidden rounded-full bg-border/40"
                  role="progressbar"
                  aria-valuenow={Math.round(progressPercent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t('formFramework.actionBar.formCompletion')}
                >
                  <div
                    // Same reduced-motion gap and fix as the mobile
                    // hairline fill above.
                    className="h-full rounded-full bg-primary transition-[width] duration-(--duration-large) ease-(--ease-premium) motion-reduce:transition-none"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {/* text-foreground/55 measured 3.87:1 (needs 4.5:1) — unlike
                    muted-foreground, `--foreground` has enough headroom
                    (16.24:1 at full opacity) that a moderate opacity bump is
                    enough; /70 clears 4.5:1 with margin without needing to
                    go anywhere near 100%.
                    font-extrabold, not font-bold: matches the mobile tier's
                    percentage weight (Row 1 above) so the numeral reads as
                    the one clear headline of the cluster and the STEP label
                    beside it reads as its caption — was font-bold here only,
                    an unintentional cross-tier drift that let the two
                    compete at near-equal weight instead of one leading. */}
                <span className="shrink-0 text-[10px] font-extrabold tabular-nums whitespace-nowrap text-foreground/70">
                  {Math.round(progressPercent)}%
                </span>
              </div>

              <span className="h-3 w-px shrink-0 bg-border/25" aria-hidden />

              {/* text-muted-foreground/60 measured 2.26:1 — same fix and
                  reasoning as the Discard button above.
                  No `aria-label` override (there used to be one, giving an
                  unpadded "Phase 2/8" instead of the visible padded
                  "Phase 02/08" to avoid AT pronouncing the leading zero) —
                  axe-core correctly flags `aria-label` on a plain `<span>`
                  as unreliable (a roleless span isn't guaranteed to expose
                  a name override at all, per the ARIA-in-HTML spec, so
                  support is inconsistent across AT). The visible text is
                  always exposed regardless, and "oh-two" vs "two" is a
                  trivial verbosity difference, not worth depending on
                  cross-AT support for a name override to get right. */}
              <span className="shrink-0 text-[9.5px] font-bold whitespace-nowrap uppercase tracking-widest text-muted-foreground">
                {t('formFramework.actionBar.phase', { current: pad2(currentStepIndex + 1), total: pad2(totalSteps) })}
              </span>
            </div>
          </div>

          {/* ── Nav zone — `auto` column: content-floored, can never be
              compressed past Previous + Continue's own rendered width. ── */}
          <div className="flex shrink-0 items-center gap-2">
            {!isFirstStep && renderPreviousButton('compact')}
            {renderCtaButton('compact')}
          </div>
        </div>

      </div>
    </div>
  )
}
