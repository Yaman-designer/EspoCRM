// ── Form values (contactsIds is a single string in the select, not an array) ──

export interface PipelineFormValues {
  id?: string
  assignedUserId?: string
  teamsIds?: string[]
  contactsIds?: string
  contactType?: string
  status2?: string
  dateStart?: string
  description?: string
}

// ── EspoCRM pipeline entity (CPipeline) ───────────────────────────────────────

export interface Pipeline {
  id: string
  status: string
  status2: string
  contactType: string
  dateStart: string
  dateEnd: string
  description: string | null
  assignedUserId: string
  assignedUserName: string
  teamsIds: string[]
  teamsNames: Record<string, string>
  realEstatePropertiesIds: string[]
  realEstatePropertiesNames: Record<string, string>
  contactsIds: string[]
  contactsNames: Record<string, string>
  createdById: string
}

// ── Kanban API response (for future Kanban board view) ───────────────────────
// EspoCRM /Kanban/{Entity} returns {total, groups[]} — NOT a top-level list.
// For the flat DataTable view use /CPipeline which returns {total, list[]}.

export interface KanbanGroup {
  name: string
  total: number
  list: Pipeline[]
  label: string | null
  style: string | null
}

export interface KanbanResponse {
  total: number
  groups: KanbanGroup[]
}
