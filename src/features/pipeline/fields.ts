import { PIPELINE_STAGES, PIPELINE_STATUSES } from './types'

// ── Stage select options ───────────────────────────────────────────────────────

export const STAGE_OPTIONS = PIPELINE_STAGES.map((s) => ({ label: s, value: s }))

// ── Status select options ──────────────────────────────────────────────────────

export const STATUS_OPTIONS = PIPELINE_STATUSES.map((s) => ({ label: s, value: s }))

// ── Probability quick-picks ────────────────────────────────────────────────────

export const PROBABILITY_PRESETS = [10, 25, 50, 75, 90, 100] as const

// ── Stage → badge variant map ─────────────────────────────────────────────────
// Used by columns.tsx to drive StatusBadge colours

export const STAGE_BADGE_MAP: Record<string, string> = {
  Qualification: 'info',
  Proposal:      'negotiating',
  Negotiation:   'warning',
  Closing:       'on-process',
  'Post-Sale':   'won',
}

// ── Status → badge variant map ────────────────────────────────────────────────

export const STATUS_BADGE_MAP: Record<string, string> = {
  Open:       'info',
  Won:        'won',
  Lost:       'cancelled',
  'On Hold':  'warning',
}
