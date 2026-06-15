import { Building2 } from 'lucide-react'
import { propertySchema } from './schema'
import { propertySections } from './fields'
import { PropertyListRenderer } from './extensions/PropertyListRenderer'
import { PropertyViewRenderer } from './extensions/PropertyViewRenderer'
import type { RealEstateProperty } from './types/property.types'
import type { ResourceConfig } from '@/components/crud/resource-config'

// ── propertiesConfig ──────────────────────────────────────────────────────────
//
// Properties uses two CRMResourcePage extensions:
//
//   listRenderer — PropertyListRenderer manages its own useQuery with server-side
//     filtering (status / type / price range / area range / sort) via
//     buildWhereParams. The standard DataTable and PageHeader are skipped; the
//     renderer supplies PropertyToolbar + PropertyGrid + PropertyPagination.
//
//   viewRenderer — PropertyViewRenderer wraps PropertyDetailsSheet (hero image,
//     specs, agent card). It manages its own <Sheet> open state so EntityViewSheet
//     is skipped.
//
// columns / viewFields are empty arrays — they are unused by the extensions but
// required by ResourceConfig's type signature.

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
    viewRenderer: PropertyViewRenderer,
  },
}
