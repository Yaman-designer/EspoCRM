import { MessageCircle, Headphones, UserRound, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { EspoNotification } from '@/api/espocrm/notificationService'

export const ENTITY_KEY: Record<string, string> = {
  Dialog:            'entity.dialog',
  RealEstateRequest: 'entity.request',
  Contact:           'entity.contact',
  EblaContractParty: 'entity.contractParty',
}

export type EntityConfig = { icon: LucideIcon; bg: string; fg: string }

export const ENTITY_CONFIG: Record<string, EntityConfig> = {
  Dialog:            { icon: MessageCircle, bg: 'bg-emerald-50',  fg: 'text-emerald-600' },
  RealEstateRequest: { icon: Headphones,    bg: 'bg-blue-50',     fg: 'text-blue-600'    },
  Contact:           { icon: UserRound,     bg: 'bg-violet-50',   fg: 'text-violet-600'  },
  EblaContractParty: { icon: Users,         bg: 'bg-slate-100',   fg: 'text-slate-500'   },
}

export const AVATAR_PALETTE = [
  'bg-teal-500', 'bg-blue-500', 'bg-violet-500',
  'bg-orange-500', 'bg-emerald-500', 'bg-rose-500',
]

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function getAvatarColor(name: string): string {
  if (name.toLowerCase() === 'system') return 'bg-slate-400'
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

export function parseUTCDate(s: string): Date {
  return new Date(s.replace(' ', 'T') + 'Z')
}

export function formatDisplayTime(s: string): string {
  const d = parseUTCDate(s)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }
  return (
    d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  )
}

export function dateGroup(s: string): 'today' | 'yesterday' | 'earlier' {
  const d = parseUTCDate(s)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'today'
  const yest = new Date(now)
  yest.setDate(yest.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'yesterday'
  return 'earlier'
}

export function groupNotifications(list: EspoNotification[]) {
  const b: Record<string, EspoNotification[]> = { today: [], yesterday: [], earlier: [] }
  for (const n of list) b[dateGroup(n.createdAt)].push(n)
  return (['today', 'yesterday', 'earlier'] as const)
    .map((key) => ({ key, items: b[key] }))
    .filter((g) => g.items.length > 0)
}

export interface MsgParts {
  actor: string
  prefix: string
  parent: string
  suffix: string
  assignedTo: string | null
}

export function buildMessage(n: EspoNotification, t: (key: string) => string): MsgParts {
  const { noteData } = n
  const actor = noteData.createdByName ?? 'System'
  const parent = noteData.parentName ?? ''
  const entityKey = ENTITY_KEY[noteData.parentType ?? '']
  const ent = entityKey ? t(entityKey) : (noteData.parentType ?? '').toLowerCase()
  const assignedTo = noteData.data?.assignedUserName ?? null

  switch (noteData.type) {
    case 'Post':
      return { actor, prefix: t('actions.postedOn'), parent, suffix: ent, assignedTo: null }
    case 'Create':
      return { actor, prefix: t('actions.created'), parent, suffix: ent, assignedTo: null }
    case 'Assign':
      return { actor, prefix: t('actions.assigned'), parent, suffix: t('actions.to'), assignedTo }
    default:
      return { actor, prefix: t('actions.updated'), parent, suffix: ent, assignedTo: null }
  }
}
