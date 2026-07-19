import { describe, it, expect, vi } from 'vitest'
import { computeDependencyChanges } from './DependencyEngine'
import type { StepSchema } from './types'

describe('computeDependencyChanges', () => {
  it('emits a clear action when the controlling field changes and no guard blocks it', () => {
    const schema: StepSchema = {
      fields: [
        { key: 'type', type: 'text', label: 'Type', dependencies: [{ on: 'category', action: 'clear' }] },
      ],
    }
    const changes = computeDependencyChanges(schema, { category: 'Residential' }, { category: 'Commercial' })
    expect(changes).toEqual([{ fieldKey: 'type', action: 'clear' }])
  })

  it('emits nothing when the controlling field is unchanged', () => {
    const schema: StepSchema = {
      fields: [
        { key: 'type', type: 'text', label: 'Type', dependencies: [{ on: 'category', action: 'clear' }] },
      ],
    }
    const changes = computeDependencyChanges(schema, { category: 'Residential' }, { category: 'Residential' })
    expect(changes).toEqual([])
  })

  it('respects an optional `when` guard condition on the dependency', () => {
    const schema: StepSchema = {
      fields: [{
        key: 'exchangeSchemePercentage',
        type: 'text',
        label: 'Percentage',
        dependencies: [{ on: 'exchangeScheme', action: 'clear', when: { field: 'exchangeScheme', operator: 'eq', value: false } }],
      }],
    }
    // Guard fails (exchangeScheme is true in the current values) — no clear.
    expect(computeDependencyChanges(schema, { exchangeScheme: false }, { exchangeScheme: true })).toEqual([])
  })

  it('emits reload-options with a loader bound to the current parent value + full form snapshot', async () => {
    const loadOptions = vi.fn().mockResolvedValue([{ value: 'apartment', label: 'Apartment' }])
    const schema: StepSchema = {
      fields: [{ key: 'type', type: 'text', label: 'Type', dependencies: [{ on: 'category', action: 'reload-options', loadOptions }] }],
    }
    const currValues = { category: 'Residential', title: 'X' }
    const [change] = computeDependencyChanges(schema, { category: '' }, currValues)

    expect(change.action).toBe('reload-options')
    await change.loader!('Residential')
    expect(loadOptions).toHaveBeenCalledWith('Residential', currValues)
  })

  it('emits auto-derive with a deriver bound to the parent value + full form snapshot', () => {
    const derive = vi.fn().mockReturnValue('Simple')
    const schema: StepSchema = {
      fields: [{ key: 'cAssignment', type: 'text', label: 'Assignment', dependencies: [{ on: 'category', action: 'auto-derive', derive }] }],
    }
    const currValues = { category: 'Residential' }
    const [change] = computeDependencyChanges(schema, { category: '' }, currValues)

    expect(change.action).toBe('auto-derive')
    expect(change.deriver!('Residential')).toBe('Simple')
    expect(derive).toHaveBeenCalledWith('Residential', currValues)
  })

  it('emits update-validation with no loader/deriver', () => {
    const schema: StepSchema = {
      fields: [{ key: 'floorKey', type: 'text', label: 'Floor Key', dependencies: [{ on: 'category', action: 'update-validation' }] }],
    }
    const changes = computeDependencyChanges(schema, { category: 'Land' }, { category: 'Residential' })
    expect(changes).toEqual([{ fieldKey: 'floorKey', action: 'update-validation' }])
  })

  describe('self-clear-on-hide (clearWhenHidden)', () => {
    it('clears a field whose own visibility flips from visible to hidden', () => {
      const schema: StepSchema = {
        fields: [{
          key: 'cFurnitureElectricalAppliances',
          type: 'text',
          label: 'Furniture',
          clearWhenHidden: true,
          visibility: { field: 'furnished', operator: 'not_empty' },
        }],
      }
      const changes = computeDependencyChanges(schema, { furnished: 'furnished' }, { furnished: '' })
      expect(changes).toEqual([{ fieldKey: 'cFurnitureElectricalAppliances', action: 'clear' }])
    })

    it('does not clear when visibility flips hidden -> visible (only visible -> hidden triggers)', () => {
      const schema: StepSchema = {
        fields: [{
          key: 'cFurnitureElectricalAppliances',
          type: 'text',
          label: 'Furniture',
          clearWhenHidden: true,
          visibility: { field: 'furnished', operator: 'not_empty' },
        }],
      }
      const changes = computeDependencyChanges(schema, { furnished: '' }, { furnished: 'furnished' })
      expect(changes).toEqual([])
    })

    it('does nothing for a field without clearWhenHidden even if visibility flips', () => {
      const schema: StepSchema = {
        fields: [{ key: 'x', type: 'text', label: 'X', visibility: { field: 'flag', operator: 'eq', value: true } }],
      }
      const changes = computeDependencyChanges(schema, { flag: true }, { flag: false })
      expect(changes).toEqual([])
    })
  })

  it('reads fields from `sections` as well as the flat `fields` shorthand', () => {
    const schema: StepSchema = {
      sections: [{ fields: [
        { key: 'type', type: 'text', label: 'Type', dependencies: [{ on: 'category', action: 'clear' }] },
      ] } as never],
    }
    const changes = computeDependencyChanges(schema, { category: 'A' }, { category: 'B' })
    expect(changes).toEqual([{ fieldKey: 'type', action: 'clear' }])
  })
})
