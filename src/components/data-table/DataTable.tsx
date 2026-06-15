'use client'

import { useState, useMemo, useCallback, useEffect, type ReactNode } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef as TColumnDef,
  type SortingState,
  type RowSelectionState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import {
  ArrowUp, ArrowDown, ArrowUpDown,
  AlertCircle, Image as ImageIcon,
  LayoutGrid, List,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import axiosClient from '@/api/axiosClient'

import { TableToolbar } from './TableToolbar'
import { TablePagination } from './TablePagination'
import { TableRowActions } from './TableRowActions'
import { TableBulkActions } from './TableBulkActions'
import { ColumnVisibility } from './ColumnVisibility'
import { StatusBadge } from './StatusBadge'
import { EmptyState } from './EmptyState'
import { SkeletonLoader } from './SkeletonLoader'
import { DataGridView } from './DataGridView'
import { QuickFilterBar } from './QuickFilterBar'
import { RowDetailsDrawer } from './RowDetailsDrawer'
import type { DataTableProps, ColumnConfig, ApiResponse, QuickFilter, ViewMode } from './types'

// ── Avatar helpers ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-primary/10 text-primary',
  'bg-brand-emerald-soft text-brand-emerald',
  'bg-brand-azure-soft text-brand-azure',
  'bg-brand-teal-soft text-brand-teal',
  'bg-brand-lavender-soft text-brand-lavender',
  'bg-chart-4/15 text-chart-4',
] as const

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function avatarColor(name: string): string {
  let h = 0
  for (const ch of name) h = ((h * 31) + ch.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function AvatarCell({ name, imageSrc }: { name: string; imageSrc?: string }) {
  if (imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageSrc} alt={name} className="h-9 w-9 shrink-0 rounded-lg object-cover" />
    )
  }
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold',
        avatarColor(name),
      )}
    >
      {getInitials(name) || '?'}
    </div>
  )
}

// ── Avatar stack ──────────────────────────────────────────────────────────────

const STACK_COLORS = [
  'bg-primary/10 text-primary',
  'bg-brand-emerald-soft text-brand-emerald',
  'bg-brand-azure-soft text-brand-azure',
  'bg-brand-lavender-soft text-brand-lavender',
] as const

function AvatarStackCell({ count }: { count: number }) {
  const shown = Math.min(3, count)
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {Array.from({ length: shown }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[9px] font-bold',
              STACK_COLORS[i % STACK_COLORS.length],
            )}
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
      {count > 0 && (
        <span className="text-[12px] font-medium text-muted-foreground">+{count}</span>
      )}
    </div>
  )
}

// ── Cell renderer ─────────────────────────────────────────────────────────────

function renderCell<T extends object>(
  col: ColumnConfig<T>,
  value: unknown,
  row: T,
): ReactNode {
  switch (col.type) {
    case 'avatar': {
      const r = row as Record<string, unknown>
      const name = String(value ?? '')
      const sub = col.subtitleKey ? String(r[col.subtitleKey] ?? '') : undefined
      const imgSrc = col.imageKey ? String(r[col.imageKey] ?? '') : undefined
      return (
        <div className="flex items-center gap-3 min-w-0">
          <AvatarCell name={name} imageSrc={imgSrc || undefined} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-snug text-foreground">
              {name || '—'}
            </p>
            {sub && (
              <p className="mt-0.5 truncate text-[12px] leading-snug text-muted-foreground">
                {sub}
              </p>
            )}
          </div>
        </div>
      )
    }

    case 'image': {
      const src = String(value ?? '')
      return src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-10 w-10 rounded-lg object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
        </div>
      )
    }

    case 'avatarStack': {
      const count = typeof value === 'number' ? value : Number(value ?? 0)
      return <AvatarStackCell count={isNaN(count) ? 0 : count} />
    }

    case 'badge':
      return <StatusBadge value={String(value ?? '—')} badgeMap={col.badgeMap} />

    case 'number': {
      const n = Number(value)
      return (
        <span className="tabular-nums text-[13px] text-foreground">
          {isNaN(n) ? '—' : n.toLocaleString('en-US')}
        </span>
      )
    }

    case 'currency': {
      const n = Number(value)
      if (isNaN(n)) return <span className="text-[13px] text-muted-foreground">—</span>
      return (
        <span className="tabular-nums text-[13px] font-semibold text-foreground">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: col.currency ?? 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(n)}
        </span>
      )
    }

    case 'date': {
      if (!value) return <span className="text-[13px] text-muted-foreground">—</span>
      const d = new Date(String(value))
      if (isNaN(d.getTime()))
        return <span className="text-[13px] text-muted-foreground">{String(value)}</span>
      return (
        <span className="text-[13px] text-muted-foreground">
          {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      )
    }

    case 'custom':
      return col.render?.(value, row) ?? null

    default: {
      const s = value == null ? '—' : String(value)
      return <span className="text-[13px] text-foreground">{s || '—'}</span>
    }
  }
}

