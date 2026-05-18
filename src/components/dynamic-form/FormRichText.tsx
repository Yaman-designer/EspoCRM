'use client'

import type { ControllerRenderProps, FieldValues } from 'react-hook-form'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered, Undo, Redo } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FieldConfig } from './types'

interface FormRichTextProps {
  field: ControllerRenderProps<FieldValues, string>
  config: FieldConfig
}

export function FormRichText({ field, config }: FormRichTextProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: field.value ?? '',
    editable: !config.disabled && !config.readOnly,
    onUpdate: ({ editor }) => {
      field.onChange(editor.getHTML())
    },
    immediatelyRender: false,
  })

  if (!editor) return null

  const toolbarButtons = [
    { icon: Bold,         action: () => editor.chain().focus().toggleBold().run(),         active: editor.isActive('bold'),         title: 'Bold' },
    { icon: Italic,       action: () => editor.chain().focus().toggleItalic().run(),       active: editor.isActive('italic'),       title: 'Italic' },
    { icon: List,         action: () => editor.chain().focus().toggleBulletList().run(),   active: editor.isActive('bulletList'),   title: 'Bullet list' },
    { icon: ListOrdered,  action: () => editor.chain().focus().toggleOrderedList().run(),  active: editor.isActive('orderedList'),  title: 'Numbered list' },
  ]

  return (
    <div className={cn(
      'rounded-md border border-input bg-background',
      config.disabled && 'opacity-60',
    )}>
      <div className="flex items-center gap-0.5 border-b border-border/60 p-1.5">
        {toolbarButtons.map(({ icon: Icon, action, active, title }) => (
          <button
            key={title}
            type="button"
            title={title}
            onClick={action}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
        <div className="mx-1 h-4 w-px bg-border/60" />
        <button
          type="button"
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Undo className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Redo className="h-3.5 w-3.5" />
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-3 py-2.5 text-sm [&_.ProseMirror]:min-h-[100px] [&_.ProseMirror]:outline-none"
      />
    </div>
  )
}
