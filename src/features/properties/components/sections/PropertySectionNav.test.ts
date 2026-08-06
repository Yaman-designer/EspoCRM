import { describe, it, expect } from 'vitest'
import { computeVisibleCount } from './PropertySectionNav'

// Enterprise Responsive Navigation Refactor (2026-07-24). Unit-testable
// core of the adaptive nav: given real measured widths, how many items fit
// before the overflow trigger is needed. Kept as a pure function
// specifically so this arithmetic can be proven correct in isolation, apart
// from ResizeObserver/DOM timing.

describe('computeVisibleCount', () => {
  it('empty items: 0, no crash', () => {
    expect(computeVisibleCount([], 50, 2, 1000)).toBe(0)
  })

  it('everything fits: returns the full count, reserving no space for a trigger that will not render', () => {
    // 3 items of 50px + 2 gaps of 2px = 154px, well under 1000px container.
    expect(computeVisibleCount([50, 50, 50], 60, 2, 1000)).toBe(3)
  })

  it('exactly at the boundary (sum of items+gaps === container width): still fits with no trigger', () => {
    // 2 items of 50 + 1 gap of 2 = 102, container exactly 102.
    expect(computeVisibleCount([50, 50], 60, 2, 102)).toBe(2)
  })

  it('one item over the boundary: trigger appears, budget now excludes the trigger + its own gap', () => {
    // 2 items of 50 + 1 gap = 102 > 100 container -> must reserve for trigger.
    // budget = 100 - 60(trigger) - 2(gap) = 38, which fits 0 items of width 50.
    expect(computeVisibleCount([50, 50], 60, 2, 100)).toBe(0)
  })

  it('partial fit: some items pinned, the rest overflow — proven with a real mixed-width list', () => {
    // items: 40, 60, 55, 70 ; more=50 ; gap=2 ; container=200
    // budget = 200 - 50 - 2 = 148
    // running: 40 (used=40) -> +2+60=102 (used=102) -> +2+55=159 > 148, stop.
    // visible = 2
    expect(computeVisibleCount([40, 60, 55, 70], 50, 2, 200)).toBe(2)
  })

  it('container narrower than even one item + trigger: 0 pinned items, trigger alone must still fit the caller\'s own layout (this function does not clamp negative, just returns 0)', () => {
    expect(computeVisibleCount([200], 50, 2, 100)).toBe(0)
  })

  it('very wide container: all items always fit regardless of count', () => {
    const widths = Array.from({ length: 10 }, () => 80)
    expect(computeVisibleCount(widths, 60, 2, 5000)).toBe(10)
  })

  it('monotonic in container width: widening the container never decreases the visible count for the same items', () => {
    const widths = [60, 70, 55, 65, 90, 50]
    let prev = 0
    for (let width = 100; width <= 900; width += 50) {
      const count = computeVisibleCount(widths, 55, 2, width)
      expect(count).toBeGreaterThanOrEqual(prev)
      prev = count
    }
  })

  it('single item, fits alone (no trigger needed since there is nothing left to overflow)', () => {
    expect(computeVisibleCount([80], 50, 2, 100)).toBe(1)
  })

  it('gap of 0: does not add spurious width', () => {
    expect(computeVisibleCount([50, 50], 60, 0, 100)).toBe(2)
  })
})
