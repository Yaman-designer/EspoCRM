// Entity-agnostic utilities shared by every Details-page implementation
// (Property today; Contact/Company/Vehicle/Employee/Project in the future).
// Nothing in this folder may import from `src/features/**` — see this
// repo's Enterprise Architecture Hardening pass (2026-07-23) for why.

export { buildOptionalRows, type Row } from './rows'
export { formatDateGB, formatRelativeTime, toEpochMs } from './date'
export { isMeaningfulAddressFragment, joinAddressParts, firstNonEmpty } from './address'
export { isImageAttachment, getAttachmentTypeLabel } from './attachments'
export { buildEntitySlug } from './slug'
export type { PillTone } from './tone'
