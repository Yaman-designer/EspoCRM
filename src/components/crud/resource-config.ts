import type { ComponentType } from 'react'
import type { ZodType } from 'zod'
import type { ColumnConfig, QuickFilter, BadgeVariant } from '@/components/data-table'
import type { FormSectionConfig } from '@/components/dynamic-form/types'
import type { BreadcrumbEntry } from '@/components/dashboard/PageHeader'
import type { ResourceExtensions } from './resource-extensions'

// ── View panel field definition ───────────────────────────────────────────────

/**
 * Declares how a single field is rendered inside ConfiguredViewPanel.
 * Pure data — no function props, no render escapes.
 *
 * For entities that need custom view panel content (nested objects, composite
 * values, special formatting), use a custom entity page instead of CRMResourcePage.
 */
export interface ViewFieldDef<T> {
  /** Key on the entity row to read the value from. */
  key: keyof T & string

  /** Label shown on the left side of the field row. */
  label: string

  /**
   * How the value is rendered on the right side.
   * - 'text'     (default) plain string, or '—' if empty
   * - 'badge'    StatusBadge — optionally mapped via badgeMap
   * - 'date'     localised short date  (e.g. Jun 14, 2026)
   * - 'datetime' localised long date + time  (e.g. 14 June 2026, 10:30)
   */
  type?: 'text' | 'badge' | 'date' | 'datetime'

  /** For type 'badge': maps raw values to badge variants. */
  badgeMap?: Record<string, BadgeVariant>
}

// ── ResourceConfig ────────────────────────────────────────────────────────────

/**
 * Configuration contract for CRMResourcePage.
 *
 * Hard cap: only entity-specific DATA lives here (endpoint, columns, schema,
 * view fields, page metadata). No behavioral callbacks. No render functions.
 * No escape-hatch props.
 *
 * If an entity cannot be expressed with this config it gets a custom page —
 * it does NOT add a new prop here.
 */
export interface ResourceConfig<T extends { id: string }> {

  // ── API ─────────────────────────────────────────────────────────────────────

  /** EspoCRM entity endpoint, e.g. '/Contact', '/Call'. */
  endpoint: string

  /** React Query cache key — also used as prefix for invalidateQueries. */
  queryKey: string

  /**
   * Optional query parameters for the list request.
   * Defaults: maxSize 200, orderBy 'createdAt', order 'desc'.
   * Override orderBy/order when the entity has a domain-specific default sort
   * (e.g. Pipeline orders by 'dateStart').
   */
  queryParams?: {
    orderBy?: string
    order?:   'asc' | 'desc'
    maxSize?: number
  }

  // ── Table ───────────────────────────────────────────────────────────────────

  /** DataTable column definitions. */
  columns: ColumnConfig<T>[]

  /** Quick-filter chips rendered below the DataTable toolbar. */
  quickFilters?: QuickFilter[]

  // ── Form ────────────────────────────────────────────────────────────────────

  /** DynamicForm section configuration (field list, labels, types). */
  formSections: FormSectionConfig[]

  /** Zod schema for form validation. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: ZodType<any>

  /**
   * Optional transform applied to a row before it populates the edit form.
   * Use when the stored entity shape differs from the form field shape —
   * e.g. extracting the first element of an array into a single-select field,
   * stripping sentinel values, or truncating a datetime string to date-only.
   * When omitted the raw row is passed through unchanged.
   */
  editDataTransform?: (row: T) => Partial<Record<string, unknown>>

  /**
   * Optional transform applied to validated form values before submission.
   * Use to derive computed fields the form does not expose (e.g. auto-generated
   * name, forced status), re-wrap single values into arrays, or adjust date
   * formats to match the API's expected shape.
   * When omitted the form values are submitted as-is.
   */
  formTransformSubmit?: (values: Record<string, unknown>) => Record<string, unknown>

  // ── View panel ───────────────────────────────────────────────────────────────

  /**
   * Fields to render in the view sheet, in display order.
   * Rendered as EntityViewField rows by ConfiguredViewPanel.
   */
  viewFields: ViewFieldDef<T>[]

  // ── Entity identity ──────────────────────────────────────────────────────────

  /**
   * Derives a human-readable name from a row.
   * Used in toast messages and the delete dialog.
   * Example: (c) => `${c.firstName} ${c.lastName}`.trim() || c.id
   */
  getEntityName: (row: T) => string

  // ── Page metadata ────────────────────────────────────────────────────────────

  /** Page heading, e.g. 'Contacts'. */
  title: string

  /** Page sub-heading shown under the title. */
  subtitle?: string

  /** Breadcrumb trail for the PageHeader. */
  breadcrumbs?: BreadcrumbEntry[]

  /** Icon shown in the view sheet header circle. Defaults to Building2. */
  icon?: ComponentType<{ className?: string }>

  /**
   * Icon shown in the add / edit form dialog header.
   * When omitted the dialog header renders no icon circle — only the title.
   * Supply this when the entity's form currently has a branded icon and
   * removing it would shift the title's horizontal position.
   */
  formIcon?: ComponentType<{ className?: string }>

  /**
   * Singular form of the entity name.
   * Defaults to stripping a trailing 's' from title (fine for Contacts, Calls,
   * Contracts, Requests). Set explicitly for irregular plurals, e.g. 'Company'.
   */
  entitySingular?: string

  /**
   * Row key whose value is shown as the subtitle under the entity name in the
   * view sheet header, e.g. 'assignedUserName'.
   * Must be a string-valued key on T.
   */
  assignedUserKey?: keyof T & string

  // ── DataTable overrides (all have sensible defaults) ─────────────────────────

  /** Override the form dialog title. Defaults to 'Add {singular}' / 'Edit {singular}'. */
  formTitle?: string

  /** Override the delete dialog title. Defaults to 'Delete {singular}'. */
  deleteTitle?: string

  /** Override the DataTable search placeholder. */
  searchPlaceholder?: string

  /** Override the Add button label. */
  addLabel?: string

  /** Override the empty-state title. */
  emptyTitle?: string

  /** Override the empty-state description. */
  emptyDescription?: string

  /** DataTable page size. Defaults to 10. */
  pageSize?: number

  /** DataTable page size options. Defaults to [10, 20, 50]. */
  pageSizeOptions?: number[]

  /** Show sequential row numbers. Defaults to true. */
  showRowNumbers?: boolean

  /** Show list/grid view toggle. Defaults to true. */
  showViewToggle?: boolean

  /**
   * Optional presentation extension plugins.
   * Supply listRenderer when the entity needs server-side filtering or custom
   * card/grid UI; supply viewRenderer when it needs a custom view sheet beyond
   * ConfiguredViewPanel. The framework retains ownership of all CRUD mutations
   * and dialogs regardless of which extensions are set.
   */
  extensions?: ResourceExtensions<T>
}
