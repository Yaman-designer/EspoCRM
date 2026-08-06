'use client'

import { useRef, useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getWebAssetUrl, FALLBACK_IMAGE } from '@/lib/image-url'
import { useSlidingIndicator } from '@/hooks/use-sliding-indicator'
import { handleRovingTabListKeyDown } from '../../lib/keyboard-nav'
import { SectionHeader, MediaLightbox } from '@/components/shared'
import type { AssetsViewModel, AssetTab } from '../../view-models/assets.viewmodel'
import { PhotosTab } from './PhotosTab'
import { LegalTab } from './LegalTab'

// Same Camera/FileText iconography PhotosTab.tsx / LegalTab.tsx already use
// for these two categories elsewhere in this feature — not a new visual
// vocabulary, just carried up into the tab trigger itself.
const TAB_ICONS: Record<AssetTab, ComponentType<{ className?: string }>> = {
  photos: Camera,
  legal: FileText,
}

// Asset Management UX Architecture pass (2026-07-21). Floor Plans and Drone
// were removed — verified live against EspoCRM's own Metadata endpoint
// (/api/espo/Metadata?scopes[]=RealEstateProperty, all 209 RealEstateProperty
// fields and links checked) that there is no field, link, or attachment slot
// of any kind backing either category. Unlike Photos/Legal (both zero on
// some records, but genuinely populatable), these two could never contain
// real data under the current data model — keeping them would mean a
// permanently non-functional tab, which the product decision (confirmed)
// was to remove rather than disguise as a disabled "coming soon" feature.
//
// Enterprise architecture pass (2026-07-23). Was 828 lines / 7 components in
// one file. Now: this orchestrator (tabs, lightbox state), plus PhotosTab.tsx
// and LegalTab.tsx (their own files), plus the fullscreen viewer promoted to
// the shared, entity-agnostic `MediaLightbox` primitive
// (src/components/shared/MediaLightbox.tsx — was `AssetLightbox`, defined
// right here, with zero real Property coupling even before the move).
// Field selection, image-attachment detection, gallery ordering, and tab
// counts all arrive pre-shaped via `AssetsViewModel` — this component takes
// the ViewModel directly, never `RealEstateProperty` (container-builds-
// ViewModel pattern, consistent with Financial/Timeline/Operations; see
// PropertyDetailView.tsx, which now owns the `buildAssetsViewModel(property)` call).

interface AssetManagementSystemProps {
  viewModel: AssetsViewModel
  /** Media Gallery Consistency pass (2026-07-24). Replaces this component's
   *  own local `lightboxIndex` state for the Photos tab specifically —
   *  owned by PropertyDetailView now, shared byte-for-byte with the Hero
   *  banner's own carousel/lightbox, so a tile clicked here and the Hero
   *  banner's own "View full screen" open the exact same viewer at the
   *  exact same index. The Legal tab's own image viewer is deliberately
   *  NOT part of this — a legal document image was never part of "the
   *  gallery" Hero represents, and stays its own separate, local state
   *  below, unchanged. */
  onPhotoIndexChange: (index: number) => void
  onPhotoLightboxOpenChange: (open: boolean) => void
  /** Shared focus-restore target for the Photos tab specifically — see
   *  PropertyDetailView.tsx's own `mediaTriggerRef` note. This component no
   *  longer renders a Lightbox for Photos at all; PropertyDetailView renders
   *  the single shared instance and reads this ref back on close. */
  photoTriggerRef: React.RefObject<HTMLElement | null>
}

