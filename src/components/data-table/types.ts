import type { ComponentType, ElementType, ReactNode } from 'react'

// ── View modes (extensible for Kanban, Calendar, Timeline) ────────────────────
export type ViewMode = 'list' | 'grid'

// ── Quick filter chip definition ──────────────────────────────────────────────
export interface QuickFilter {
  label: string
  value: string | null  // null = "All" (clear filter)
  column?: string       // which column key to match against
  badgeVariant?: BadgeVariant
}

// ── Badge variants matching the project's Badge component ──────────────────────
export type BadgeVariant =
  | 'default' | 'secondary' | 'outline' | 'ghost'
  | 'destructive' | 'success' | 'warning' | 'error' | 'info'
  | 'won' | 'negotiating' | 'new-lead' | 'on-process' | 'visit' | 'cancelled'

// ── Column cell types ──────────────────────────────────────────────────────────
export type ColumnType =
  | 'text'
  | 'avatar'      // colored-initials circle + name + optional subtitle line
  | 'badge'       // StatusBadge mapped from string value
  | 'number'      // formatted integer / float
  | 'currency'    // formatted currency amount
  | 'date'        // human-readable date
  | 'image'       // standalone square thumbnail
  | 'avatarStack' // overlapping circles — value is a count (number)
  | 'custom'      // fully custom render function

// ── Column configuration — passed per table ───────────────────────────────────
export interface ColumnConfig<T = object> {
  key: string
  label: string
  type?: ColumnType
  sortable?: boolean
  // false = column cannot be hidden; default: true
  hideable?: boolean
  // start hidden by default
  defaultHidden?: boolean
  // hide column below this breakpoint
  responsive?: 'sm' | 'md' | 'lg' | 'xl'
  align?: 'left' | 'center' | 'right'
  // 'avatar' type: key on the row for the secondary subtitle line (email, role…)
  subtitleKey?: string
  // 'avatar' type: key on the row containing an image URL — shown instead of initials
  imageKey?: string
  // 'badge' type: map raw value → BadgeVariant
  badgeMap?: Record<string, BadgeVariant>
  // 'currency' type: ISO 4217 currency code; defaults to 'USD'
  currency?: string
  // 'custom' type: arbitrary renderer
  render?: (value: unknown, row: T) => ReactNode
}

// ── Per-row action ─────────────────────────────────────────────────────────────
export interface RowAction<T = object> {
  label: string
  icon?: ElementType
  onClick: (row: T) => void
  variant?: 'default' | 'destructive'
  // return true to hide this action for a specific row
  hidden?: (row: T) => boolean
}

// ── Bulk action (shown when rows are selected) ────────────────────────────────
export interface BulkAction<T = object> {
  label: string
  icon?: ElementType
  onClick: (rows: T[]) => void
  variant?: 'default' | 'destructive'
}

// ── Filter definition ─────────────────────────────────────────────────────────
export interface FilterOption {
  label: string
  value: string
}

export interface FilterDef {
  key: string
  label: string
  type: 'select' | 'date-range'
  options?: FilterOption[]
}

// ── Dynamic form props interface ───────────────────────────────────────────────
// Any form component passed as `form` must satisfy this interface
export interface FormProps<T = object> {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  initialData?: Partial<T>
  mode: 'create' | 'edit'
}

// ── Server-side query params ───────────────────────────────────────────────────
export interface ApiQueryParams {
  page: number
  pageSize: number
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  [key: string]: unknown
}

// ── Expected server response shape ────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ── Main DataTable props ───────────────────────────────────────────────────────
export interface DataTableProps<T extends object = object> {
  // Header (title is optional — omit when using an external PageHeader)
  title?: string
  subtitle?: string

  // Data source: provide EITHER endpoint (server-side) OR data (client-side)
  endpoint?: string
  data?: T[]
  totalRows?: number  // required with data[] when you want accurate count

  // Column configuration
  columns: ColumnConfig<T>[]

  // Optional form component for Add / Edit modal
  form?: ComponentType<FormProps<T>>

  // Per-row and bulk actions
  rowActions?: RowAction<T>[]
  bulkActions?: BulkAction<T>[]

  // Toolbar options
  searchable?: boolean
  searchPlaceholder?: string
  addable?: boolean
  addLabel?: string

  // Pagination
  pageSize?: number
  pageSizeOptions?: number[]

  // Show sequential row numbers as the first column
  showRowNumbers?: boolean

  // Show list/grid view toggle buttons in the toolbar
  showViewToggle?: boolean

  // Default view mode (list or grid)
  defaultView?: ViewMode

  // Quick filter chips rendered below the toolbar
  quickFilters?: QuickFilter[]

  // Enable row details drawer on click; pass a function for custom drawer content
  rowDetails?: boolean | ((row: T) => ReactNode)

  // Row click handler
  onRowClick?: (row: T) => void

  // Empty state overrides
  emptyIcon?: ElementType
  emptyTitle?: string
  emptyDescription?: string

  // External loading / error state (for when data is fetched outside)
  isLoading?: boolean
  isError?: boolean
  onRefetch?: () => void

  className?: string
}
