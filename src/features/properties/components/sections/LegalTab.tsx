'use client'

import Image from 'next/image'
import { FileText, Download, CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getFileDownloadUrl } from '@/lib/image-url'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared'
import { isImageAttachment, getAttachmentTypeLabel } from '@/shared/detail-view'
import type { DocumentAssignmentRef, PropertyDocument } from '../../view-models/assets.viewmodel'

// Enterprise Motion Design pass (2026-07-24). Row hover/press/focus and the
// download control's own micro-interaction both draw from the shared motion
// tokens in globals.css (--duration-*/--ease-*) — see that file's "Motion
// tokens" block for the full scale and rationale. Two deliberate departures
// from a literal reading of the brief, both accessibility-motivated:
//  - the download affordance is dimmed by default and brightens on
//    hover/focus, never fully invisible-until-hover — an opacity-0 default
//    would make it undiscoverable for touch/switch-access users who never
//    trigger :hover.
//  - the download button's "pressed" feedback is a scale + soft glow, not a
//    literal Material ripple — explicitly out per the brief's own Part 6
//    ("reject... material ripple overload").
//
// Mobile UX pass (2026-07-24). The thumbnail/icon tile (was h-9 w-9, 36px)
// and the download button (was h-8 w-8, 32px) were two visibly different
// sizes in the same row — real visual-rhythm inconsistency, not a hover/
// press gap. Both are now `size-10` (40px): matches each other, and matches
// the icon-tile size this app already uses elsewhere (Command Hub's agent
// avatar) rather than introducing a new scale. A literal 44px WCAG target
// was considered and rejected — it would be a new, larger tile size found
// nowhere else in this design system.
//
// Equal Visual Weight pass (2026-07-25). The cDocumentassignment row used to
// render through its own branch with a primary-tinted border/background/icon
// and its own `DownloadAction` "assignment" variant — structurally pinned
// above the scrollable `documents` list, too. That made the first row read
// as selected/highlighted by construction, not by accident. Both are now
// normalized into one `DocRow` shape and rendered through a single
// `DocumentRow` component from one shared row list — same container, same
// scroll behavior, same border/background/icon/download styling, no variant
// prop. Rows now differ only by content. Metadata (type badge, upload date)
// is real data only: the `Document` entity's live-confirmed shape (see
// document.repository.ts) has no size or verification-status field, so
// neither is rendered rather than invented. The document-assignment field
// has no filename or date of its own (`DocumentAssignmentRef` is `{ id,
// name }`), which is why that row's subtitle is the literal relationship
// label "Document Assignment" and it carries no date chip — an honest gap,
// not a layout bug; row height is governed by the 40px icon tile, not by
// which text lines happen to be present.
const ROW_TRANSITION = 'transition-[background-color,border-color,box-shadow] duration-(--duration-standard) ease-(--ease-premium) motion-reduce:transition-none'
const ROW_HOVER = 'hover:border-border hover:bg-muted/20 hover:shadow-design-sm focus-within:border-border focus-within:bg-muted/20 focus-within:shadow-design-sm'
const ROW_SHELL = 'group/row flex items-center gap-3 rounded-xl border border-border/60 bg-muted/10 p-3 shadow-design-xs'

// Property Details Completion (2026-07-17). Previously always rendered the
// empty state below regardless of real data — `documents` was never even
// fetched server-side (see [slug]/page.tsx's withDocuments). Now renders the
// real related Document records: preview (name/fileName), metadata
// (publishDate), and download (via /api/espo-file, binary-safe).
//
// Enterprise architecture pass (2026-07-23): split out of
// AssetManagementSystem.tsx into its own file — same component, same
// behavior, no visual change.

interface LegalTabProps {
  documents: PropertyDocument[]
  documentAssignment: DocumentAssignmentRef | null
  legalTotalCount: number
  // Legal Attachments pass (2026-07-21), enterprise architecture pass
  // (2026-07-23): O(1) fileId → position-in-shared-viewer lookup, replacing
  // a `.findIndex()` that used to run inside this component's render loop.
  legalImageIndexById: Record<string, number>
  resolve:      (id: string | null | undefined, size?: 'small' | 'medium' | 'large') => string
  onErr:        (id: string) => void
  onOpenImage:  (index: number) => void
}

// One normalized shape for both the cDocumentassignment field and each
// `documents` relation record — see the Equal Visual Weight pass note above.
interface DocRow {
  id: string
  title: string
  subtitle: string
  typeLabel: string
  publishDate: string | null | undefined
  thumbnailId: string
  isImage: boolean
  imageIndex: number
  downloadUrl: string | null | undefined
  downloadName: string | undefined
}

