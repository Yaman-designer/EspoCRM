import { Building2, MapPin, Settings2 } from 'lucide-react'
import type { FormSectionConfig } from '@/components/dynamic-form'

export const STATUS_OPTIONS = [
  { value: 'Available', label: 'Available' },
  { value: 'Pending',   label: 'Pending'   },
  { value: 'Sold',      label: 'Sold'      },
  { value: 'Draft',     label: 'Draft'     },
]

export const TYPE_OPTIONS = [
  { value: 'House',     label: 'House'      },
  { value: 'Villa',     label: 'Villa'      },
  { value: 'Apartment', label: 'Apartment'  },
  { value: 'Townhouse', label: 'Town House' },
  { value: 'Office',    label: 'Office'     },
  { value: 'Land',      label: 'Land'       },
]

export const propertySections: FormSectionConfig[] = [
  {
    key: 'identity',
    title: 'Property Details',
    icon: Building2,
    columns: 2,
    fields: [
      {
        name: 'title',
        label: 'Property Title',
        type: 'text',
        required: true,
        placeholder: 'e.g. Palm Haven Estate',
        colSpan: 2,
      },
      {
        name: 'propertyCode',
        label: 'Property Code',
        type: 'text',
        placeholder: 'e.g. REF-001',
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: STATUS_OPTIONS,
        placeholder: 'Select status…',
      },
      {
        name: 'type',
        label: 'Property Type',
        type: 'select',
        options: TYPE_OPTIONS,
        placeholder: 'Select type…',
      },
      {
        name: 'price',
        label: 'Price (USD)',
        type: 'currency',
        currency: '$',
        placeholder: '0',
        min: 0,
      },
      {
        name: 'square',
        label: 'Area (m²)',
        type: 'number',
        placeholder: '0',
        min: 0,
      },
    ],
  },
  {
    key: 'location',
    title: 'Location',
    icon: MapPin,
    columns: 2,
    fields: [
      {
        name: 'locationName',
        label: 'Location / District',
        type: 'text',
        placeholder: 'e.g. Downtown Dubai',
      },
      {
        name: 'addressCity',
        label: 'City',
        type: 'text',
        placeholder: 'e.g. Dubai',
      },
    ],
  },
  {
    key: 'specs',
    title: 'Specifications',
    columns: 2,
    fields: [
      { name: 'bedroomCount',  label: 'Bedrooms',  type: 'number', placeholder: '0', min: 0 },
      { name: 'bathroomCount', label: 'Bathrooms', type: 'number', placeholder: '0', min: 0 },
    ],
  },
  {
    key: 'crm',
    title: 'CRM Settings',
    icon: Settings2,
    columns: 2,
    fields: [
      {
        name: 'assignedUserId',
        label: 'Assigned Agent',
        type: 'select',
        resource: 'users',
        placeholder: 'Select agent…',
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        rows: 3,
        colSpan: 2,
        placeholder: 'Property description…',
      },
    ],
  },
]
