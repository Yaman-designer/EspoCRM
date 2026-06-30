'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import {
  Building2,
  ImageIcon,
  MapPin,
} from 'lucide-react'

import {
  FormFramework,
  FormStep,
  type FormFrameworkConfig,
} from '@/components/form-framework'
import { DynamicForm } from '@/framework/form-engine'

import {
  basicsSchema,
  locationSchema,
  mediaSchema,
} from './property-form.schema'

/* ─── Config ─────────────────────────────────────────────────────── */

const config: FormFrameworkConfig = {
  title: 'New Property Listing',
  subtitle: 'Define the core identity, location, and media for this asset.',
  entityLabel: 'Property',
  mode: 'create',
  totalPhasesCount: 5,
  breadcrumbs: [
    { label: 'Properties', href: '/properties' },
    { label: 'New Property' },
  ],
  steps: [
    {
      id: 'basics',
      title: 'Basic Info',
      displayTitle: 'Basic Information',
      description:
        'Initialize the listing profile by defining core asset details and marketing classification for the system repository.',
      icon: Building2,
      requiredCount: 4,
      estTime: '4 min',
      completion: 20,
    },
    {
      id: 'location',
      title: 'Location',
      displayTitle: 'Location Details',
      description:
        'Specify the geographic coordinates and civic address for this asset within the property registry.',
      icon: MapPin,
      requiredCount: 3,
      estTime: '3 min',
      completion: 50,
    },
    {
      id: 'media',
      title: 'Media',
      displayTitle: 'Media & Assets',
      description:
        'Upload high-resolution imagery, floor plans, and virtual tour links for the listing gallery.',
      icon: ImageIcon,
      optional: true,
      requiredCount: 0,
      estTime: '5 min',
      completion: 80,
    },
  ],
}

/* ─── Page component ─────────────────────────────────────────────── */

export function PropertyFormPage() {
  const router = useRouter()

  const form = useForm<Record<string, unknown>>({
    defaultValues: {},
  })

  const handleSubmit = async (data: Record<string, unknown>) => {
    console.log('Submit:', data)
  }

  const handleSaveDraft = async (data: Record<string, unknown>) => {
    console.log('Draft:', data)
  }

  return (
    <div className="-mx-4 -mt-4 sm:mx-0 sm:mt-0">
    <FormFramework
      config={config}
      form={form}
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      onCancel={() => router.back()}
    >
      <FormStep id="basics">
        <DynamicForm schema={basicsSchema} form={form} />
      </FormStep>

      <FormStep id="location">
        <DynamicForm schema={locationSchema} form={form} />
      </FormStep>

      <FormStep id="media">
        <DynamicForm schema={mediaSchema} form={form} />
      </FormStep>
    </FormFramework>
    </div>
  )
}
