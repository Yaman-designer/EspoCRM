import axiosClient from '@/api/axiosClient'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ResourceKey =
  | 'users'
  | 'companies'
  | 'departments'
  | 'contacts'
  | 'roles'
  | 'countries'
  | 'statuses'

export interface ResourceOption {
  label: string
  value: string
  disabled?: boolean
}

export interface ResourceDef {
  queryKey: readonly unknown[]
  queryFn: () => Promise<ResourceOption[]>
  staleTime: number
}

// ── EspoCRM response shape (list-style endpoints) ─────────────────────────────

interface EspoListResponse<T = Record<string, unknown>> {
  list: T[]
  total: number
}

// ── Helper: map raw API rows to {label, value} ─────────────────────────────────

function mapOptions(
  rows: Record<string, unknown>[],
  labelKey: string,
  valueKey: string,
): ResourceOption[] {
  return rows.map((row) => ({
    label: String(row[labelKey] ?? ''),
    value: String(row[valueKey] ?? ''),
  }))
}

// ── Registry ───────────────────────────────────────────────────────────────────
//
// Each entry is a pure query-config object (no hook calls here).
// FormSelect and standalone resource hooks both read from this registry,
// so React Query deduplicates all matching queryKeys across the app —
// 10 forms using resource: "users" trigger exactly ONE network request.

export const resourceRegistry: Record<ResourceKey, ResourceDef> = {
  users: {
    queryKey: ['resource', 'users'] as const,
    queryFn: () =>
      axiosClient
        .get<EspoListResponse>('/User', {
          params: {
            maxSize: 200,
            offset: 0,
            orderBy: 'name',
            order: 'asc',
            'whereGroup[0][type]': 'primary',
            'whereGroup[0][value]': 'active',
            attributeSelect: 'id,name',
          },
        })
        .then((r) => mapOptions(r.data.list, 'name', 'id')),
    staleTime: 5 * 60 * 1000,
  },

  companies: {
    queryKey: ['resource', 'companies'] as const,
    queryFn: () =>
      axiosClient
        .get<EspoListResponse>('/Account', {
          params: { maxSize: 200, offset: 0, orderBy: 'name', order: 'asc', attributeSelect: 'id,name' },
        })
        .then((r) => mapOptions(r.data.list, 'name', 'id')),
    staleTime: 5 * 60 * 1000,
  },

  departments: {
    queryKey: ['resource', 'departments'] as const,
    queryFn: () =>
      axiosClient
        .get<EspoListResponse>('/Team', {
          params: { maxSize: 200, attributeSelect: 'id,name' },
        })
        .then((r) => mapOptions(r.data.list, 'name', 'id')),
    staleTime: 10 * 60 * 1000,
  },

  contacts: {
    queryKey: ['resource', 'contacts'] as const,
    queryFn: () =>
      axiosClient
        .get<EspoListResponse>('/Contact', {
          params: { maxSize: 200, offset: 0, orderBy: 'name', order: 'asc', attributeSelect: 'id,name' },
        })
        .then((r) => mapOptions(r.data.list, 'name', 'id')),
    staleTime: 5 * 60 * 1000,
  },

  roles: {
    queryKey: ['resource', 'roles'] as const,
    queryFn: () =>
      axiosClient
        .get<{ data: Record<string, unknown>[] }>('/api/roles')
        .then((r) => mapOptions(r.data.data, 'name', 'id')),
    staleTime: 10 * 60 * 1000,
  },

  countries: {
    queryKey: ['resource', 'countries'] as const,
    queryFn: () =>
      axiosClient
        .get<{ data: Record<string, unknown>[] }>('/api/countries')
        .then((r) => mapOptions(r.data.data, 'name', 'code')),
    staleTime: 30 * 60 * 1000,
  },

  statuses: {
    queryKey: ['resource', 'statuses'] as const,
    queryFn: () =>
      axiosClient
        .get<{ data: Record<string, unknown>[] }>('/api/statuses')
        .then((r) => mapOptions(r.data.data, 'label', 'value')),
    staleTime: 10 * 60 * 1000,
  },
}