// ── DataTable ─────────────────────────────────────────────────────────────────

export function DataTable<T extends object>({
  title,
  subtitle,
  endpoint,
  data: staticData,
  totalRows: staticTotal,
  columns: columnConfigs,
  form: Form,
  rowActions = [],
  bulkActions = [],
  searchable = true,
  searchPlaceholder,
  addable = true,
  addLabel = 'Add New',
  pageSize: defaultPageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  showRowNumbers = false,
  showViewToggle = false,
  defaultView = 'list',
  quickFilters,
  rowDetails = false,
  onRowClick,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  isLoading: externalLoading,
  isError: externalError,
  onRefetch,
  className,
}: DataTableProps<T>) {
  const { t } = useTranslation('common')
  const serverMode = !!endpoint
  // In client mode, true when EspoCRM returned more records than were fetched.
  // Drives conditional count display in QuickFilterBar.
  const isTruncated = !serverMode && staticTotal !== undefined && staticTotal > (staticData?.length ?? 0)

  // ── State ──────────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [colVisibility, setColVisibility] = useState<VisibilityState>(
    () =>
      Object.fromEntries(
        columnConfigs.filter((c) => c.defaultHidden).map((c) => [c.key, false]),
      ),
  )
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsRow, setDetailsRow] = useState<T | undefined>()
  const [formOpen, setFormOpen] = useState(false)
  const [editRow, setEditRow] = useState<T | undefined>()

  // ── Debounced search ────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput)
      if (serverMode) setPage(1)
    }, 300)
    return () => clearTimeout(id)
  }, [searchInput, serverMode])

  // ── Client-side quick filter ─────────────────────────────────────────────
  const filteredStaticData = useMemo(() => {
    if (!staticData) return []
    if (
      !activeQuickFilter ||
      activeQuickFilter.value === null ||
      !activeQuickFilter.column
    ) {
      return staticData
    }
    return staticData.filter((row) => {
      const r = row as Record<string, unknown>
      return String(r[activeQuickFilter.column!]) === activeQuickFilter.value
    })
  }, [staticData, activeQuickFilter])

  // ── Filter counts for chips ───────────────────────────────────────────────
  // "All" always uses the EspoCRM total (staticTotal) so it reflects the real
  // dataset size even when the fetch was capped. Individual counts are only
  // computed when the dataset is complete — when truncated they would reflect
  // only the fetched slice, not the full dataset, which would be misleading.
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    if (!staticData) return counts
    counts['__all__'] = staticTotal ?? staticData.length
    if (!isTruncated) {
      for (const f of quickFilters ?? []) {
        if (f.value !== null && f.column) {
          const key = `${f.column}:${f.value}`
          counts[key] = staticData.filter((row) => {
            const r = row as Record<string, unknown>
            return String(r[f.column!]) === f.value
          }).length
        }
      }
    }
    return counts
  }, [staticData, quickFilters, staticTotal, isTruncated])

  // ── React Query (server-side) ───────────────────────────────────────────────
  const qParams = useMemo(
    () => ({
      page,
      pageSize,
      search: search || undefined,
      sortBy: sorting[0]?.id,
      sortDir: (sorting[0]?.desc ? 'desc' : 'asc') as 'asc' | 'desc',
      ...(activeQuickFilter?.column && activeQuickFilter.value !== null
        ? { filterBy: activeQuickFilter.column, filterValue: activeQuickFilter.value }
        : {}),
    }),
    [page, pageSize, search, sorting, activeQuickFilter],
  )

  const {
    data: apiResult,
    isFetching,
    isError: apiError,
    refetch,
  } = useQuery<ApiResponse<T>>({
    queryKey: ['data-table', endpoint, qParams],
    queryFn: async () => {
      const p = new URLSearchParams()
      p.set('page', String(qParams.page))
      p.set('pageSize', String(qParams.pageSize))
      if (qParams.search) p.set('search', qParams.search)
      if (qParams.sortBy) p.set('sortBy', qParams.sortBy)
      p.set('sortDir', qParams.sortDir)
      const q = qParams as Record<string, unknown>
      if (q.filterBy) {
        p.set('filterBy', String(q.filterBy))
        p.set('filterValue', String(q.filterValue ?? ''))
      }
      const res = await axiosClient.get<ApiResponse<T>>(`${endpoint}?${p}`)
      return res.data
    },
    enabled: serverMode,
    placeholderData: keepPreviousData,
  })

  // ── Resolved data ──────────────────────────────────────────────────────────
  const tableData = serverMode ? (apiResult?.data ?? []) : filteredStaticData
  const totalCount = serverMode
    ? (apiResult?.total ?? 0)
    : (staticTotal ?? filteredStaticData.length)
  const isLoading = externalLoading ?? (serverMode && isFetching && !apiResult)
  const isError = externalError ?? (serverMode && apiError)

  // ── TanStack column definitions ────────────────────────────────────────────
  const tanstackCols = useMemo<TColumnDef<T>[]>(() => {
    const cols: TColumnDef<T>[] = []

    if (showRowNumbers) {
      cols.push({
        id: '_no',
        size: 40,
        enableSorting: false,
        enableHiding: false,
        header: () => (
          <span className="text-[12px] font-medium text-muted-foreground">#</span>
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-[12px] text-muted-foreground/50">
            {row.index + 1}
          </span>
        ),
      })
    }

    if (bulkActions.length > 0) {
      cols.push({
        id: '_select',
        size: 40,
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsSomePageRowsSelected()
                ? 'indeterminate'
                : table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all rows"
            className="border-border/70"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Select row"
            className="border-border/70"
          />
        ),
      })
    }

    for (const col of columnConfigs) {
      cols.push({
        id: col.key,
        accessorKey: col.key,
        header: col.label,
        enableSorting: col.sortable ?? false,
        enableHiding: col.hideable !== false,
        cell: ({ getValue, row }) => renderCell(col, getValue(), row.original),
      })
    }

    if (rowActions.length > 0) {
      cols.push({
        id: '_actions',
        size: 52,
        enableSorting: false,
        enableHiding: false,
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <TableRowActions row={row.original} actions={rowActions} />
          </div>
        ),
      })
    }

    return cols
  }, [columnConfigs, bulkActions.length, rowActions, showRowNumbers])

  // ── TanStack Table instance ────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<T>({
    data: tableData,
    columns: tanstackCols,
    state: {
      sorting,
      rowSelection,
      columnVisibility: colVisibility,
      pagination: { pageIndex: page - 1, pageSize },
      globalFilter: serverMode ? undefined : search,
    },
    onSortingChange: (u) => {
      setSorting(typeof u === 'function' ? u(sorting) : u)
      setPage(1)
    },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColVisibility,
    onPaginationChange: (u) => {
      const next =
        typeof u === 'function' ? u({ pageIndex: page - 1, pageSize }) : u
      setPage(next.pageIndex + 1)
      setPageSize(next.pageSize)
    },
    onGlobalFilterChange: serverMode ? undefined : setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: serverMode ? undefined : getFilteredRowModel(),
    getPaginationRowModel: serverMode ? undefined : getPaginationRowModel(),
    manualPagination: serverMode,
    manualSorting: serverMode,
    manualFiltering: serverMode,
    pageCount: serverMode ? Math.ceil(totalCount / pageSize) : undefined,
    rowCount: serverMode ? totalCount : undefined,
    getRowId: (row, idx) => String((row as Record<string, unknown>).id ?? idx),
  })

  // ── Helpers ────────────────────────────────────────────────────────────────
  const visibleColKeys = useMemo(
    () =>
      new Set(
        columnConfigs
          .filter((c) => colVisibility[c.key] !== false)
          .map((c) => c.key),
      ),
    [columnConfigs, colVisibility],
  )

  const handleColToggle = useCallback(
    (key: string) =>
      setColVisibility((prev) => ({ ...prev, [key]: !(prev[key] ?? true) })),
    [],
  )

  const handleAdd = useCallback(() => {
    setEditRow(undefined)
    setFormOpen(true)
  }, [])

  const handleRefetch = onRefetch ?? (serverMode ? () => void refetch() : undefined)

  const handleQuickFilter = useCallback((filter: QuickFilter | null) => {
    setActiveQuickFilter(filter)
    setPage(1)
  }, [])

  const handleRowClick = useCallback(
    (row: T) => {
      if (rowDetails) {
        setDetailsRow(row)
        setDetailsOpen(true)
      }
      onRowClick?.(row)
    },
    [rowDetails, onRowClick],
  )

  // ── Derived display values ─────────────────────────────────────────────────
  const currentPage = serverMode ? page : table.getState().pagination.pageIndex + 1
  const displayTotal = serverMode
    ? totalCount
    : table.getFilteredRowModel().rows.length

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original)
  const colCount = tanstackCols.length
  const firstColKey = columnConfigs[0]?.key
  const isClickable = !!(rowDetails || onRowClick)

  // ── View toggle node ───────────────────────────────────────────────────────
  const viewToggleNode = showViewToggle ? (
    <div className="flex h-8 items-center rounded-md border border-border/60 bg-background p-0.5">
      <button
        onClick={() => setViewMode('list')}
        aria-label={t('table.listView')}
        className={cn(
          'flex h-6 w-7 items-center justify-center rounded transition-colors duration-150',
          viewMode === 'list'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <List className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setViewMode('grid')}
        aria-label={t('table.gridView')}
        className={cn(
          'flex h-6 w-7 items-center justify-center rounded transition-colors duration-150',
          viewMode === 'grid'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
    </div>
  ) : null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-design-sm',
        className,
      )}
    >
      {/* ── Toolbar ── */}
      <TableToolbar
        title={title}
        subtitle={subtitle}
        totalRows={displayTotal}
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder={searchPlaceholder}
        searchable={searchable}
        addable={addable}
        addLabel={addLabel}
        onAdd={Form ? handleAdd : undefined}
        onRefetch={handleRefetch}
        isRefetching={isFetching}
        columnVisibility={
          <ColumnVisibility
            columns={columnConfigs}
            visibleColumns={visibleColKeys}
            onToggle={handleColToggle}
          />
        }
        viewToggle={viewToggleNode}
        bulkActions={
          selectedRows.length > 0 && bulkActions.length > 0 ? (
            <TableBulkActions
              selectedRows={selectedRows}
              actions={bulkActions}
              onClear={() => setRowSelection({})}
            />
          ) : null
        }
      />

      {/* ── Quick filter chips ── */}
      {quickFilters && quickFilters.length > 0 && (
        <QuickFilterBar
          filters={quickFilters}
          activeFilter={activeQuickFilter}
          counts={filterCounts}
          onChange={handleQuickFilter}
        />
      )}

      {/* ── Grid view ── */}
      {viewMode === 'grid' && (
        <div className="min-h-0 flex-1 overflow-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
                <div key={i} className="h-52 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : (
            <DataGridView
              rows={table.getRowModel().rows.map((r) => r.original)}
              columns={columnConfigs}
              rowActions={rowActions}
              onRowClick={isClickable ? handleRowClick : undefined}
            />
          )}
        </div>
      )}

      {/* ── Table (list) view ── */}
      {viewMode === 'list' && (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left">

            {/* ── Sticky header ── */}
            <thead className="sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) => (
                <tr
                  key={hg.id}
                  className="border-b border-border/60 bg-muted/30 shadow-[0_1px_0_0_rgba(16,24,40,0.04)]"
                >
                  {hg.headers.map((header) => {
                    const cfg = columnConfigs.find((c) => c.key === header.id)
                    const isSel   = header.id === '_select'
                    const isNo    = header.id === '_no'
                    const isAct   = header.id === '_actions'
                    const isFirst = header.id === firstColKey
                    return (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          'whitespace-nowrap py-2.5 text-[12px] font-medium text-muted-foreground',
                          (isSel || isNo) && 'w-10 pl-4 pr-2',
                          isAct && 'pr-4',
                          !isSel && !isNo && !isAct && 'px-4',
                          isFirst && !isSel && !isNo && 'pl-5',
                          cfg?.responsive === 'sm' && 'hidden sm:table-cell',
                          cfg?.responsive === 'md' && 'hidden md:table-cell',
                          cfg?.responsive === 'lg' && 'hidden lg:table-cell',
                          cfg?.responsive === 'xl' && 'hidden xl:table-cell',
                          header.column.getCanSort() &&
                            'cursor-pointer select-none transition-colors duration-150 hover:text-foreground',
                        )}
                      >
                        {!header.isPlaceholder && (
                          <span className="flex items-center gap-1.5">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() &&
                              (header.column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="h-3 w-3 shrink-0 text-primary" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="h-3 w-3 shrink-0 text-primary" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 shrink-0 opacity-20" />
                              ))}
                          </span>
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>

            {/* ── Body ── */}
            <tbody>
              {isLoading ? (
                <SkeletonLoader
                  rows={Math.min(pageSize, 10)}
                  columns={columnConfigs.length}
                  hasCheckbox={bulkActions.length > 0}
                  hasActions={rowActions.length > 0}
                />
              ) : isError ? (
                <tr>
                  <td colSpan={colCount} className="py-16 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/8 ring-1 ring-destructive/20">
                        <AlertCircle className="h-6 w-6 text-destructive/70" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {t('table.failedToLoad')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('table.failedToLoadHint')}
                      </p>
                      {handleRefetch && (
                        <Button variant="outline" size="sm" onClick={handleRefetch}>
                          {t('table.tryAgain')}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <EmptyState
                  colSpan={colCount}
                  icon={emptyIcon}
                  title={emptyTitle ?? t('table.noResults')}
                  description={emptyDescription ?? t('table.noResultsHint')}
                />
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-selected={row.getIsSelected() || undefined}
                    onClick={() => handleRowClick(row.original)}
                    className={cn(
                      'group border-b border-border/20 transition-colors duration-100 last:border-0',
                      'even:bg-muted/3',
                      'hover:bg-primary/2.5',
                      row.getIsSelected() && 'bg-accent/40 hover:bg-accent/50',
                      isClickable && 'cursor-pointer',
                    )}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const cfg    = columnConfigs.find((c) => c.key === cell.column.id)
                      const isSel  = cell.column.id === '_select'
                      const isNo   = cell.column.id === '_no'
                      const isAct  = cell.column.id === '_actions'
                      const isFirst = cell.column.id === firstColKey
                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            'py-3.5 align-middle',
                            (isSel || isNo) && 'w-10 pl-4 pr-2',
                            isAct && 'pr-4',
                            !isSel && !isNo && !isAct && 'px-4',
                            isFirst && !isSel && !isNo && 'pl-5',
                            cfg?.responsive === 'sm' && 'hidden sm:table-cell',
                            cfg?.responsive === 'md' && 'hidden md:table-cell',
                            cfg?.responsive === 'lg' && 'hidden lg:table-cell',
                            cfg?.responsive === 'xl' && 'hidden xl:table-cell',
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {!isLoading && displayTotal > 0 && (
        <TablePagination
          page={currentPage}
          pageSize={pageSize}
          total={displayTotal}
          pageSizeOptions={pageSizeOptions}
          onPageChange={serverMode ? setPage : (p) => table.setPageIndex(p - 1)}
          onPageSizeChange={(size) => {
            if (serverMode) {
              setPageSize(size)
              setPage(1)
            } else {
              table.setPageSize(size)
            }
          }}
        />
      )}

      {/* ── Row Details Drawer ── */}
      {rowDetails && (
        <RowDetailsDrawer
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          row={detailsRow}
          columns={columnConfigs}
          rowActions={rowActions}
          renderContent={
            typeof rowDetails === 'function' ? rowDetails : undefined
          }
        />
      )}

      {/* ── Dynamic Form Modal ── */}
      {Form && formOpen && (
        <Form
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSuccess={() => {
            setFormOpen(false)
            handleRefetch?.()
          }}
          initialData={editRow}
          mode={editRow ? 'edit' : 'create'}
        />
      )}
    </div>
  )
}
