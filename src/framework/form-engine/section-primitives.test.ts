import { describe, it, expect } from 'vitest'
import { isFilled, getSectionCompletion } from './section-primitives'
import type { FieldSchema } from './types'

// Regression suite for the Section Completion Counter bug (switch OFF never
// decrementing the badge) and its ReviewStep.tsx twin (getStepCompletion /
// the required-field violations list previously kept its own divergent
// `isEmpty`, since deleted — see ReviewStep.tsx). isFilled is the one
// implementation both now call; this file is what keeps them from drifting
// apart again.

function field(type: FieldSchema['type'], key = 'k'): FieldSchema {
  return { key, type, labelKey: 'x' } as FieldSchema
}

describe('isFilled', () => {
  describe('boolean (switch/checkbox) — OFF is empty, not "any boolean is filled"', () => {
    it('switch: false is empty, true is filled', () => {
      expect(isFilled(false, field('switch'))).toBe(false)
      expect(isFilled(true, field('switch'))).toBe(true)
    })

    it('checkbox: false is empty, true is filled', () => {
      expect(isFilled(false, field('checkbox'))).toBe(false)
      expect(isFilled(true, field('checkbox'))).toBe(true)
    })
  })

  describe('rich-text — Tiptap serializes its empty doc to non-empty HTML', () => {
    it('"<p></p>" (empty paragraph) is empty', () => {
      expect(isFilled('<p></p>', field('rich-text'))).toBe(false)
    })

    it('"<p><br></p>" (empty paragraph with a line break) is empty', () => {
      expect(isFilled('<p><br></p>', field('rich-text'))).toBe(false)
    })

    it('real content is filled', () => {
      expect(isFilled('<p>Hello</p>', field('rich-text'))).toBe(true)
    })
  })

  describe('text', () => {
    it('"" is empty', () => {
      expect(isFilled('', field('text'))).toBe(false)
    })

    it('"Hello" is filled', () => {
      expect(isFilled('Hello', field('text'))).toBe(true)
    })
  })

  describe('number', () => {
    it('undefined is empty', () => {
      expect(isFilled(undefined, field('number'))).toBe(false)
    })

    it('0 is filled — a real, deliberately-entered value, not "no value"', () => {
      expect(isFilled(0, field('number'))).toBe(true)
    })

    it('42 is filled', () => {
      expect(isFilled(42, field('number'))).toBe(true)
    })
  })

  describe('date', () => {
    it('undefined is empty', () => {
      expect(isFilled(undefined, field('date'))).toBe(false)
    })

    it('a valid ISO date string is filled', () => {
      expect(isFilled('2026-08-05', field('date'))).toBe(true)
    })
  })

  describe('select', () => {
    it('null (nothing chosen) is empty', () => {
      expect(isFilled(null, field('select'))).toBe(false)
    })

    it('a string option value is filled', () => {
      expect(isFilled('apartment', field('select'))).toBe(true)
    })

    it('a boolean OPTION value (e.g. an explicit "No" in a Yes/No dropdown) is filled — not the switch/checkbox off-state rule', () => {
      expect(isFilled(false, field('select'))).toBe(true)
      expect(isFilled(true, field('select'))).toBe(true)
    })
  })

  describe('arrays — multi-select / tags / gallery all share plain-array semantics', () => {
    it('multi-select: [] is empty, populated is filled', () => {
      expect(isFilled([], field('multi-select'))).toBe(false)
      expect(isFilled(['apartment', 'villa'], field('multi-select'))).toBe(true)
    })

    it('tags: [] is empty, populated is filled', () => {
      expect(isFilled([], field('tags'))).toBe(false)
      expect(isFilled(['pool', 'garden'], field('tags'))).toBe(true)
    })

    it('gallery (multi-image): [] is empty, multiple files is filled', () => {
      expect(isFilled([], field('multi-image'))).toBe(false)
      expect(isFilled(['a.jpg', 'b.jpg', 'c.jpg'], field('multi-image'))).toBe(true)
    })
  })

  describe('uploads — image / file', () => {
    it('image: null is empty', () => {
      expect(isFilled(null, field('image'))).toBe(false)
    })

    it('image: a File is filled', () => {
      const stubFile = { name: 'photo.jpg', size: 1024 } as unknown as File
      expect(isFilled(stubFile, field('image'))).toBe(true)
    })

    it('image: an existing attachment id (string) is filled', () => {
      expect(isFilled('attachment-id-123', field('image'))).toBe(true)
    })
  })
})

describe('getSectionCompletion — integration', () => {
  it('a single switch: OFF -> ON -> OFF returns the count to exactly where it started (0 -> 1 -> 0)', () => {
    const section = { fields: [field('switch', 'keys')] }

    const initial = getSectionCompletion(section, { keys: false })
    expect(initial.filledCount).toBe(0)

    const toggledOn = getSectionCompletion(section, { keys: true })
    expect(toggledOn.filledCount).toBe(1)

    const toggledBackOff = getSectionCompletion(section, { keys: false })
    expect(toggledBackOff.filledCount).toBe(0)
  })

  it('a 3-switch section (Office Use shape): OFF -> ON -> OFF for one field never sticks the other two', () => {
    const section = {
      fields: [field('switch', 'keys'), field('switch', 'cSold'), field('switch', 'cConsideration')],
    }

    expect(getSectionCompletion(section, { keys: false, cSold: false, cConsideration: false })).toEqual({
      visibleCount: 3, filledCount: 0, isComplete: true,
    })

    expect(getSectionCompletion(section, { keys: true, cSold: false, cConsideration: false }).filledCount).toBe(1)

    expect(getSectionCompletion(section, { keys: false, cSold: false, cConsideration: false })).toEqual({
      visibleCount: 3, filledCount: 0, isComplete: true,
    })
  })
})
