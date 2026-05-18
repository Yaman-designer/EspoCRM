'use client'

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import axiosClient from '@/api/axiosClient'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'

import type { DynamicFormProps, FieldConfig, FormSectionConfig } from './types'
import { FormSection } from './FormSection'
import { FormActions } from './FormActions'
import { FieldRenderer } from './FieldRenderer'

// ── Column span map ────────────────────────────────────────────────────────────

const COL_SPAN: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-1 sm:col-span-2',
  3: 'col-span-1 sm:col-span-2 lg:col-span-3',
}

// ── Modal max-width map ────────────────────────────────────────────────────────

const MAX_WIDTH: Record<string, string> = {
  sm:  'sm:max-w-sm',
  md:  'sm:max-w-md',
  lg:  'sm:max-w-lg',
  xl:  'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
}

// ── Build initial form values from section config + external data ──────────────

function buildDefaults(
  sections: FormSectionConfig[],
  externalDefaults?: Record<string, unknown>,
  initialData?: Record<string, unknown>,
): Record<string, unknown> {
  const base: Record<string, unknown> = {}

  for (const section of sections) {
    for (const field of section.fields) {
      if (field.type === 'multi-select' || field.type === 'tags') {
        base[field.name] = []
      } else if (field.type === 'switch' || field.type === 'checkbox') {
        base[field.name] = false
      } else if (field.type === 'number' || field.type === 'currency') {
        base[field.name] = 0
      } else {
        base[field.name] = ''
      }
    }
  }

  return { ...base, ...(externalDefaults ?? {}), ...(initialData ?? {}) }
}

// ── Field types that embed their own label (skip FormLabel wrapper) ────────────

function ownsLabel(field: FieldConfig): boolean {
  return field.type === 'switch' || field.type === 'checkbox'
}

// ── DynamicForm ────────────────────────────────────────────────────────────────

export function DynamicForm<T = Record<string, unknown>>({
  open,
  onClose,
  onSuccess,
  title,
  description,
  icon: Icon,
  sections,
  schema,
  endpoint,
  initialData,
  defaultValues,
  mode = 'create',
  submitLabel,
  maxWidth = '2xl',
  transformSubmit,
}: DynamicFormProps<T>) {
  const { t } = useTranslation('common')
  const isEdit = mode === 'edit'
  const isView = mode === 'view'

  const form = useForm<Record<string, unknown>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: buildDefaults(sections, defaultValues, initialData as Record<string, unknown>),
  })

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(sections, defaultValues, initialData as Record<string, unknown>))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, JSON.stringify(initialData)])

  const watchedValues = form.watch()

  // ── All form field names (used to strip non-form keys before submit) ──────────
  const formFieldNames = new Set(sections.flatMap((s) => s.fields.map((f) => f.name)))

  const mutation = useMutation({
    mutationFn: (raw: Record<string, unknown>) => {
      const stripped = Object.fromEntries(
        Object.entries(raw).filter(([k]) => formFieldNames.has(k)),
      )
      const payload = transformSubmit ? transformSubmit(stripped) : stripped
      const id = (initialData as Record<string, unknown>)?.id
      return isEdit && id
        ? axiosClient.patch(`${endpoint}/${id}`, payload)
        : axiosClient.post(endpoint, payload)
    },
    onSuccess: () => onSuccess?.(),
  })

  const onSubmit = (data: Record<string, unknown>) => mutation.mutate(data)

  const resolvedSubmitLabel =
    submitLabel ?? (isEdit ? t('saveChanges') : `Create ${title.split(' ').pop() ?? ''}`)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={!mutation.isPending}
        className={cn(
          'flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0',
          MAX_WIDTH[maxWidth],
        )}
      >
        {/* ── Header ── */}
        <DialogHeader className="shrink-0 border-b border-border/50 px-6 py-5">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4.5 w-4.5 text-primary" />
              </div>
            )}
            <div>
              <DialogTitle className="text-[15px] font-semibold text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-[12px]">
                {description ?? '​'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Body ── */}
        <Form {...form}>
          <form
            onSubmit={isView ? undefined : form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <ScrollArea className="flex-1">
              <div className="space-y-8 px-6 py-6">
                {sections.map((section) => {
                  const visibleFields = section.fields.filter(
                    (f) => !f.showWhen || f.showWhen(watchedValues),
                  )
                  if (!visibleFields.length) return null

                  return (
                    <FormSection
                      key={section.key}
                      title={section.title}
                      description={section.description}
                      icon={section.icon}
                      columns={section.columns ?? 2}
                    >
                      {visibleFields.map((fieldConfig) => {
                        const inlineLabel = ownsLabel(fieldConfig)

                        return (
                          <div
                            key={fieldConfig.name}
                            className={cn(COL_SPAN[fieldConfig.colSpan ?? 1])}
                          >
                            <FormField
                              control={form.control}
                              name={fieldConfig.name}
                              render={({ field }) => (
                                <FormItem>
                                  {!inlineLabel && (
                                    <FormLabel>
                                      {fieldConfig.label}
                                      {fieldConfig.required && (
                                        <span className="ml-1 text-destructive">*</span>
                                      )}
                                    </FormLabel>
                                  )}
                                  <FormControl>
                                    <FieldRenderer
                                      field={field}
                                      config={{
                                        ...fieldConfig,
                                        disabled: fieldConfig.disabled || isView,
                                        readOnly: fieldConfig.readOnly || isView,
                                      }}
                                    />
                                  </FormControl>
                                  {fieldConfig.description && !inlineLabel && (
                                    <FormDescription>{fieldConfig.description}</FormDescription>
                                  )}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )
                      })}
                    </FormSection>
                  )
                })}
              </div>
            </ScrollArea>

            {/* ── Footer ── */}
            <FormActions
              isSubmitting={mutation.isPending}
              isError={mutation.isError}
              onCancel={onClose}
              submitLabel={resolvedSubmitLabel}
              mode={mode}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
