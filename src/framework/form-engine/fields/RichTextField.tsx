'use client'

import { useEffect, useMemo, useState } from 'react'
import { Controller } from 'react-hook-form'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Link as LinkExtBase } from '@tiptap/extension-link'
import { Placeholder } from '@tiptap/extensions'
import {
  Bold, Italic, Underline, Strikethrough,
  Pilcrow, Heading2, Heading3,
  List, ListOrdered,
  Quote, Link, Eraser,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, RichTextField as Schema } from '../types'

/* ─── Link extension with Ctrl+K shortcut ────────────────────────── */

const LinkExt = LinkExtBase.extend({
  addKeyboardShortcuts() {
    return {
      'Mod-k': ({ editor }) => {
        const prev = editor.getAttributes('link').href as string | undefined
        const url = window.prompt('Enter URL:', prev ?? 'https://')
        if (url === null) return true
        if (url === '') {
          editor.chain().focus().extendMarkRange('link').unsetLink().run()
          return true
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
        return true
      },
    }
  },
}).configure({
  openOnClick: false,
  HTMLAttributes: {
    class: 'text-primary underline cursor-pointer',
    rel: 'noopener noreferrer',
    target: '_blank',
  },
})

/* ─── Toolbar type system ─────────────────────────────────────────── */

interface ToolbarAction {
  type: 'action'
  id: string
  icon: LucideIcon
  label: string
  shortcut?: string
  command: (editor: Editor) => void
  active: (editor: Editor) => boolean
}

interface ToolbarSeparator { type: 'separator' }

type ToolbarItem = ToolbarAction | ToolbarSeparator

/* ─── All supported toolbar actions ──────────────────────────────── */

const ACTIONS: Record<string, ToolbarAction> = {
  bold: {
    type: 'action', id: 'bold', icon: Bold, label: 'Bold', shortcut: 'Ctrl+B',
    command: e => e.chain().focus().toggleBold().run(),
    active:  e => e.isActive('bold'),
  },
  italic: {
    type: 'action', id: 'italic', icon: Italic, label: 'Italic', shortcut: 'Ctrl+I',
    command: e => e.chain().focus().toggleItalic().run(),
    active:  e => e.isActive('italic'),
  },
  underline: {
    type: 'action', id: 'underline', icon: Underline, label: 'Underline', shortcut: 'Ctrl+U',
    command: e => e.chain().focus().toggleUnderline().run(),
    active:  e => e.isActive('underline'),
  },
  strikethrough: {
    type: 'action', id: 'strikethrough', icon: Strikethrough, label: 'Strikethrough',
    command: e => e.chain().focus().toggleStrike().run(),
    active:  e => e.isActive('strike'),
  },
  paragraph: {
    type: 'action', id: 'paragraph', icon: Pilcrow, label: 'Paragraph',
    command: e => e.chain().focus().setParagraph().run(),
    active:  e => e.isActive('paragraph') && !e.isActive('heading'),
  },
  heading2: {
    type: 'action', id: 'heading2', icon: Heading2, label: 'Heading 2', shortcut: 'Ctrl+Alt+2',
    command: e => e.chain().focus().toggleHeading({ level: 2 }).run(),
    active:  e => e.isActive('heading', { level: 2 }),
  },
  heading3: {
    type: 'action', id: 'heading3', icon: Heading3, label: 'Heading 3', shortcut: 'Ctrl+Alt+3',
    command: e => e.chain().focus().toggleHeading({ level: 3 }).run(),
    active:  e => e.isActive('heading', { level: 3 }),
  },
  list: {
    type: 'action', id: 'list', icon: List, label: 'Bullet List', shortcut: 'Ctrl+Shift+8',
    command: e => e.chain().focus().toggleBulletList().run(),
    active:  e => e.isActive('bulletList'),
  },
  orderedList: {
    type: 'action', id: 'orderedList', icon: ListOrdered, label: 'Numbered List', shortcut: 'Ctrl+Shift+7',
    command: e => e.chain().focus().toggleOrderedList().run(),
    active:  e => e.isActive('orderedList'),
  },
  blockquote: {
    type: 'action', id: 'blockquote', icon: Quote, label: 'Quote',
    command: e => e.chain().focus().toggleBlockquote().run(),
    active:  e => e.isActive('blockquote'),
  },
  link: {
    type: 'action', id: 'link', icon: Link, label: 'Insert Link', shortcut: 'Ctrl+K',
    command: e => {
      const prev = e.getAttributes('link').href as string | undefined
      const url = window.prompt('Enter URL:', prev ?? 'https://')
      if (url === null) return
      if (url === '') { e.chain().focus().extendMarkRange('link').unsetLink().run(); return }
      e.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    },
    active: e => e.isActive('link'),
  },
  clearFormatting: {
    type: 'action', id: 'clearFormatting', icon: Eraser, label: 'Clear Formatting',
    command: e => e.chain().focus().clearNodes().unsetAllMarks().run(),
    active:  () => false,
  },
}

function buildToolbar(keys: Schema['toolbar']): ToolbarItem[] {
  if (!keys?.length) return []
  return keys.flatMap(key => {
    if (key === '|') return [{ type: 'separator' } as ToolbarSeparator]
    const action = ACTIONS[key]
    return action ? [action] : []
  })
}

/* ─── Toolbar ─────────────────────────────────────────────────────── */

function EditorToolbar({ editor, items }: { editor: Editor; items: ToolbarItem[] }) {
  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-border/20 bg-muted/15 px-2 py-1.5 sm:px-2.5 sm:py-2"
      role="toolbar"
      aria-label="Text formatting toolbar"
    >
      {items.map((item, idx) => {
        if (item.type === 'separator') {
          return (
            <span
              key={`sep-${idx}`}
              className="mx-0.5 h-4 w-px shrink-0 bg-border/35"
              aria-hidden
            />
          )
        }

        const { id, icon: Icon, label, shortcut, command, active } = item
        const isActive = active(editor)
        const title = shortcut ? `${label} (${shortcut})` : label

        return (
          <button
            key={id}
            type="button"
            onMouseDown={e => { e.preventDefault(); command(editor) }}
            aria-pressed={isActive}
            aria-label={title}
            title={title}
            tabIndex={-1}
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              isActive
                ? 'bg-foreground/10 text-foreground'
                : 'text-muted-foreground/65 hover:bg-muted/60 hover:text-foreground/85',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </button>
        )
      })}
    </div>
  )
}

