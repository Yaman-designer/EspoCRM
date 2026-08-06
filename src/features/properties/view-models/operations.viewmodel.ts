import type { RealEstateProperty } from '../types/property.types'
import { getDataCompleteness } from '../lib/data-completeness'
import { formatDateGB } from '@/shared/detail-view'
import {
  getCommandHubStatusBgClass,
  getCommandHubStatusDotClass,
  getCommandHubStatusSubKey,
} from '../lib/mappers/status-presentation'

// Fields tracked in getDataCompleteness's missing[] — must stay in sync with
// that function's own internal tracking (same coupling the original inline
// constant had).
const TOTAL_TRACKED = 7

export interface OperationsListingInfo {
  availableFrom: string
  nextUpdate: string
  // Enterprise Localization pass (2026-07-24): was a hardcoded 'Yes'/'No'/''
  // string — that's UI presentation of a boolean, not API data, so it needs
  // to be translated: emitting the raw tri-state instead and letting
  // OperationsCommandHub.tsx resolve it via t('properties:common.yes'/'no')
  // keeps this file free of hardcoded English (and free of a React/i18n
  // import, which the architecture boundary for view-models/** forbids).
  keysHeld: boolean | null
  sold: boolean | null
  ownerAccount: string
  teams: string
}

export interface OperationsViewModel {
  isAvailable: boolean
  statusValue: string
  statusDotClass: string
  statusBgClass: string
  // Translation-key suffix (operations.commandHubStatusSub.<key>), not
  // display text — see status-presentation.ts's getCommandHubStatusSubKey.
  // OperationsCommandHub.tsx resolves the actual sub-label via t(), same
  // "no i18n import in view-models/**" boundary as this file's other fields.
  statusSub: string
  propertyInfoParts: string[]
  propertyCode?: string
  listingInfo: OperationsListingInfo
  assignedAgentName?: string
  assignedAgentInitial: string | null
  callCount: number
  meetingCount: number
  taskCount: number
  hasActivity: boolean
  officeNotes?: string
  aiEvaluatorNotes?: string
  completenessScore: number
  // Enterprise Localization pass (2026-07-24): was a pre-built
  // `completenessSummary: string` ("Missing X, Y" / "All N fields
  // complete") — that sentence template is static UI copy that needs
  // translating, which this data-only file can't do (no React/i18n
  // imports, per the architecture boundary). Raw parts instead;
  // OperationsCommandHub.tsx builds the sentence via t(). Note:
  // `completenessMissingFields`' own entries (e.g. "Photos", "Price") come
  // from data-completeness.ts and are NOT translated in this pass — flagged
  // as a follow-up, not guessed at here.
  completenessMissingFields: string[]
  completenessTotalFields: number
}

/**
 * Shapes everything OperationsCommandHub's sidebar needs. Status-bucket
 * classes/sub-label, the Yes/No/teams-object formatting, the flowing
 * "Property Information" fact list, and the completeness summary sentence
 * used to live inline in the component; all computed here now.
 */
export function buildOperationsViewModel(property: RealEstateProperty): OperationsViewModel {
  const completeness = getDataCompleteness(property)
  const isAvailable  = property.status === 'Active'
  const statusValue  = property.status ?? '—'

  const callCount    = property.calls?.length    ?? 0
  const meetingCount = property.meetings?.length ?? 0
  const taskCount    = property.tasks?.length    ?? 0

  return {
    isAvailable,
    statusValue,
    statusDotClass: getCommandHubStatusDotClass(statusValue, isAvailable),
    statusBgClass:  getCommandHubStatusBgClass(statusValue, isAvailable),
    statusSub:      getCommandHubStatusSubKey(statusValue),
    propertyInfoParts: [property.type, property.category, property.cAssignment].filter((v): v is string => !!v),
    propertyCode: property.propertyCode,
    listingInfo: {
      availableFrom: formatDateGB(property.cAvailableFrom),
      nextUpdate:    formatDateGB(property.nextUpdate),
      keysHeld:      property.keys ?? null,
      sold:          property.cSold ?? null,
      ownerAccount:  property.accountName ?? '',
      teams:         property.teamsNames ? Object.values(property.teamsNames).join(', ') : '',
    },
    assignedAgentName: property.assignedUserName,
    assignedAgentInitial: property.assignedUserName ? property.assignedUserName.charAt(0).toUpperCase() : null,
    callCount,
    meetingCount,
    taskCount,
    hasActivity: callCount + meetingCount + taskCount > 0,
    officeNotes: property.cOfficeNotes,
    aiEvaluatorNotes: property.cPropertyEvaluatorAI,
    completenessScore: completeness.score,
    completenessMissingFields: completeness.missing,
    completenessTotalFields: TOTAL_TRACKED,
  }
}
