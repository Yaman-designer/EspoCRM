/**
 * Built-in plugin factories for FormFramework.
 * Each factory returns a FormFrameworkPlugin that can be passed via the
 * `plugins` prop without modifying core framework components.
 *
 * Usage:
 *   import { createKeyboardPlugin, createAnalyticsPlugin } from './plugins'
 *   <FormFramework plugins={[createKeyboardPlugin(), createAnalyticsPlugin({ … })]} …>
 */

import type { FormFrameworkPlugin } from './types'

/* ─── Keyboard navigation plugin ─────────────────────────────────
   Adds arrow-key step navigation and optional Enter-to-continue.
   Only fires when focus is NOT inside a form control.
────────────────────────────────────────────────────────────────── */

export interface KeyboardPluginOptions {
  /** Navigate steps with ← → arrow keys. Default: true */
  arrowKeys?: boolean
  /** Press Enter anywhere (outside inputs) to advance. Default: false */
  enterToNext?: boolean
}

export function createKeyboardPlugin(
  options: KeyboardPluginOptions = {},
): FormFrameworkPlugin {
  const { arrowKeys = true, enterToNext = false } = options

  return {
    name: 'keyboard',

    onMount(ctx) {
      const isFormControl = (el: EventTarget | null) =>
        el instanceof HTMLElement &&
        el.closest('input, textarea, select, [contenteditable], button')

      const handler = (e: KeyboardEvent) => {
        if (isFormControl(e.target)) return
        if (ctx.isAnimating) return

        if (arrowKeys) {
          if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            ctx.goNext()
          }
          if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            ctx.goPrevious()
          }
        }

        if (enterToNext && e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          ctx.goNext()
        }
      }

      window.addEventListener('keydown', handler)
      return () => window.removeEventListener('keydown', handler)
    },
  }
}

/* ─── Autosave plugin ─────────────────────────────────────────────
   Periodically calls onSave and updates save state.
────────────────────────────────────────────────────────────────── */

export interface AutosavePluginOptions {
  /** Interval in ms. Default: 30 000 (30 s) */
  interval?: number
  /** Called with current form values. Must return a Promise. */
  onSave: (values: Record<string, unknown>) => Promise<void>
  /** Returns the current form values — e.g. () => form.getValues() */
  getValues: () => Record<string, unknown>
  /** Only autosave when the form is dirty. Default: true */
  onlyWhenDirty?: boolean
}

export function createAutosavePlugin(
  options: AutosavePluginOptions,
): FormFrameworkPlugin {
  const { interval = 30_000, onSave, getValues, onlyWhenDirty = true } = options

  return {
    name: 'autosave',

    onMount(ctx) {
      const id = setInterval(async () => {
        if (onlyWhenDirty && !ctx.isDirty) return
        ctx.setSaveState({ status: 'saving_draft' })
        try {
          await onSave(getValues())
          ctx.setSaveState({ status: 'autosaved', savedAt: new Date() })
        } catch {
          ctx.setSaveState({ status: 'failed' })
        }
      }, interval)

      return () => clearInterval(id)
    },
  }
}

/* ─── Analytics plugin ────────────────────────────────────────────
   Fires tracking events at key lifecycle moments.
────────────────────────────────────────────────────────────────── */

export interface AnalyticsPluginOptions {
  onFormStart?: (config: { entityLabel?: string; totalSteps: number }) => void
  onStepView?: (stepId: string, stepIndex: number, totalSteps: number) => void
  onFormComplete?: (entityLabel?: string) => void
  onFormAbandon?: (lastStepIndex: number, totalSteps: number) => void
}

export function createAnalyticsPlugin(
  options: AnalyticsPluginOptions,
): FormFrameworkPlugin {
  return {
    name: 'analytics',

    onMount(ctx) {
      options.onFormStart?.({
        entityLabel: ctx.config.entityLabel,
        totalSteps: ctx.totalSteps,
      })
      options.onStepView?.(
        ctx.config.steps[0]?.id ?? '',
        0,
        ctx.totalSteps,
      )

      return () => {
        /* On unmount without full completion → abandon */
        if (!ctx.completedSteps.has(ctx.totalSteps - 1)) {
          options.onFormAbandon?.(ctx.currentStepIndex, ctx.totalSteps)
        }
      }
    },

    onStepChange(ctx) {
      const stepId = ctx.config.steps[ctx.currentStepIndex]?.id ?? ''
      options.onStepView?.(stepId, ctx.currentStepIndex, ctx.totalSteps)
    },
  }
}

/* ─── Permissions plugin ──────────────────────────────────────────
   Blocks forward navigation if the current user lacks a permission.
────────────────────────────────────────────────────────────────── */

export interface PermissionsPluginOptions {
  /**
   * Map of stepId → required permission string.
   * If the canAccess function returns false for the required permission,
   * the user cannot advance past that step.
   */
  stepPermissions: Record<string, string>
  /** Return true if the current user has the given permission */
  canAccess: (permission: string) => boolean | Promise<boolean>
  /** Called when access is denied */
  onDenied?: (stepId: string, permission: string) => void
}

export function createPermissionsPlugin(
  options: PermissionsPluginOptions,
): FormFrameworkPlugin {
  return {
    name: 'permissions',

    async onBeforeNext(ctx) {
      const stepId = ctx.config.steps[ctx.currentStepIndex]?.id ?? ''
      const required = options.stepPermissions[stepId]
      if (!required) return true

      const allowed = await options.canAccess(required)
      if (!allowed) {
        options.onDenied?.(stepId, required)
        return false
      }
      return true
    },
  }
}

/* ─── Progress persistence plugin ────────────────────────────────
   Saves/restores which steps are complete via localStorage.
────────────────────────────────────────────────────────────────── */

export interface ProgressPluginOptions {
  /** localStorage key to store progress under */
  storageKey: string
}

export function createProgressPlugin(
  options: ProgressPluginOptions,
): FormFrameworkPlugin {
  return {
    name: 'progress',

    onMount(ctx) {
      /* Restore on mount */
      try {
        const raw = localStorage.getItem(options.storageKey)
        if (raw) {
          const indices: number[] = JSON.parse(raw)
          indices.forEach(i => ctx.markStepComplete(i))
        }
      } catch { /* ignore */ }

      return () => {
        /* Persist on unmount */
        try {
          const indices = Array.from(ctx.completedSteps)
          localStorage.setItem(options.storageKey, JSON.stringify(indices))
        } catch { /* ignore */ }
      }
    },

    onStepChange(ctx) {
      try {
        const indices = Array.from(ctx.completedSteps)
        localStorage.setItem(options.storageKey, JSON.stringify(indices))
      } catch { /* ignore */ }
    },
  }
}
