import { z } from 'zod'
import { Building2 } from 'lucide-react'
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
// columns / formSections / schema / viewFields are all inert — unused by the
// extension but required by ResourceConfig's type signature. formSections/
// schema previously pointed at fields.ts/schema.ts's own field list and Zod
// schema (a parallel, unreachable "generic dialog" definition of this entity
// — PropertyListRenderer routes every action except delete straight to the
// real Wizard instead of CRMResourcePage's generic add/edit/view dialogs).
// Retired — see the Rank #4 Architecture Debt Certification Report.

export const propertiesConfig: ResourceConfig<RealEstateProperty> = {
  endpoint:  '/RealEstateProperty',
  queryKey:  'realEstateProperties',

  columns:      [],   // unused — listRenderer provides its own display
  formSections: [],   // unused — generic add/edit dialog is never opened for Properties
  schema:       z.object({}), // unused — same reason as formSections
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
