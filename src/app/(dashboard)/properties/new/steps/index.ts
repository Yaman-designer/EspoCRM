// ── Property Wizard step schemas ──────────────────────────────────────────
// 8 approved steps (Property Wizard Engineering Execution Plan, Phases 2-6,
// completed). The old per-step files this reorg replaced (identity,
// location, financial, specifications, features, media schemas +
// migration-utils.ts's pruning helper) were deleted in Phase 8 once every
// field was confirmed migrated - see the Release Readiness Review's
// Traceability Matrix and Cleanup Matrix for the full audit trail.
export { buildIdentityGovernanceStep } from './identity-governance.schema'
export { buildLocationZoningStep } from './location-zoning.schema'
export { pricingTermsSchema } from './pricing-terms.schema'
export { sizeRoomsStructureSchema } from './size-rooms-structure.schema'
export { constructionSystemsSchema } from './construction-systems.schema'
export { outdoorBuildingAmenitiesSchema } from './outdoor-building-amenities.schema'
export { marketingMediaSchema } from './marketing-media.schema'
export { ReviewStep } from './ReviewStep'
