'use client'

/**
 * Address Business Group, Phase 3 (Maps & Places). A debounced free-text
 * search over Nominatim, proxied through /api/geocode/search (see that
 * route's comment — geocoding.service.ts's searchAddresses() can't be
 * called from the browser, Nominatim sends no CORS header) that fills the
 * Phase 2 canonical address fields on selection — a convenience
 * quick-fill, not a replacement for the individual Street/City/State/
 * Postal Code/Country/Latitude/Longitude fields, which remain directly
 * editable before and after a selection is made.
 *
 * UI built from the same Popover/Command primitives RelationField.tsx
 * already uses for its own live-search pattern — no new UI system
 * introduced for this one feature.
 */

import { useCallback, useRef, useState } from 'react'
import { Search, Loader2, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import type { AddressSuggestion } from '../services/geocoding.service'

// Production Certification Audit (2026-08-04): routes through this app's own
// /api/geocode/search instead of calling geocoding.service.ts's
// searchAddresses() (Nominatim) directly from the browser — same CORS
// failure mode already fixed for usePropertyLocation.ts's /api/geocode, see
// that route's comment. searchAddresses() itself is unchanged; it now only
// ever runs server-side, inside the API route.
async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  return res.json() as Promise<AddressSuggestion[]>
}

interface AddressSearchProps {
  onSelect: (suggestion: AddressSuggestion) => void
  className?: string
}

export function AddressSearch({ onSelect, className }: AddressSearchProps) {
  const { t } = useTranslation('properties')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AddressSuggestion[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const search = useCallback((value: string) => {
    setQuery(value)
    clearTimeout(debounceRef.current)
    if (value.trim().length < 3) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const found = await searchAddresses(value)
      setResults(found)
      setLoading(false)
    }, 350)
  }, [])

  const handleSelect = (suggestion: AddressSuggestion) => {
    onSelect(suggestion)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className)}>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/45" />
          <input
            type="text"
            value={query}
            onChange={e => { search(e.target.value); if (!open) setOpen(true) }}
            onFocus={() => query.trim().length >= 3 && setOpen(true)}
            placeholder={t('addressSearch.placeholder')}
            className={cn(
              'h-12 w-full rounded-xl border border-border/70 bg-input pr-3 pl-10 text-sm shadow-[0_1px_2px_rgba(16,24,40,0.04)]',
              'transition-all duration-200 hover:border-border/90 hover:shadow-[0_1px_4px_rgba(16,24,40,0.07)]',
              'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 focus-visible:outline-none',
            )}
          />
          {loading && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground/45" />}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start" onOpenAutoFocus={e => e.preventDefault()}>
        <Command shouldFilter={false}>
          <CommandList>
            {results.length === 0 ? (
              <CommandEmpty>
                {loading
                  ? t('addressSearch.searching')
                  : query.trim().length < 3
                    ? t('addressSearch.typeMoreChars')
                    : t('addressSearch.noResults')}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((r, i) => (
                  <CommandItem
                    key={`${r.latitude},${r.longitude},${i}`}
                    value={r.formattedAddress + i}
                    onSelect={() => handleSelect(r)}
                    className="flex items-start gap-2"
                  >
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/45" />
                    <span className="text-[13px] leading-snug">{r.formattedAddress}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
