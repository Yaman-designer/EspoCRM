import type { RealEstateProperty } from '@/features/properties/types/property.types'

// The single RealEstateProperty fixture factory every unit test in this
// suite reuses — id/name/status are the type's only non-optional fields
// (property.types.ts), so this is deliberately minimal; pass overrides for
// whatever fields the scenario under test actually needs, rather than
// growing this into a second copy of the entity's full shape.
export function buildProperty(overrides: Partial<RealEstateProperty> = {}): RealEstateProperty {
  return {
    id: 'prop-test-1',
    name: 'Test Property',
    status: 'Under Approval',
    ...overrides,
  }
}
