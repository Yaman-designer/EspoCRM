// Shared validation primitives for RealEstateProperty forms - consumed by both
// the legacy Edit dialog (features/properties/schema.ts) and the Create wizard
// (app/(dashboard)/properties/new/steps/*.schema.ts). Previously each system
// declared its own byte-identical copy of these; centralized here so a future
// change updates both forms from one place.

// EspoCRM's built-in "$noBadCharacters" field pattern - rejects ASCII control
// characters (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F) and the Unicode
// line/paragraph-separator code points (U+2028, U+2029), not visible
// punctuation. Named to match the PDF's pattern reference exactly.
export const NO_BAD_CHARACTERS_PATTERN = /^[^\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u2028\u2029]*$/

// Max-length limits shared by the addressCity / addressPostalCode /
// addressCountry / closeTo fields across both form systems.
export const CITY_MAX_LENGTH = 100
export const POSTAL_CODE_MAX_LENGTH = 40
export const COUNTRY_MAX_LENGTH = 100
export const CLOSE_TO_MAX_LENGTH = 255

// Address Business Group, Phase 2 (2026-07-12) — live entityDefs:
// addressStreet { type: 'text', maxLength: 255 }, addressState
// { type: 'varchar', maxLength: 100 }. Same pattern as the constants above.
export const STREET_MAX_LENGTH = 255
export const STATE_MAX_LENGTH = 100

// Enterprise Phase 3.2 (2026-07-17), Finding A. Live entityDefs:
// propertyCode { type: 'varchar', maxLength: 10 } — confirmed via live
// Metadata export, never previously enforced client-side.
export const PROPERTY_CODE_MAX_LENGTH = 10