export function AssetManagementSystem({
  viewModel, onPhotoIndexChange, onPhotoLightboxOpenChange, photoTriggerRef,
}: AssetManagementSystemProps) {
  const { t } = useTranslation('properties')
  const {
    photoIds: allIds, documents, documentAssignment,
    legalImageIds, legalImageIndexById, legalTotalCount, tabs, refCode,
  } = viewModel

  const [activeTab, setActiveTab] = useState<AssetTab>('photos')
  const [errored, setErrored] = useState<Set<string>>(new Set())

  const tabIds = tabs.map(t => t.id)
  const { containerRef, registerItem, rect: indicatorRect } = useSlidingIndicator(activeTab, tabIds)

  // Explicit focus-restore, not left to Radix's own default. Verified this
  // session (against unmodified, pre-existing code, not something this pass
  // introduced) that once this section is on the page, Dialog's automatic
  // return-focus-to-trigger behavior silently fails page-wide — reproduced
  // even on the stock Hero gallery lightbox, with zero of this section's own
  // Dialog code involved. Root cause sits outside this file (likely page-
  // level focus-guard/sticky-sidebar interaction in PropertyDetailView) and
  // is out of this task's scope to chase down. Capture the exact trigger
  // element when a tile is clicked into the shared `photoTriggerRef` —
  // PropertyDetailView's single MediaLightbox instance focuses it back
  // explicitly via Dialog's onCloseAutoFocus instead of depending on the
  // broken default.
  function openLightbox(index: number) {
    photoTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    onPhotoIndexChange(index)
    onPhotoLightboxOpenChange(true)
  }

  // Legal Attachments pass (2026-07-21). A second, independent instance of
  // the same state/viewer pattern used for Photos above — never mixed into
  // `allIds`, since a legal document image is not a gallery photo and the
  // gallery must only ever contain real gallery photos.
  const [legalImageIndex, setLegalImageIndex] = useState<number | null>(null)
  const legalImageTriggerRef = useRef<HTMLElement | null>(null)
  function openLegalImage(index: number) {
    legalImageTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setLegalImageIndex(index)
  }

  function resolve(id: string | null | undefined, size: 'small' | 'medium' | 'large' = 'medium'): string {
    if (!id || errored.has(id)) return FALLBACK_IMAGE
    return getWebAssetUrl(id, size)
  }
  function onErr(id: string) {
    setErrored(s => new Set([...s, id]))
  }

  const refSubtitle = refCode ? `#${refCode}` : undefined

  return (
    <section className="space-y-4">

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <SectionHeader
          title={t('assets.title')}
          subtitle={t('assets.subtitle')}
        />

        {/* Interaction Design Sprint 4: real ARIA tablist — arrow keys move
            and activate, only the active tab sits in the Tab order.
            Enterprise Motion Design pass (2026-07-24): the active state
            glides to the selected tab via a shared absolutely-positioned
            pill (useSlidingIndicator) instead of the fill just appearing on
            whichever button was clicked.
            Premium segmented-control pass (2026-07-25): container is now a
            recessed neutral track (foreground tint, not a literal color —
            reads correctly regardless of page background) instead of a
            bordered white bar; the sliding pill is an elevated `bg-card`
            surface with a real shadow instead of a flat `bg-primary` fill,
            so the active tab reads as "the selected surface", matching this
            pass's iOS/Linear/Stripe reference set rather than a colored-tab
            pattern.
            Contrast verification pass (2026-07-25): checked computed styles
            under both `light` and `dark` prefers-color-scheme emulation —
            byte-identical (this app has no dark palette yet; every token
            here is single-value), so no theme-specific adjustment applies.
            Measured flat-color luminance between the track and the white
            pill was a thin ~1.16:1 — real but relying almost entirely on
            shadow rendering to read as elevated. Deepened the track tint
            (--foreground opacity 3.5%→8%) and moved the pill's border/shadow
            up one existing tier (border-border/40→60, shadow-design-sm→md)
            so the separation holds even where shadow rendering is weak,
            still with zero new color/shadow tokens.
            Visual-hierarchy pass (2026-07-25b): 8% read as a dark, dense
            panel that competed with the content instead of receding behind
            it — the opposite problem from the original 3.5% (too little
            separation from the page). Landed the track at `/4` — halfway
            back toward the original, still enough tint to read as a
            distinct surface, but quiet enough that the elevated `bg-card`
            pill (border/shadow untouched) now supplies essentially all of
            the "this one is active" signal, matching the light/quiet-track
            pattern this pass's iOS/Linear/Stripe/Arc/Vercel reference set
            actually uses (they lean on the pill's border+shadow against a
            near-flat backdrop, not on a dark backdrop). Bumped the inactive-
            tab hover tint `/4`→`/6` so it stays a visible step above the
            new, lighter resting track instead of collapsing to the same
            value — still zero new color/shadow tokens, this app still has
            no dark palette to re-verify against (see the pass above). */}
        <nav
          ref={containerRef}
          role="tablist"
          aria-label={t('assets.categoryLabel')}
          className="relative flex gap-1 rounded-xl bg-foreground/4 p-1 shrink-0"
          onKeyDown={e => handleRovingTabListKeyDown(e, tabIds, activeTab, id => setActiveTab(id as AssetTab))}
        >
          {indicatorRect && (
            <span
              aria-hidden="true"
              className={cn(
                'absolute left-0 top-0 rounded-lg border border-border/60 bg-card shadow-design-md',
                'transition-[transform,width,height] duration-(--duration-large) ease-(--ease-spring)',
                'motion-reduce:transition-none'
              )}
              style={{
                transform: `translate(${indicatorRect.x}px, ${indicatorRect.y}px)`,
                width: indicatorRect.width,
                height: indicatorRect.height,
              }}
            />
          )}
          {tabs.map(tab => {
            const active = activeTab === tab.id
            const Icon = TAB_ICONS[tab.id]
            return (
              <button
                key={tab.id}
                ref={registerItem(tab.id)}
                type="button"
                role="tab"
                id={`asset-tab-${tab.id}`}
                data-tab-id={tab.id}
                aria-selected={active}
                aria-controls="asset-tab-panel"
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative z-10 flex min-h-11 items-center gap-2 rounded-lg px-3.5 text-[13px] font-semibold tracking-tight',
                  'sm:min-h-9 sm:px-3 sm:text-[12.5px]',
                  'transition-[color,background-color,transform] duration-(--duration-medium) ease-(--ease-premium)',
                  'active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/6'
                )}
              >
                <Icon className={cn('size-3.5 shrink-0', active ? 'text-primary' : 'text-muted-foreground/70')} />
                {tab.label}
                <span className={cn(
                  'inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-md px-1 text-[10px] font-semibold tabular-nums',
                  'transition-colors duration-(--duration-medium) ease-(--ease-premium) motion-reduce:transition-none',
                  active ? 'bg-primary/10 text-primary' : 'bg-foreground/5 text-muted-foreground'
                )}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      <div id="asset-tab-panel" role="tabpanel" aria-labelledby={`asset-tab-${activeTab}`} className="h-120">
        {activeTab === 'photos' && (
          <PhotosTab allIds={allIds} resolve={resolve} onErr={onErr} onOpen={openLightbox} />
        )}
        {activeTab === 'legal' && (
          <LegalTab
            documents={documents}
            documentAssignment={documentAssignment}
            legalTotalCount={legalTotalCount}
            legalImageIndexById={legalImageIndexById}
            resolve={resolve}
            onErr={onErr}
            onOpenImage={openLegalImage}
          />
        )}
      </div>

      {/* Media Gallery Consistency pass (2026-07-24): the Photos fullscreen
          viewer that used to render here is gone — this tab is now a pure
          trigger (`openLightbox` above writes into the shared
          `photoTriggerRef` and calls the shared `onPhotoIndexChange`/
          `onPhotoLightboxOpenChange` setters). The single shared
          `<MediaLightbox>` instance for Photos is rendered once, by
          PropertyDetailView, and reused by the Hero banner's own trigger —
          "never create a second Lightbox" means exactly one instance in the
          tree, not two instances kept in sync. */}

      {/* Same viewer, reused (not re-implemented) for image-type Legal
          attachments — a separate ids array and state so a legal document
          image never enters the Photos gallery. */}
      <MediaLightbox
        ids={legalImageIds}
        resolve={resolve}
        onErr={onErr}
        openIndex={legalImageIndex}
        onOpenChange={open => { if (!open) setLegalImageIndex(null) }}
        onNavigate={setLegalImageIndex}
        triggerRef={legalImageTriggerRef}
        subtitle={refSubtitle}
        category={t('assets.tabs.legal')}
      />

    </section>
  )
}