// Unconditional at every call site — `href` may be null/undefined, in which
// case this renders a real disabled control at the exact same `size-10`
// footprint instead of the caller omitting the element entirely. A row with
// no download link previously had a shorter trailing edge than every other
// row, which is what actually made rows read as inconsistent.
function DownloadAction({ href, download, label }: {
  href: string | null | undefined
  download: string | undefined
  label: string
}) {
  const { t } = useTranslation('properties')
  if (!href) {
    return (
      <button
        type="button"
        disabled
        aria-label={t('assets.legalTab.downloadUnavailable', { label })}
        className="flex size-10 shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-border/30 text-muted-foreground/25"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
    )
  }

  return (
    <a
      href={href}
      download={download}
      aria-label={label}
      className={cn(
        'group/dl relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/40 text-muted-foreground/60',
        'opacity-70 group-hover/row:opacity-100 group-focus-within/row:opacity-100 hover:opacity-100 hover:border-primary/40 hover:text-primary',
        'transition-[color,border-color,opacity,transform] duration-(--duration-medium) ease-(--ease-premium)',
        'active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 scale-0 rounded-full bg-primary/10 transition-transform duration-(--duration-medium) ease-(--ease-spring) group-hover/dl:scale-100 motion-reduce:transition-none"
      />
      <Download className="relative w-3.5 h-3.5 transition-transform duration-(--duration-medium) ease-(--ease-premium) group-hover/dl:rotate-[4deg] motion-reduce:transition-none" />
    </a>
  )
}

function DocumentRow({ row, resolve, onErr, onOpenImage }: {
  row: DocRow
  resolve:     (id: string | null | undefined, size?: 'small' | 'medium' | 'large') => string
  onErr:       (id: string) => void
  onOpenImage: (index: number) => void
}) {
  const { t } = useTranslation('properties')
  return (
    <div className={cn(ROW_SHELL, ROW_TRANSITION, ROW_HOVER)}>
      {row.isImage && row.imageIndex !== -1 ? (
        <button
          type="button"
          onClick={() => onOpenImage(row.imageIndex)}
          aria-label={t('assets.legalTab.viewImage', { title: row.title })}
          className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border/40 transition-transform duration-(--duration-fast) ease-(--ease-premium) active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Image
            src={resolve(row.thumbnailId, 'small')}
            alt=""
            fill
            unoptimized
            className="object-cover transition-transform duration-(--duration-medium) ease-(--ease-premium) group-hover/row:scale-[1.02] motion-reduce:transition-none"
            sizes="40px"
            onError={() => onErr(row.thumbnailId)}
          />
        </button>
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-background transition-colors duration-(--duration-standard) ease-(--ease-premium) group-hover/row:border-border">
          <FileText className="w-4 h-4 text-muted-foreground/60" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-bold text-foreground">{row.title}</p>
          <span className="shrink-0 rounded border border-border/50 bg-muted/50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-muted-foreground/70">
            {row.typeLabel}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground/60">
          <span className="min-w-0 flex-1 truncate">{row.subtitle}</span>
          {row.publishDate && (
            <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground/50">
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              {formatDate(row.publishDate)}
            </span>
          )}
        </div>
      </div>

      <div className="h-8 w-px shrink-0 bg-border/50" aria-hidden="true" />

      <DownloadAction href={row.downloadUrl} download={row.downloadName} label={t('assets.legalTab.download', { title: row.title })} />
    </div>
  )
}

export function LegalTab({ documents, documentAssignment, legalTotalCount, legalImageIndexById, resolve, onErr, onOpenImage }: LegalTabProps) {
  const { t } = useTranslation('properties')
  const assignmentDownloadUrl = getFileDownloadUrl(documentAssignment?.id)
  const assignmentIsImage = isImageAttachment(documentAssignment?.name)

  // Data Completeness Sprint 5.1: when there's truly nothing (no documents,
  // no assignment), this now returns the same single, whole-tab EmptyState
  // the other tabs use — previously the header + count-badge card always
  // rendered first with the empty state nested inside it, a card-inside-a-
  // card that didn't match the rest of this section.
  if (legalTotalCount === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={t('assets.legalTab.emptyTitle')}
        description={t('assets.legalTab.emptyDesc')}
      />
    )
  }

  const rows: DocRow[] = [
    ...(documentAssignment ? [{
      id: documentAssignment.id,
      title: documentAssignment.name ?? t('assets.legalTab.assignedDocumentFallback'),
      subtitle: t('assets.legalTab.documentAssignment'),
      typeLabel: getAttachmentTypeLabel(documentAssignment.name),
      publishDate: null,
      thumbnailId: documentAssignment.id,
      isImage: assignmentIsImage,
      imageIndex: legalImageIndexById[documentAssignment.id] ?? -1,
      downloadUrl: assignmentDownloadUrl,
      downloadName: documentAssignment.name,
    }] : []),
    ...documents.map(doc => ({
      id: doc.id,
      title: doc.name,
      subtitle: doc.fileName ?? t('assets.legalTab.documentFallback'),
      typeLabel: getAttachmentTypeLabel(doc.fileName ?? doc.name),
      publishDate: doc.publishDate,
      thumbnailId: doc.fileId,
      isImage: isImageAttachment(doc.fileName ?? doc.name),
      imageIndex: legalImageIndexById[doc.fileId] ?? -1,
      downloadUrl: getFileDownloadUrl(doc.fileId),
      downloadName: doc.fileName ?? doc.name,
    })),
  ]

  return (
    // Card recipe migrated off the legacy "Stitch" scaffold to match
    // Financial Intelligence et al. — see ConstructionSystemsCard's own
    // note on this same pass for the full rationale.
    <div className="bg-card border border-border/40 rounded-2xl shadow-design-xs p-6 h-full flex flex-col">

      <div className="flex justify-between items-center border-b border-border/50 pb-3 mb-3">
        <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
          {t('assets.legalTab.title')}
        </h4>
        <span className="px-2.5 py-0.5 bg-muted/50 text-muted-foreground/60 text-[9px] font-black rounded border border-border uppercase">
          {t('assets.legalTab.count', { count: legalTotalCount })}
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-2 no-scrollbar">
        {rows.map(row => (
          <DocumentRow key={row.id} row={row} resolve={resolve} onErr={onErr} onOpenImage={onOpenImage} />
        ))}
      </div>

    </div>
  )
}
