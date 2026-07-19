'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Layers, FileText, Camera, Download, Plane, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getWebAssetUrl, FALLBACK_IMAGE, getFileDownloadUrl } from '@/lib/image-url'
import { formatDate } from '@/lib/format'
import { handleRovingTabListKeyDown } from '../../lib/keyboard-nav'
import type { RealEstateProperty } from '../../types/property.types'

// ── Shared empty state ───────────────────────────────────────────────────────
// Data Completeness Sprint 5.1. Photos/Floor Plans/Drone/Legal each built
// their own empty-state markup across three different sprints — four
// different icon-container shapes and sizes, three different title
// treatments, and Drone broke from the other three entirely with a dark,
// full-bleed hero card instead of the light centered pattern the rest
// share. One shared component now backs all four: same icon-container
// size/shape, same title/description treatment. No section here has a
// call-to-action — this is a read-only page; editing happens in the
// Wizard — so none was added.

function AssetEmptyState({ icon: Icon, title, description }: {
  icon:        LucideIcon
  title:       string
  description: string
}) {
  return (
    <div className="bg-card border border-border rounded-[24px] h-full flex flex-col items-center justify-center gap-4 text-center p-6">
      <div className="w-16 h-16 bg-primary/5 text-primary border border-primary/10 rounded-full flex items-center justify-center shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <h4 className="font-heading font-bold text-lg text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────────

type AssetTab = 'photos' | 'floorplans' | 'drone' | 'legal'

// ── Component ─────────────────────────────────────────────────────────────────

interface AssetManagementSystemProps {
  property: RealEstateProperty
}

export function AssetManagementSystem({ property }: AssetManagementSystemProps) {
  const [activeTab, setActiveTab] = useState<AssetTab>('photos')
  const [errored, setErrored] = useState<Set<string>>(new Set())

  const { mainImageId, imagesIds = [], documents = [], cBanner, cBannerphotoId } = property

  // Main image first, then gallery (deduped)
  const allIds = mainImageId
    ? [mainImageId, ...imagesIds.filter(id => id !== mainImageId)]
    : imagesIds

  function resolve(id: string | null | undefined): string {
    if (!id || errored.has(id)) return FALLBACK_IMAGE
    return getWebAssetUrl(id)
  }
  function onErr(id: string) {
    setErrored(s => new Set([...s, id]))
  }

  const tabs: Array<{ id: AssetTab; label: string; count: number }> = [
    { id: 'photos',     label: 'Photos',      count: allIds.length },
    { id: 'floorplans', label: 'Floor Plans',  count: 0 },
    { id: 'drone',      label: 'Drone',        count: 0 },
    { id: 'legal',      label: 'Legal',        count: documents.length + (property.cDocumentassignmentId ? 1 : 0) },
  ]

  return (
    // Stitch: <section className="space-y-4">
    <section className="space-y-4">

      {/* Stitch: flex flex-col md:flex-row justify-between items-center gap-4 */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          {/* Stitch: text-xl font-black text-text-main font-headline tracking-tight */}
          <h2 className="text-xl font-black text-foreground font-heading tracking-tight">
            Asset Management System
          </h2>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            High-fidelity visual documentation and legal stack
          </p>
        </div>

        {/* Stitch: flex gap-1 p-1 bg-white border border-border rounded-xl shadow-xs shrink-0 */}
        {/* Interaction Design Sprint 4: real ARIA tablist — arrow keys move
            and activate, only the active tab sits in the Tab order. */}
        <nav
          role="tablist"
          aria-label="Asset category"
          className="flex gap-1 p-1 bg-card border border-border rounded-xl shadow-xs shrink-0"
          onKeyDown={e => handleRovingTabListKeyDown(e, tabs.map(t => t.id), activeTab, id => setActiveTab(id as AssetTab))}
        >
          {tabs.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`asset-tab-${tab.id}`}
                data-tab-id={tab.id}
                aria-selected={active}
                aria-controls="asset-tab-panel"
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  active ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                {/* Stitch: count badge — active: bg-white/20, inactive: bg-slate-100 */}
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[9px]',
                  active ? 'bg-white/20' : 'bg-muted/50'
                )}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Stitch: <div className="h-[480px]"> */}
      <div id="asset-tab-panel" role="tabpanel" aria-labelledby={`asset-tab-${activeTab}`} className="h-120">
        {activeTab === 'photos' && (
          allIds.length > 0
            ? <PhotosTab allIds={allIds} resolve={resolve} onErr={onErr} />
            : <PhotosEmptyTab />
        )}
        {activeTab === 'floorplans' && <FloorPlansTab />}
        {activeTab === 'drone' && <DroneTab />}
        {activeTab === 'legal' && (
          <LegalTab
            documents={documents}
            cDocumentassignmentId={property.cDocumentassignmentId}
            cDocumentassignmentName={property.cDocumentassignmentName}
          />
        )}
      </div>

      {/* Banner — Property Details Completion (2026-07-17). cBanner/
          cBannerphoto had no representation anywhere in the Details page. */}
      {(cBanner || cBannerphotoId) && (
        <div className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted/30">
            {cBannerphotoId ? (
              <Image src={resolve(cBannerphotoId)} alt="Banner photo" fill unoptimized className="object-cover" onError={() => onErr(cBannerphotoId)} />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Camera className="w-5 h-5 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Banner</p>
            <p className="text-sm font-black text-foreground">
              {cBanner ? 'Enabled' : 'Disabled'}{cBannerphotoId ? ' · photo attached' : ' · no photo attached'}
            </p>
          </div>
        </div>
      )}

    </section>
  )
}

// ── Photos tab ────────────────────────────────────────────────────────────────

interface PhotosTabProps {
  allIds:  string[]
  resolve: (id: string | null | undefined) => string
  onErr:   (id: string) => void
}

function PhotosTab({ allIds, resolve, onErr }: PhotosTabProps) {
  const [hero, second, third, fourth] = allIds
  // "+N" = images beyond the 3 fully-visible slots (hero, kitchen, master)
  const remaining = Math.max(0, allIds.length - 3)

  return (
    // Stitch: grid grid-cols-4 gap-4 h-full
    // lg:grid-rows-2 creates two equal rows on desktop from the 480px parent height
    <div className="grid grid-cols-4 lg:grid-rows-2 gap-4 h-full">

      {/* ── Hero: col-span-4 lg:col-span-2 row-span-2 ── */}
      {/* Stitch: rounded-[20px] overflow-hidden relative group border border-border shadow-md */}
      <div className="col-span-4 lg:col-span-2 lg:row-span-2 rounded-[24px] overflow-hidden relative group border border-border shadow-md min-h-52 lg:min-h-0">
        {hero != null ? (
          <>
            {/* Stitch: img transition-transform duration-700 group-hover:scale-105 */}
            <Image
              src={resolve(hero)}
              alt="Main living area"
              fill
              unoptimized
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => onErr(hero)}
            />
            {/* Stitch: absolute top-4 left-4 bg-black/60 backdrop-blur-xl border border-white/20
                       px-3 py-1 rounded-lg text-[9px] font-bold text-white uppercase tracking-wider */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xl border border-white/20 px-3 py-1 rounded-lg text-[9px] font-bold text-white uppercase tracking-wider">
              Primary Photo
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
            <Camera className="w-8 h-8 text-slate-600" />
          </div>
        )}
      </div>

      {/* ── Kitchen: col-span-4 lg:col-span-2 ── */}
      {/* Stitch: rounded-[20px] overflow-hidden relative group border border-border shadow-sm */}
      <div className="col-span-4 lg:col-span-2 rounded-[24px] overflow-hidden relative group border border-border shadow-sm min-h-36 lg:min-h-0">
        {second != null ? (
          <>
            <Image
              src={resolve(second)}
              alt="Interior view"
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => onErr(second)}
            />
            {/* Stitch: absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent
                       flex items-end p-5 */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent flex items-end p-5">
              {/* Stitch: text-white font-bold text-lg */}
              <p className="text-white font-bold text-lg">Interior View</p>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <Camera className="w-6 h-6 text-slate-300" />
          </div>
        )}
      </div>

      {/* ── Master: col-span-2 lg:col-span-1 ── */}
      {/* Stitch: rounded-[20px] overflow-hidden relative group border border-border shadow-sm */}
      <div className="col-span-2 lg:col-span-1 rounded-[24px] overflow-hidden relative group border border-border shadow-sm min-h-28 lg:min-h-0">
        {third != null ? (
          <>
            <Image
              src={resolve(third)}
              alt="Property view"
              fill
              unoptimized
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => onErr(third)}
            />
            {/* Stitch: absolute inset-0 flex items-center justify-center
                       bg-black/30 group-hover:bg-black/50 transition-colors */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
              {/* Stitch: text-white font-black text-[9px] uppercase tracking-widest
                         border-2 border-white/40 px-3 py-1.5 rounded-lg backdrop-blur-sm */}
              <span className="text-white font-black text-[9px] uppercase tracking-widest border-2 border-white/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                Property View
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <Camera className="w-5 h-5 text-slate-300" />
          </div>
        )}
      </div>

      {/* ── Counter tile: col-span-2 lg:col-span-1 ── */}
      {/* Visual Polish Sprint 5: matched to its 3 grid siblings (24px) —
          this was the only tile in the set at 20px. */}
      <div className="col-span-2 lg:col-span-1 rounded-[24px] overflow-hidden relative group border border-border shadow-sm bg-slate-900 min-h-28 lg:min-h-0">
        {fourth != null && (
          // Stitch: img opacity-60 group-hover:opacity-40 transition-opacity
          <Image
            src={resolve(fourth)}
            alt="More views"
            fill
            unoptimized
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover opacity-60 group-hover:opacity-40 transition-opacity"
            onError={() => onErr(fourth)}
          />
        )}
        {/* Stitch: absolute inset-0 flex flex-col items-center justify-center text-white */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          {/* Stitch: font-headline font-black text-3xl tracking-tighter "+18" */}
          <span className="font-heading font-black text-3xl tracking-tighter">
            {remaining > 0 ? `+${remaining}` : '—'}
          </span>
          {/* Stitch: text-[9px] font-black uppercase tracking-wider "Asset Stack" */}
          <span className="text-[9px] font-black uppercase tracking-wider">Asset Stack</span>
        </div>
      </div>

    </div>
  )
}

// ── Photos empty state ─────────────────────────────────────────────────────────

function PhotosEmptyTab() {
  return (
    <AssetEmptyState
      icon={Camera}
      title="No Photos Uploaded"
      description="Upload professional photography to attract buyers."
    />
  )
}

// ── Floor Plans tab ────────────────────────────────────────────────────────────

function FloorPlansTab() {
  return (
    <AssetEmptyState
      icon={Layers}
      title="Architectural Floor Plans"
      description="High-fidelity vector floor plans have not been uploaded for this listing yet."
    />
  )
}

// ── Drone tab ─────────────────────────────────────────────────────────────────

function DroneTab() {
  return (
    <AssetEmptyState
      icon={Plane}
      title="Aerial Survey Footage"
      description="No aerial drone footage has been uploaded for this property. Aerial perspectives and LiDAR surveys dramatically increase buyer engagement."
    />
  )
}

// ── Legal tab ─────────────────────────────────────────────────────────────────
// Property Details Completion (2026-07-17). Previously always rendered the
// empty state below regardless of real data — `documents` was never even
// fetched server-side (see [slug]/page.tsx's withDocuments). Now renders the
// real related Document records: preview (name/fileName), metadata
// (publishDate), and download (via /api/espo-file, binary-safe).

interface LegalTabProps {
  documents: NonNullable<RealEstateProperty['documents']>
  cDocumentassignmentId?: string | null
  cDocumentassignmentName?: string
}

function LegalTab({ documents, cDocumentassignmentId, cDocumentassignmentName }: LegalTabProps) {
  const assignmentDownloadUrl = getFileDownloadUrl(cDocumentassignmentId)
  const totalCount = documents.length + (cDocumentassignmentId ? 1 : 0)

  // Data Completeness Sprint 5.1: when there's truly nothing (no documents,
  // no assignment), this now returns the same single, whole-tab
  // AssetEmptyState the other three tabs use — previously the header +
  // count-badge card always rendered first with the empty state nested
  // inside it, a card-inside-a-card that didn't match Photos/Floor Plans/
  // Drone, where the empty state IS the entire tab surface.
  if (totalCount === 0) {
    return (
      <AssetEmptyState
        icon={FileText}
        title="No Legal Documents Attached"
        description="Attach title deeds, permits, and compliance certificates to build buyer confidence."
      />
    )
  }

  return (
    <div className="bg-card border border-border rounded-[24px] p-6 h-full flex flex-col">

      <div className="flex justify-between items-center border-b border-border/50 pb-3 mb-3">
        <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
          Active Compliance Document Stack
        </h4>
        <span className="px-2.5 py-0.5 bg-muted/50 text-muted-foreground/60 text-[9px] font-black rounded border border-border uppercase">
          {totalCount} Document{totalCount === 1 ? '' : 's'}
        </span>
      </div>

      {/* cDocumentassignment — a single belongsTo Attachment field, distinct
          from the `documents` hasMany relation below. Rendered first when
          present. */}
      {cDocumentassignmentId && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 mb-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-background">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">{cDocumentassignmentName ?? 'Assigned Document'}</p>
            <p className="text-[11px] text-muted-foreground/60">Document Assignment</p>
          </div>
          {assignmentDownloadUrl && (
            <a
              href={assignmentDownloadUrl}
              download={cDocumentassignmentName}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 text-primary transition-colors hover:bg-primary/10"
              aria-label="Download assigned document"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto pr-2 no-scrollbar">
        {documents.map(doc => {
          const downloadUrl = getFileDownloadUrl(doc.fileId)
          return (
            <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/10 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-background">
                <FileText className="w-4 h-4 text-muted-foreground/60" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{doc.name}</p>
                <p className="text-[11px] text-muted-foreground/60">
                  {doc.fileName ?? 'File'}{doc.publishDate ? ` · ${formatDate(doc.publishDate)}` : ''}
                </p>
              </div>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={doc.fileName ?? doc.name}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/40 text-muted-foreground/60 transition-colors hover:border-primary/40 hover:text-primary"
                  aria-label={`Download ${doc.name}`}
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
