// ── Domain types ───────────────────────────────────────────────────────────────

export const PIPELINE_STAGES = [
  'Qualification',
  'Proposal',
  'Negotiation',
  'Closing',
  'Post-Sale',
] as const

export const PIPELINE_STATUSES = ['Open', 'Won', 'Lost', 'On Hold'] as const

export type PipelineStage = (typeof PIPELINE_STAGES)[number]
export type PipelineStatus = (typeof PIPELINE_STATUSES)[number]

// ── Main entity ────────────────────────────────────────────────────────────────

export interface Pipeline {
  id: string
  title: string
  stage: PipelineStage
  status: PipelineStatus
  value: number
  probability: number
  owner: string
  ownerEmail?: string
  company: string
  notes?: string
  closingDate?: string
  createdAt: string
  updatedAt: string
}

// ── API select option ──────────────────────────────────────────────────────────

export interface SelectOption {
  id: string
  name: string
}
