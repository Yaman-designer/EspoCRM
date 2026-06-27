'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Layers, FileText, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getWebAssetUrl, FALLBACK_IMAGE } from '@/lib/image-url'
import type { RealEstateProperty } from '../../types/property.types'

// ── Types ──────────────────────────────────────────────────────────────────────

type AssetTab = 'photos' | 'floorplans' | 'drone' | 'legal'

// ── Component ─────────────────────────────────────────────────────────────────

interface AssetManagementSystemProps {
  property: RealEstateProperty
}

export function AssetManagementSystem({ property }: AssetManagementSystemProps) {
  const [activeTab, setActiveTab] = useState<AssetTab>('photos')
  const [errored, setErrored] = useState<Set<string>>(new Set())

  const { mainImageId, imagesIds = [] } = property

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
    { id: 'legal',      label: 'Legal',        count: 0 },
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
        <nav className="flex gap-1 p-1 bg-card border border-border rounded-xl shadow-xs shrink-0">
          {tabs.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all',
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
      <div className="h-120">
        {activeTab === 'photos' && (
          allIds.length > 0
            ? <PhotosTab allIds={allIds} resolve={resolve} onErr={onErr} />
            : <PhotosEmptyTab />
        )}
        {activeTab === 'floorplans' && <FloorPlansTab />}
        {activeTab === 'drone' && <DroneTab />}
        {activeTab === 'legal' && <LegalTab />}
      </div>

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
      {/* Stitch: rounded-[20px] overflow-hidden relative group border border-border shadow-sm bg-slate-900 */}
      <div className="col-span-2 lg:col-span-1 rounded-[20px] overflow-hidden relative group border border-border shadow-sm bg-slate-900 min-h-28 lg:min-h-0">
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
    <div className="bg-card border border-border rounded-[24px] h-full flex flex-col items-center justify-center gap-4 text-center p-6">
      <div className="w-14 h-14 bg-slate-50 border border-border rounded-2xl flex items-center justify-center">
        <Camera className="w-6 h-6 text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground/55">No photos uploaded</p>
        <p className="text-xs text-muted-foreground/40 mt-1 max-w-xs">Upload professional photography to attract buyers</p>
      </div>
    </div>
  )
}

// ── Floor Plans tab ────────────────────────────────────────────────────────────

function FloorPlansTab() {
  return (
    // Stitch: bg-white border border-border rounded-[24px] p-6 h-full flex flex-col justify-between items-center text-center
    <div className="bg-card border border-border rounded-[24px] p-6 h-full flex flex-col justify-between items-center text-center">

      <div className="my-auto space-y-4">
        {/* Stitch: w-16 h-16 bg-blue-50 text-primary border border-blue-100 rounded-full */}
        <div className="w-16 h-16 bg-blue-50 text-primary border border-blue-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <Layers className="w-8 h-8" />
        </div>
        <div>
          {/* Stitch: font-headline font-bold text-lg text-slate-800 */}
          <h4 className="font-heading font-bold text-lg text-foreground">Architectural Floor Plans</h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
            High-fidelity vector floor plans have not been uploaded for this listing yet.
          </p>
        </div>
      </div>

      {/* Stitch: grid grid-cols-2 gap-4 w-full max-w-md */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {/* Stitch: p-4 border border-border hover:border-primary rounded-xl text-left bg-slate-50 cursor-pointer */}
        <div className="p-4 border border-border rounded-xl text-left bg-muted/30 opacity-50">
          <span className="text-[9px] font-bold text-primary uppercase block">LEVEL 01</span>
          <span className="text-xs font-bold text-muted-foreground">Floor plan unavailable</span>
        </div>
        <div className="p-4 border border-border rounded-xl text-left bg-muted/30 opacity-50">
          <span className="text-[9px] font-bold text-primary uppercase block">LEVEL 02</span>
          <span className="text-xs font-bold text-muted-foreground">Floor plan unavailable</span>
        </div>
      </div>

    </div>
  )
}

// ── Drone tab ─────────────────────────────────────────────────────────────────

function DroneTab() {
  return (
    // Stitch: bg-slate-950 rounded-[24px] h-full relative overflow-hidden flex flex-col justify-end p-8 group
    // No hardcoded Unsplash image — no drone footage in backend; visual wrapper preserved with unavailable state
    <div className="bg-slate-950 rounded-[24px] h-full relative overflow-hidden flex flex-col justify-end p-8 group">

      {/* Stitch: absolute top-6 left-6 ... bg-crimson/80 → bg-brand-crimson/80 */}
      <div className="absolute top-6 left-6 flex items-center gap-2 bg-brand-crimson/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold text-white border border-brand-crimson/20 uppercase">
        <span className="w-1.5 h-1.5 bg-white/70 rounded-full" />
        Drone LiDAR · Unavailable
      </div>

      {/* Stitch: relative z-10 max-w-md text-white */}
      <div className="relative z-10 max-w-md text-white">
        {/* Stitch: text-2xl font-black font-headline tracking-tight */}
        <h4 className="text-2xl font-black font-heading tracking-tight">Aerial Survey Footage</h4>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          No aerial drone footage has been uploaded for this property. Aerial perspectives and LiDAR surveys dramatically increase buyer engagement.
        </p>
      </div>

    </div>
  )
}

// ── Legal tab ─────────────────────────────────────────────────────────────────

function LegalTab() {
  return (
    // Stitch: bg-white border border-border rounded-[24px] p-6 h-full flex flex-col justify-between
    <div className="bg-card border border-border rounded-[24px] p-6 h-full flex flex-col justify-between">

      {/* Stitch: header row */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
          Active Compliance Document Stack
        </h4>
        <span className="px-2.5 py-0.5 bg-muted/50 text-muted-foreground/60 text-[9px] font-black rounded border border-border uppercase">
          No Documents
        </span>
      </div>

      {/* Stitch: flex-1 space-y-2 overflow-y-auto pr-2 no-scrollbar — empty state inside preserved structure */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center overflow-y-auto pr-2 no-scrollbar py-4">
        <FileText className="w-10 h-10 text-slate-200" />
        <p className="text-sm font-semibold text-muted-foreground/60">No legal documents attached</p>
        <p className="text-xs text-muted-foreground/40 max-w-xs leading-relaxed">
          Attach title deeds, permits, and compliance certificates to build buyer confidence.
        </p>
      </div>


    </div>
  )
}
