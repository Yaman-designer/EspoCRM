'use client'

import { Users } from 'lucide-react'
import { DynamicForm } from '@/components/dynamic-form'
import { contactSchema } from './schema'
import { contactSections } from './fields'
import type { FormProps } from '@/components/data-table'
import type { Contact } from './types'

export function ContactForm({ open, onClose, onSuccess, initialData, mode }: FormProps<Contact>) {
  return (
    <DynamicForm<Contact>
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      title={mode === 'edit' ? 'Edit Contact' : 'Add New Contact'}
      description={
        mode === 'edit'
          ? 'Update contact details in your CRM.'
          : 'Create a new contact and add them to your CRM.'
      }
      icon={Users}
      sections={contactSections}
      schema={contactSchema}
      endpoint="/api/contacts"
      initialData={initialData}
      mode={mode}
    />
  )
}
