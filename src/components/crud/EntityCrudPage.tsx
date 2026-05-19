'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import type { EntityConfig } from '@/lib/entityConfigs'
import { getEntityList, createEntity, updateEntity, deleteEntity } from '@/api/espocrm/entityService'

type Row = Record<string, unknown>
type FormValues = Record<string, string | number | undefined>

const PAGE_SIZE = 20

function buildSchema(config: EntityConfig) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const f of config.fields) {
    let s: z.ZodTypeAny = f.type === 'email'
      ? z.string().email('Invalid email')
      : f.type === 'number'
      ? z.coerce.number()
      : z.string()
    if (!f.required) s = s.optional().or(z.literal(''))
    shape[f.name] = s
  }
  return z.object(shape)
}

export function EntityCrudPage({ config }: { config: EntityConfig }) {
  const [rows, setRows]           = useState<Row[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(false)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow]     = useState<Row | null>(null)
  const [deleteId, setDeleteId]   = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const schema = buildSchema(config)
  const emptyValues = Object.fromEntries(config.fields.map((f) => [f.name, ''])) as FormValues

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getEntityList<Row>(config.entityType, {
        maxSize: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        textFilter: search || undefined,
      })
      setRows(res.list)
      setTotal(res.total)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [config.entityType, page, search])

  useEffect(() => { loadData() }, [loadData])

  const openAdd = () => {
    setEditRow(null)
    form.reset(emptyValues)
    setModalOpen(true)
  }

  const openEdit = (row: Row) => {
    setEditRow(row)
    form.reset(Object.fromEntries(config.fields.map((f) => [f.name, row[f.name] ?? ''])) as FormValues)
    setModalOpen(true)
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      if (editRow) {
        await updateEntity(config.entityType, editRow.id as string, values)
        toast.success('Updated successfully')
      } else {
        await createEntity(config.entityType, values)
        toast.success('Created successfully')
      }
      setModalOpen(false)
      loadData()
    } catch {
      toast.error('Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await deleteEntity(config.entityType, deleteId)
      toast.success('Deleted successfully')
      setDeleteId(null)
      loadData()
    } catch {
      toast.error('Delete failed')
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{config.title}</h1>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" /> Add New
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={`Search ${config.title}...`}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {config.columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={config.columns.length + 1} className="py-12 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={config.columns.length + 1} className="py-12 text-center text-muted-foreground">
                  No records found
                </TableCell>
              </TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id as string}>
                {config.columns.map((col) => (
                  <TableCell key={col.key}>{String(row[col.key] ?? '—')}</TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.id as string)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} total records</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span>Page {page + 1} of {totalPages}</span>
            <Button variant="outline" size="icon" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editRow ? `Edit ${config.title.replace(/s$/, '')}` : `Add ${config.title.replace(/s$/, '')}`}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              {config.fields.map((fieldCfg) => (
                <FormField
                  key={fieldCfg.name}
                  control={form.control}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  name={fieldCfg.name as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {fieldCfg.label}
                        {fieldCfg.required && <span className="text-destructive ml-1">*</span>}
                      </FormLabel>
                      <FormControl>
                        {fieldCfg.type === 'textarea' ? (
                          <Textarea
                            {...field}
                            value={(field.value as string) ?? ''}
                            placeholder={fieldCfg.placeholder}
                            rows={fieldCfg.rows ?? 3}
                          />
                        ) : fieldCfg.type === 'select' ? (
                          <Select
                            value={(field.value as string) ?? ''}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${fieldCfg.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldCfg.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            {...field}
                            value={(field.value as string) ?? ''}
                            type={
                              fieldCfg.type === 'email'  ? 'email'  :
                              fieldCfg.type === 'number' ? 'number' :
                              fieldCfg.type === 'date'   ? 'date'   : 'text'
                            }
                            placeholder={fieldCfg.placeholder}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editRow ? 'Save Changes' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}