// Layout Architecture pass (2026-07-25). This page's horizontal gutter used
// to be set twice, unaware of each other: DashboardShell's own `<main>`
// (`p-4 sm:p-5 md:p-6` — every dashboard page's shared padding, 16/20/24px,
// flat from `md` up) plus PropertyDetailView's `PAGE_PADDING_X` on top of it
// (`px-4 sm:px-5 md:px-6 lg:px-7 xl:px-8`), duplicated a second time in
// RelatedPropertiesSection.tsx by hand. Nested inside DashboardShell's
// already-padded `<main>`, the two stacked instead of composing: combined
// edge inset reached 56px at `xl`+ (24 + 32) with nowhere left to grow for
// wider tiers, which is what actually produced the "too constrained" desktop
// feel — not any single value being wrong on its own.
//
// Fixed by treating DashboardShell's padding as this page's baseline gutter
// and having this constant add ONLY the supplemental room larger viewports
// can afford, instead of a full independent scale that re-covers the small
// breakpoints DashboardShell already handles. `min-[1440px]:`/`min-[1920px]:`
// are real arbitrary-value breakpoints (Tailwind v4, no theme/config change),
// used here because the brief's Desktop/Ultra-wide tiers start at 1440/1920
// — neither aligns with Tailwind's default scale (`xl`=1280, `2xl`=1536),
// and forcing them onto the nearest default tier would put the step in the
// wrong place rather than genuinely fixing it.
//
// Combined with DashboardShell's own padding, total edge inset becomes:
//   <640      16px (DashboardShell alone)
//   640–767   20px (DashboardShell alone)
//   768–1279  24px (DashboardShell alone — one flat value across the whole
//                    Tablet tier the brief describes, not a per-step scale)
//   1280–1439 32px (24 + this constant's 8px)
//   1440–1919 40px (24 + 16px)
//   1920+     48px (24 + 24px) — the remaining "avoid large empty margins"
//                    lever at this tier is PropertyDetailView's own
//                    `max-w-450` cap (1800px, up from 1600px), not padding;
//                    a 1920px+ monitor doesn't need a wider gutter, it needs
//                    a wider content box.
//
// Single exported constant, not two independently hand-copied literals —
// PropertyDetailView.tsx and RelatedPropertiesSection.tsx both import this
// rather than each defining their own copy of the same scale. The two were
// identical strings maintained by hand in two files before this pass; the
// next edit to either one is exactly how they'd have drifted apart.
export const PAGE_PADDING_X = 'min-[1280px]:px-2 min-[1440px]:px-4 min-[1920px]:px-6'
