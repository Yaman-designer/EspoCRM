'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import {
  Building2,
  FileText,
  ImageIcon,
  MapPin,
  ShieldCheck,
} from 'lucide-react'

import {
  FormFramework,
  FormStep,
  type FormFrameworkConfig,
} from '@/components/form-framework'

/* ─── Step placeholder content ──────────────────────────────────
   These will be replaced with real DynamicForm field sections
   once the field configuration is wired up.
───────────────────────────────────────────────────────────────── */

function FieldPlaceholder({
  label,
  wide,
  tall,
}: {
  label: string
  wide?: boolean
  tall?: boolean
}) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>
      <div
        className={[
          'rounded-lg border border-dashed border-border/70 bg-muted/30',
          tall ? 'h-28' : 'h-11',
        ].join(' ')}
      />
    </div>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="col-span-2 flex items-center gap-3 pt-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  )
}

/* ─── Step contents ──────────────────────────────────────────── */

function BasicInfoStep() {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-5">
      <FieldPlaceholder label="Property Name" />
      <FieldPlaceholder label="Reference #" />
      <FieldPlaceholder label="Property Type" />
      <FieldPlaceholder label="Listing Type" />
      <FieldPlaceholder label="Description" wide tall />
    </div>
  )
}

function LocationStep() {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-5">
      <FieldPlaceholder label="Country" />
      <FieldPlaceholder label="City" />
      <FieldPlaceholder label="District / Area" />
      <FieldPlaceholder label="Street" />
      <FieldPlaceholder label="Building / Block" />
      <FieldPlaceholder label="Floor" />
      <SectionDivider label="Geolocation" />
      <FieldPlaceholder label="Latitude" />
      <FieldPlaceholder label="Longitude" />
    </div>
  )
}

function PropertyDetailsStep() {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-5">
      <SectionDivider label="Size & Rooms" />
      <FieldPlaceholder label="Total Area (m²)" />
      <FieldPlaceholder label="Built-up Area (m²)" />
      <FieldPlaceholder label="Bedrooms" />
      <FieldPlaceholder label="Bathrooms" />
      <FieldPlaceholder label="Parking Spaces" />
      <FieldPlaceholder label="Floor Number" />
      <SectionDivider label="Pricing" />
      <FieldPlaceholder label="Price" />
      <FieldPlaceholder label="Currency" />
      <FieldPlaceholder label="Price per m²" />
      <FieldPlaceholder label="Service Charges / Year" />
    </div>
  )
}

function MediaStep() {
  return (
    <div className="space-y-6">
      {/* Upload zone placeholder */}
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <ImageIcon className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-foreground">Media upload area</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Image gallery, floor plans, and 360° media will render here
        </p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <FieldPlaceholder label="Virtual Tour URL" />
        <FieldPlaceholder label="Video URL" />
      </div>
    </div>
  )
}

function ReviewStep() {
  return (
    <div className="space-y-6">
      {/* Summary cards placeholder */}
      {['Basic Information', 'Location', 'Property Details', 'Media'].map((section) => (
        <div
          key={section}
          className="rounded-xl border border-border bg-muted/20 px-5 py-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
              {section}
            </span>
            <span className="text-xs text-primary/70 underline-offset-2 hover:underline cursor-pointer">
              Edit
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-0.5">
                <div className="h-2.5 w-16 rounded bg-border/80" />
                <div className="h-3 w-28 rounded bg-border/50" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Config ─────────────────────────────────────────────────── */

const config: FormFrameworkConfig = {
  title: 'New Property',
  subtitle: 'Add a new property listing to your portfolio. All required fields are marked.',
  entityLabel: 'Property',
  mode: 'create',
  breadcrumbs: [
    { label: 'Properties', href: '/properties' },
    { label: 'New Property' },
  ],
  steps: [
    {
      id: 'basics',
      title: 'Basic Info',
      description: 'The core identity of this property — name, type, and listing purpose.',
      icon: Building2,
    },
    {
      id: 'location',
      title: 'Location',
      description: 'Where is this property? Set the address and precise coordinates.',
      icon: MapPin,
    },
    {
      id: 'details',
      title: 'Details',
      description: 'Area, rooms, pricing, and specification data for this listing.',
      icon: FileText,
    },
    {
      id: 'media',
      title: 'Media',
      optional: true,
      description: 'Upload photos, floor plans, and virtual tour links.',
      icon: ImageIcon,
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Confirm everything looks correct before publishing.',
      icon: ShieldCheck,
    },
  ],
}

/* ─── Page component ─────────────────────────────────────────── */

export function PropertyFormPage() {
  const router = useRouter()

  // Placeholder form — field schemas are added per-step when fields are wired up
  const form = useForm<Record<string, unknown>>({
    defaultValues: {},
  })

  const handleSubmit = async (data: Record<string, unknown>) => {
    // Replace with real API call
    console.log('Submit:', data)
  }

  const handleSaveDraft = async (data: Record<string, unknown>) => {
    // Replace with real draft save
    console.log('Draft:', data)
  }

  return (
    <FormFramework
      config={config}
      form={form}
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      onCancel={() => router.back()}
    >
      <FormStep id="basics">
        <BasicInfoStep />
      </FormStep>

      <FormStep id="location">
        <LocationStep />
      </FormStep>

      <FormStep id="details">
        <PropertyDetailsStep />
      </FormStep>

      <FormStep id="media">
        <MediaStep />
      </FormStep>

      <FormStep id="review">
        <ReviewStep />
      </FormStep>
    </FormFramework>
  )
}
