import { describe, it, expect } from 'vitest'
import { layoutOverlappingEvents } from './time'

describe('layoutOverlappingEvents — Phase 4 overlap-defect fix', () => {
  it('gives two non-overlapping events the full single column (totalCols=1) — the common case is unaffected', () => {
    const events = [
      { id: 'a', startMinutes: 540, endMinutes: 600 }, // 9-10
      { id: 'b', startMinutes: 660, endMinutes: 720 }, // 11-12
    ]
    const slots = layoutOverlappingEvents(events)
    expect(slots.get('a')).toEqual({ col: 0, totalCols: 1 })
    expect(slots.get('b')).toEqual({ col: 0, totalCols: 1 })
  })

  it('splits two overlapping events into two side-by-side columns instead of one hiding the other', () => {
    const events = [
      { id: 'a', startMinutes: 540, endMinutes: 630 }, // 9-10:30
      { id: 'b', startMinutes: 570, endMinutes: 660 }, // 9:30-11 — overlaps a
    ]
    const slots = layoutOverlappingEvents(events)
    expect(slots.get('a')!.totalCols).toBe(2)
    expect(slots.get('b')!.totalCols).toBe(2)
    expect(slots.get('a')!.col).not.toBe(slots.get('b')!.col)
  })

  it('reuses a freed column once its previous occupant has ended, instead of growing columns unboundedly', () => {
    const events = [
      { id: 'a', startMinutes: 540, endMinutes: 600 }, // 9-10
      { id: 'b', startMinutes: 540, endMinutes: 600 }, // 9-10 — overlaps a, needs its own column
      { id: 'c', startMinutes: 600, endMinutes: 660 }, // 10-11 — starts exactly when a ends, can reuse a's column
    ]
    const slots = layoutOverlappingEvents(events)
    expect(slots.get('a')!.totalCols).toBe(2)
    expect(slots.get('c')!.col).toBe(slots.get('a')!.col)
  })

  it('keeps two separate (disconnected) overlap clusters on the same day independent of each other', () => {
    const events = [
      { id: 'a', startMinutes: 540, endMinutes: 600 }, // 9-10
      { id: 'b', startMinutes: 550, endMinutes: 590 }, // overlaps a
      { id: 'c', startMinutes: 900, endMinutes: 960 }, // 3-4pm, unrelated to a/b
    ]
    const slots = layoutOverlappingEvents(events)
    expect(slots.get('a')!.totalCols).toBe(2)
    expect(slots.get('c')).toEqual({ col: 0, totalCols: 1 })
  })
})
