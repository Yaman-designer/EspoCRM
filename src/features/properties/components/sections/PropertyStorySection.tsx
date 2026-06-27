'use client'

import { useState } from 'react'
import { ChevronDown, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionPlaceholder } from '../PropertyPlaceholders'

const DESC_LIMIT = 560

interface PropertyStorySectionProps {
  description?:        string | null
  narrativeSummary?:   string | null
  lifestyleNarrative?: string | null
  onEdit:              () => void
}

export function PropertyStorySection({ description, narrativeSummary, lifestyleNarrative, onEdit }: PropertyStorySectionProps) {
  const [descExpanded, setDescExpanded] = useState(false)

  const descIsLong  = (description?.length ?? 0) > DESC_LIMIT
  const visibleDesc = descIsLong && !descExpanded
    ? description!.slice(0, DESC_LIMIT) + '…'
    : (description ?? '')

  return (
    <div className="px-1">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/58">
        About this Property
      </p>

      {narrativeSummary && (
        <p className="mb-4 max-w-155 text-[14px] font-light leading-[1.65] text-foreground/72">
          {narrativeSummary}
        </p>
      )}

      {description ? (
        <>
          {description.length > 80 && (
            <blockquote className="mb-4 border-l-2 border-foreground/18 pl-5">
              <p className="text-[15px] font-light italic leading-[1.6] tracking-tight text-foreground/65">
                &ldquo;{description.split(/[.!?]/)[0].trim()}.&rdquo;
              </p>
            </blockquote>
          )}

          <p className="max-w-165 text-[14px] leading-[1.68] text-foreground/72">
            {visibleDesc}
          </p>

          {descIsLong && (
            <button
              type="button"
              onClick={() => setDescExpanded(v => !v)}
              className="mt-4 inline-flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-widest text-foreground/45 transition-colors hover:text-foreground/72 focus-visible:outline-none"
            >
              <ChevronDown className={cn('size-3 transition-transform duration-200', descExpanded && 'rotate-180')} />
              {descExpanded ? 'Show less' : 'Read full description'}
            </button>
          )}
        </>
      ) : (
        <SectionPlaceholder
          icon={FileText}
          label="No description yet"
          hint="Add a compelling description to make this listing stand out to prospective buyers."
          action="Add description"
          onAction={onEdit}
        />
      )}

      {lifestyleNarrative && (
        <p className="mt-6 max-w-155 text-[13.5px] font-light italic leading-[1.7] text-foreground/55">
          {lifestyleNarrative}
        </p>
      )}
    </div>
  )
}
