import { describe, it, expect } from 'vitest'
import { formatNumber, formatCompact, formatCurrency, formatDate, APP_CURRENCY } from './format'

describe('format', () => {
  describe('APP_CURRENCY', () => {
    it('is EUR — live-confirmed operating currency, see format.ts', () => {
      expect(APP_CURRENCY).toBe('EUR')
    })
  })

  describe('formatNumber', () => {
    it('adds thousands separators', () => {
      expect(formatNumber(1234567)).toBe('1,234,567')
    })

    it('formats zero and negative numbers', () => {
      expect(formatNumber(0)).toBe('0')
      expect(formatNumber(-500)).toBe('-500')
    })
  })

  describe('formatCompact', () => {
    it('abbreviates thousands and millions', () => {
      expect(formatCompact(2000)).toBe('2K')
      expect(formatCompact(1500000)).toBe('1.5M')
    })

    it('leaves small numbers unabbreviated', () => {
      expect(formatCompact(500)).toBe('500')
    })
  })

  describe('formatCurrency', () => {
    it('defaults to APP_CURRENCY (EUR) with no fraction digits', () => {
      expect(formatCurrency(250000)).toBe('€250,000')
    })

    it('respects an explicit currency code', () => {
      expect(formatCurrency(100, 'USD')).toBe('$100')
    })

    it('formats compactly with 2 fraction digits when requested', () => {
      expect(formatCurrency(1500000, 'EUR', { compact: true })).toBe('€1.50M')
    })

    it('memoizes formatters per (currency, compact) pair without changing output', () => {
      // Calling twice with the same args must not affect the second result —
      // guards the internal _currencyFormatters cache in format.ts.
      expect(formatCurrency(500, 'EUR')).toBe(formatCurrency(500, 'EUR'))
    })
  })

  describe('formatDate', () => {
    it('formats a date with the pinned en-US locale by default', () => {
      expect(formatDate('2026-07-16T00:00:00Z')).toMatch(/July 1[56], 2026/)
    })

    it('accepts custom Intl.DateTimeFormatOptions', () => {
      const result = formatDate('2026-01-01T00:00:00Z', { year: 'numeric' })
      expect(result).toBe('2026')
    })
  })
})