/* ─── Status bar ──────────────────────────────────────────────────── */

function EditorStatusBar({
  charCount,
  wordCount,
  maxLength,
}: {
  charCount: number
  wordCount: number
  maxLength?: number
}) {
  const isWarning = maxLength !== undefined && charCount > maxLength * 0.85
  const isOver    = maxLength !== undefined && charCount > maxLength

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border/15 bg-muted/10 px-3 py-1.5 sm:px-4">
      <span className="text-[11px] tabular-nums text-muted-foreground/45">
        {wordCount} {wordCount === 1 ? 'word' : 'words'}
      </span>

      <span
        className={cn(
          'text-[11px] tabular-nums transition-colors duration-200',
          isOver    ? 'font-medium text-destructive'
          : isWarning ? 'text-amber-500/75'
          : 'text-muted-foreground/45',
        )}
        aria-live="polite"
        aria-label={
          maxLength
            ? `${charCount} of ${maxLength} characters used`
            : `${charCount} characters`
        }
      >
        {maxLength
          ? `${charCount.toLocaleString()} / ${maxLength.toLocaleString()} characters`
          : `${charCount.toLocaleString()} characters`}
      </span>
    </div>
  )
}

/* ─── Core editor ─────────────────────────────────────────────────── */

function RichTextEditor({
  id,
  value,
  onChange,
  disabled,
  minHeight,
  toolbarItems,
  maxLength,
  placeholder,
  error,
}: {
  id: string
  value: string
  onChange: (val: string) => void
  disabled?: boolean
  minHeight: number
  toolbarItems: ToolbarItem[]
  maxLength?: number
  placeholder?: string
  error?: boolean
}) {
  const [charCount, setCharCount] = useState(0)
  const [wordCount, setWordCount] = useState(0)

  function updateStats(editor: Editor) {
    const text = editor.getText()
    setCharCount(text.length)
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0)
  }

  const editor = useEditor({
    extensions: [
      // StarterKit v3 already bundles Underline; exclude its built-in Link so
      // our custom LinkExt (openOnClick:false + Ctrl+K) is the sole link extension.
      StarterKit.configure({ link: false }),
      LinkExt,
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onCreate: ({ editor }) => updateStats(editor),
    onUpdate: ({ editor }) => {
      updateStats(editor)
      onChange(editor.getHTML())
    },
  })

  // Sync external value changes (form reset)
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value ?? '', false)
    }
  }, [value, editor])

  // Sync editable state
  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [disabled, editor])

  const showStatusBar = !disabled && (charCount > 0 || wordCount > 0 || maxLength !== undefined)

  return (
    <div
      id={id}
      className={cn(
        'overflow-hidden rounded-xl border border-border/70 bg-background',
        'shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200',
        'hover:border-border/90',
        'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/15 focus-within:shadow-[0_1px_4px_rgba(16,24,40,0.06)]',
        error && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/15',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {/* Toolbar */}
      {!disabled && toolbarItems.length > 0 && editor && (
        <EditorToolbar editor={editor} items={toolbarItems} />
      )}

      {/* Editor body */}
      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-sm max-w-none px-4 py-3 sm:px-5 sm:py-4',
          '[&_.ProseMirror]:outline-none',
          '[&_.ProseMirror]:min-h-24 sm:[&_.ProseMirror]:min-h-(--rte-min-h)',
          // Placeholder via Tiptap Placeholder extension data-placeholder attribute
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground/40',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          // Link styling
          '[&_.ProseMirror_a]:cursor-pointer [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline',
        )}
        style={{ '--rte-min-h': `${minHeight}px` } as React.CSSProperties}
      />

      {/* Status bar */}
      {showStatusBar && (
        <EditorStatusBar charCount={charCount} wordCount={wordCount} maxLength={maxLength} />
      )}
    </div>
  )
}

/* ─── Public field ────────────────────────────────────────────────── */

export function RichTextField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  const toolbarItems = useMemo(
    () => buildToolbar(schema.toolbar),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schema.toolbar?.join(',')],
  )

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => (
        <FieldWrapper
          schema={schema}
          error={fieldState.error?.message}
          disabled={disabled}
          readOnly={readOnly}
        >
          <RichTextEditor
            id={getFieldId(schema.key)}
            value={field.value ?? ''}
            onChange={field.onChange}
            disabled={disabled || readOnly}
            minHeight={schema.minHeight ?? 160}
            toolbarItems={toolbarItems}
            maxLength={schema.maxLength}
            placeholder={schema.placeholder}
            error={!!fieldState.error}
          />
        </FieldWrapper>
      )}
    />
  )
}
