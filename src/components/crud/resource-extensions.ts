import type { ComponentType } from 'react'

/**
 * Props passed by CRMResourcePage to a custom list renderer extension.
 *
 * The listRenderer owns its own data fetching (useQuery), filter state, and
 * pagination. The framework passes only action callbacks: onView / onEdit /
 * onDelete open the framework-managed dialogs; onAdd opens the framework's
 * DynamicForm in create mode so the same validation + cache invalidation path
 * applies to all entities.
 */
export interface ListRendererProps<T extends { id: string }> {
  onView:   (row: T) => void
  onEdit:   (row: T) => void
  onDelete: (row: T) => void
  onAdd:    () => void
}

/**
 * Props passed by CRMResourcePage to a custom view renderer extension.
 *
 * The viewRenderer replaces EntityViewSheet entirely — it provides its own
 * <Sheet> wrapper. The framework passes the current row (null/undefined = closed)
 * and action callbacks so the renderer can trigger edit / delete from its footer.
 */
export interface ViewRendererProps<T extends { id: string }> {
  row:     T | null | undefined
  onClose: () => void
  onEdit:  (row: T) => void
  onDelete:(row: T) => void
}

/**
 * Props passed to panelsBefore / panelsAfter extension slots.
 * Useful for KPI cards, charts, or summary panels above / below the list.
 * Only populated in standard (non-listRenderer) mode; listRenderer entities
 * source their own data.
 */
export interface PanelProps<T extends { id: string }> {
  items:      T[]
  total:      number
  isFetching: boolean
}

/**
 * Optional presentation plugins for CRMResourcePage.
 *
 * Extensions let complex entities (e.g. Properties) participate in the shared
 * CRUD engine without a custom page. The framework retains ownership of:
 * add/edit DynamicForm dialogs, EntityDeleteDialog, and all CRUD mutations.
 *
 * listRenderer — use when the entity needs server-side filtering, domain-specific
 *   filter controls (price range, area range, sort), or card/grid display that
 *   cannot be expressed as DataTable rows + QuickFilter chips.
 *
 * viewRenderer — use when the entity needs a custom view sheet (hero image,
 *   gallery, specs grid, agent card) beyond what ConfiguredViewPanel provides.
 */
export interface ResourceExtensions<T extends { id: string }> {
  /** Replaces the DataTable + standard toolbar. Must manage its own data fetching. */
  listRenderer?: ComponentType<ListRendererProps<T>>

  /** Replaces EntityViewSheet. Must render its own <Sheet> wrapper. */
  viewRenderer?: ComponentType<ViewRendererProps<T>>

  /** Panels rendered above the list (standard mode only). */
  panelsBefore?: ComponentType<PanelProps<T>>[]

  /** Panels rendered below the list (standard mode only). */
  panelsAfter?:  ComponentType<PanelProps<T>>[]
}
