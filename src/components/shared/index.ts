// Entity-agnostic presentation primitives for Details pages (Property
// today; Contact/Company/Vehicle/Employee/Project in the future). Pure UI —
// no entity coupling, no data fetching. See src/shared/detail-view for the
// data-layer counterpart (formatters/mappers).

export { SectionHeader } from './SectionHeader'
export { EmptyState } from './EmptyState'
export { AvatarInitial } from './AvatarInitial'
export { DefinitionList } from './DefinitionList'
export { InfoRow } from './InfoRow'
export { TonePill } from './TonePill'
export { MediaLightbox, type MediaLightboxProps } from './MediaLightbox'
export { SecondaryButton, type SecondaryButtonProps } from './SecondaryButton'
export { IconActionButton } from './IconActionButton'
export { FeedbackState, type FeedbackVariant } from './FeedbackState'
