import { Building2 } from 'lucide-react'
import { propertySchema } from './schema'
import { propertySections } from './fields'
import { PropertyListRenderer } from './extensions/PropertyListRenderer'
import type { RealEstateProperty } from './types/property.types'
import type { ResourceConfig } from '@/components/crud/resource-config'

// ── propertiesConfig ──────────────────────────────────────────────────────────
//
// Properties uses a custom listRenderer (PropertyListRenderer) that manages its
// own useQuery with server-side filtering and renders PropertyToolbar +
// PropertyGrid + PropertyPagination. Clicking "View Property" navigates to
// /properties/[slug] which renders the full PropertyDetailView page.
//
// columns / viewFields are empty arrays — unused by the extension but required
// by ResourceConfig's type signature.

export const propertiesConfig: ResourceConfig<RealEstateProperty> = {
  endpoint:  '/RealEstateProperty',
  queryKey:  'realEstateProperties',

  columns:      [],   // unused — listRenderer provides its own display
  formSections: propertySections,
  schema:       propertySchema,
  viewFields:   [],   // unused — viewRenderer provides its own display

  getEntityName: (p) => p.title ?? p.propertyCode ?? p.name ?? p.id,

  title:          'Properties',
  subtitle:       'Manage and monitor your real estate portfolio',
  icon:           Building2,
  entitySingular: 'Property',
  addLabel:       'Add Property',

  extensions: {
    listRenderer: PropertyListRenderer,
  },
}
