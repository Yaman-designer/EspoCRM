import { describe, it, expect } from 'vitest'
import {
  NO_BAD_CHARACTERS_PATTERN, CITY_MAX_LENGTH, POSTAL_CODE_MAX_LENGTH,
  COUNTRY_MAX_LENGTH, CLOSE_TO_MAX_LENGTH, STREET_MAX_LENGTH, STATE_MAX_LENGTH,
} from './validation'

describe('NO_BAD_CHARACTERS_PATTERN', () => {
  it('accepts ordinary text, punctuation, and non-Latin scripts', () => {
    expect(NO_BAD_CHARACTERS_PATTERN.test('123 Main St, Apt #4B')).toBe(true)
    expect(NO_BAD_CHARACTERS_PATTERN.test('Κολωνάκι')).toBe(true)
    expect(NO_BAD_CHARACTERS_PATTERN.test('')).toBe(true)
  })

  it('rejects ASCII control characters', () => {
    expect(NO_BAD_CHARACTERS_PATTERN.test('bad\x00char')).toBe(false)
    expect(NO_BAD_CHARACTERS_PATTERN.test('bad\x1Fchar')).toBe(false)
    expect(NO_BAD_CHARACTERS_PATTERN.test('bad\x7Fchar')).toBe(false)
  })

  it('allows tab, newline, and carriage return (explicitly outside the blocked ranges)', () => {
    expect(NO_BAD_CHARACTERS_PATTERN.test('line one\nline two')).toBe(true)
    expect(NO_BAD_CHARACTERS_PATTERN.test('a\tb')).toBe(true)
  })

  it('rejects the Unicode line/paragraph separator code points', () => {
    const lineSeparator = String.fromCharCode(0x2028)
    const paragraphSeparator = String.fromCharCode(0x2029)
    expect(NO_BAD_CHARACTERS_PATTERN.test('bad' + lineSeparator + 'char')).toBe(false)
    expect(NO_BAD_CHARACTERS_PATTERN.test('bad' + paragraphSeparator + 'char')).toBe(false)
  })
})

describe('max-length constants', () => {
  it('match the live entityDefs values they were confirmed against', () => {
    expect(CITY_MAX_LENGTH).toBe(100)
    expect(POSTAL_CODE_MAX_LENGTH).toBe(40)
    expect(COUNTRY_MAX_LENGTH).toBe(100)
    expect(CLOSE_TO_MAX_LENGTH).toBe(255)
    expect(STREET_MAX_LENGTH).toBe(255)
    expect(STATE_MAX_LENGTH).toBe(100)
  })
})
