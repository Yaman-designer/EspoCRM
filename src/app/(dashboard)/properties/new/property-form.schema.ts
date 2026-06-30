import {
  BedDouble,
  Building2,
  Camera,
  CheckSquare2,
  CircleDollarSign,
  FileText,
  Globe,
  MapPin,
  Paintbrush,
  Paperclip,
  Ruler,
  Sofa,
  Sparkles,
  Wrench,
} from 'lucide-react'

import { field, section } from '@/framework/form-engine'
import type { StepSchema } from '@/framework/form-engine'

/* ─── Shared option sets ─────────────────────────────────────────── */

const PROPERTY_TYPES = [
  { value: 'apartment',  label: 'Apartment' },
  { value: 'villa',      label: 'Villa' },
  { value: 'townhouse',  label: 'Townhouse' },
  { value: 'penthouse',  label: 'Penthouse' },
  { value: 'duplex',     label: 'Duplex' },
  { value: 'studio',     label: 'Studio' },
  { value: 'office',     label: 'Office' },
  { value: 'retail',     label: 'Retail Space' },
  { value: 'warehouse',  label: 'Warehouse' },
  { value: 'land',       label: 'Land / Plot' },
  { value: 'building',   label: 'Full Building' },
]

const LISTING_TYPES = [
  { value: 'sale',       label: 'For Sale' },
  { value: 'rent',       label: 'For Rent' },
  { value: 'short-term', label: 'Short-term Rental' },
  { value: 'off-plan',   label: 'Off-plan / Pre-launch' },
]

const CURRENCIES = [
  { value: 'SAR', label: 'SAR – Saudi Riyal' },
  { value: 'AED', label: 'AED – Emirati Dirham' },
  { value: 'USD', label: 'USD – US Dollar' },
  { value: 'EUR', label: 'EUR – Euro' },
  { value: 'GBP', label: 'GBP – Pound Sterling' },
  { value: 'KWD', label: 'KWD – Kuwaiti Dinar' },
  { value: 'QAR', label: 'QAR – Qatari Riyal' },
]

const COUNTRIES = [
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'KW', label: 'Kuwait' },
  { value: 'QA', label: 'Qatar' },
  { value: 'BH', label: 'Bahrain' },
  { value: 'OM', label: 'Oman' },
  { value: 'EG', label: 'Egypt' },
  { value: 'JO', label: 'Jordan' },
  { value: 'LB', label: 'Lebanon' },
]

const BUILDING_AGE = [
  { value: 'new',   label: 'New / Off-plan' },
  { value: '0-5',   label: '0 – 5 years' },
  { value: '5-10',  label: '5 – 10 years' },
  { value: '10-20', label: '10 – 20 years' },
  { value: '20+',   label: 'Over 20 years' },
]

/* ─────────────────────────────────────────────────────────────────────
   Step 1: Basic Info
   Goal: classify the listing and write the description.
   3 sections × ≤4 fields each — minimal cognitive load.
──────────────────────────────────────────────────────────────────── */

export const basicsSchema: StepSchema = {
  sections: [
    /* 1A — Core classification: asset type and commercial intent */
    section({
      id: 'core-classification',
      title: 'Core Classification',
      description: 'Define the primary asset architecture and commercial intent.',
      icon: Building2,
    }).fields([
      field.text('displayName', 'Display Name')
        .required().full()
        .placeholder('e.g. Skyline Corporate Plaza')
        .helperText('Internal identifier for administrative records and portfolio tracking.')
        .build(),
      field.select('propertyType', 'Property Type')
        .required().half()
        .placeholder('Select type...')
        .options(PROPERTY_TYPES)
        .build(),
      field.select('listingCategory', 'Listing Category')
        .required().half()
        .placeholder('Select listing...')
        .options(LISTING_TYPES)
        .build(),
    ]),

    /* 1B — Status & lifecycle management */
    section({ id: 'status-lifecycle', title: 'Status & Lifecycle', icon: CheckSquare2 }).fields([
      field.radio('status', 'Listing Status', [
        { value: 'available',   label: 'Available' },
        { value: 'under-offer', label: 'Under Offer' },
        { value: 'reserved',    label: 'Reserved' },
        { value: 'sold-rented', label: 'Sold / Rented' },
      ])
        .full().layout('horizontal').default('available')
        .build(),
      field.text('referenceCode', 'Reference Code')
        .half()
        .placeholder('Auto-generated if left empty')
        .helperText('Unique identifier for this listing')
        .build(),
      field.text('externalRef', 'External Reference')
        .half()
        .placeholder('MLS or external system ID')
        .build(),
    ]),

    /* 1C — The elevator pitch */
    section({ id: 'description', title: 'Description', icon: FileText }).fields([
      field.richText('description', 'Property Description')
        .full()
        .minHeight(180)
        .maxLength(3000)
        .toolbar([
          'bold', 'italic', 'underline', 'strikethrough', '|',
          'heading2', 'heading3', '|',
          'list', 'orderedList', '|',
          'blockquote', 'link', 'clearFormatting',
        ])
        .placeholder("Describe the property's highlights, features, and value proposition.")
        .build(),
    ]),
  ],
}

/* ─────────────────────────────────────────────────────────────────────
   Step 2: Location
   Goal: specify exactly where this property is.
   3 sections — country→city→area, then street→building→unit, then map pin.
──────────────────────────────────────────────────────────────────── */

export const locationSchema: StepSchema = {
  sections: [
    /* 2A — Country, city, and area */
    section({ id: 'primary-location', title: 'Primary Location', icon: MapPin }).fields([
      field.select('country', 'Country')
        .required().half()
        .options(COUNTRIES)
        .build(),
      field.text('city', 'City')
        .required().half()
        .placeholder('e.g. Riyadh, Dubai')
        .build(),
      field.text('district', 'District / Area')
        .full()
        .placeholder('e.g. Al Olaya, Business Bay, Downtown')
        .build(),
    ]),

    /* 2B — Street, building, unit — the specific address */
    section({ id: 'building-unit', title: 'Building & Unit', icon: Building2 }).fields([
      field.text('street', 'Street')
        .half()
        .placeholder('Street name or number')
        .build(),
      field.text('building', 'Building / Block')
        .half()
        .placeholder('Building name or number')
        .build(),
      field.text('unitNumber', 'Unit / Apt No.')
        .half()
        .placeholder('e.g. 501')
        .build(),
      field.number('floorNumber', 'Floor No.')
        .half()
        .min(0).max(200)
        .build(),
    ]),

  ],
}

/* ─────────────────────────────────────────────────────────────────────
   Step 3: Property Details
   Goal: specify what's inside, how big, and what it costs.
   7 sections — each represents one distinct mental task.
   Sections 4–7 start collapsed to avoid overwhelming the page.
──────────────────────────────────────────────────────────────────── */

export const detailsSchema: StepSchema = {
  sections: [
    /* 3A — The rooms guests care most about */
    section({ id: 'main-rooms', title: 'Bedrooms & Living', icon: BedDouble }).fields([
      field.number('bedrooms', 'Bedrooms').quarter().min(0).max(20).default(0).build(),
      field.number('bathrooms', 'Bathrooms').quarter().min(0).max(20).default(0).build(),
      field.number('livingRooms', 'Living Rooms').quarter().min(0).max(10).default(0).build(),
      field.number('kitchens', 'Kitchens').quarter().min(0).max(10).default(0).build(),
    ]),

    /* 3B — Staff and utility rooms (secondary, collapsed) */
    section({
      id: 'service-rooms',
      title: 'Service Rooms',
      description: 'Maid, driver, and storage accommodation.',
      icon: Wrench,
      collapsible: true,
      defaultCollapsed: true,
    }).fields([
      field.number('maidRooms', "Maid's Rooms").quarter().min(0).max(5).default(0).build(),
      field.number('driverRooms', "Driver's Rooms").quarter().min(0).max(5).default(0).build(),
      field.number('guestRooms', 'Guest Rooms').quarter().min(0).max(10).default(0).build(),
      field.number('storageRooms', 'Storage Rooms').quarter().min(0).max(5).default(0).build(),
    ]),

    /* 3C — Square meterage */
    section({ id: 'sizing', title: 'Size & Area', icon: Ruler }).fields([
      field.number('totalArea', 'Total Area')
        .required().half().suffix('m²').min(1)
        .build(),
      field.number('builtUpArea', 'Built-up Area')
        .half().suffix('m²').min(1)
        .build(),
      field.number('plotArea', 'Plot / Land Area')
        .half().suffix('m²')
        .visibleWhen({
          field: 'propertyType',
          operator: 'in',
          value: ['villa', 'land', 'building', 'townhouse'],
        })
        .build(),
      field.number('balconyArea', 'Balcony / Terrace Area')
        .half().suffix('m²').min(0)
        .build(),
    ]),

    /* 3D — What the buyer pays */
    section({ id: 'pricing', title: 'Pricing', icon: CircleDollarSign }).fields([
      field.currency('price', 'Asking Price')
        .required().half()
        .build(),
      field.select('currency', 'Currency')
        .required().quarter()
        .options(CURRENCIES).default('SAR')
        .build(),
      field.number('serviceCharges', 'Service Charges')
        .quarter().suffix('/yr').min(0)
        .helperText('Annual community or maintenance fee')
        .build(),
      field.number('pricePerSqm', 'Price per m²')
        .half().suffix('m²').min(0)
        .helperText('Leave blank to calculate from price and total area')
        .build(),
    ]),

    /* 3E — Lifestyle features (collapsed) */
    section({
      id: 'facilities',
      title: 'Facilities',
      description: 'Building amenities and shared infrastructure.',
      icon: Sparkles,
      collapsible: true,
      defaultCollapsed: true,
    }).fields([
      field.switch('hasPool', 'Swimming Pool').third().build(),
      field.switch('hasGym', 'Gym / Fitness').third().build(),
      field.switch('hasSecurity', '24/7 Security').third().build(),
      field.switch('hasElevator', 'Elevator').third().build(),
      field.switch('hasConcierge', 'Concierge').third().build(),
      field.switch('hasBalcony', 'Balcony / Terrace').third().build(),
    ]),

    /* 3F — Finishing and lifestyle style (collapsed) */
    section({
      id: 'lifestyle',
      title: 'Lifestyle & Views',
      description: 'Furnishing, parking, views, and property tags.',
      icon: Sofa,
      collapsible: true,
      defaultCollapsed: true,
    }).fields([
      field.select('furnishing', 'Furnishing Status')
        .half()
        .options([
          { value: 'unfurnished',    label: 'Unfurnished' },
          { value: 'semi-furnished', label: 'Semi-furnished' },
          { value: 'furnished',      label: 'Fully Furnished' },
        ])
        .clearable()
        .build(),
      field.number('parkingSpaces', 'Parking Spaces')
        .quarter().min(0).max(20).default(0)
        .build(),
      field.select('parkingType', 'Parking Type')
        .quarter()
        .options([
          { value: 'covered',     label: 'Covered' },
          { value: 'outdoor',     label: 'Outdoor' },
          { value: 'underground', label: 'Underground' },
        ])
        .visibleWhen({ field: 'parkingSpaces', operator: 'gt', value: 0 })
        .build(),
      field.multiSelect('views', 'Views')
        .full()
        .options([
          { value: 'sea',      label: 'Sea View' },
          { value: 'city',     label: 'City View' },
          { value: 'garden',   label: 'Garden View' },
          { value: 'pool',     label: 'Pool View' },
          { value: 'mountain', label: 'Mountain View' },
          { value: 'desert',   label: 'Desert View' },
          { value: 'landmark', label: 'Landmark View' },
          { value: 'golf',     label: 'Golf View' },
        ])
        .build(),
      field.tags('tags', 'Property Tags')
        .full().creatable()
        .build(),
    ]),

    /* 3G — Building history and construction (collapsed) */
    section({
      id: 'construction',
      title: 'Construction',
      description: 'Age and structural characteristics of the building.',
      icon: Paintbrush,
      collapsible: true,
      defaultCollapsed: true,
    }).fields([
      field.number('yearBuilt', 'Year Built').half().min(1900).max(2030).build(),
      field.number('renovationYear', 'Last Renovation').half().min(1900).max(2030).build(),
      field.number('floorsInBuilding', 'Floors in Building').half().min(1).max(200).build(),
      field.select('buildingAge', 'Building Age')
        .half().options(BUILDING_AGE).clearable()
        .build(),
    ]),
  ],
}

/* ─────────────────────────────────────────────────────────────────────
   Step 4: Media
   Goal: upload photos, share links, attach documents.
   3 sections — gallery first (most important), then links, then docs.
──────────────────────────────────────────────────────────────────── */

export const mediaSchema: StepSchema = {
  sections: [
    /* 4A — The gallery is the hero of the listing */
    section({ id: 'gallery', title: 'Photo Gallery', icon: Camera }).fields([
      field.multiImage('images', 'Property Photos')
        .full()
        .maxFiles(30)
        .maxSize(10 * 1024 * 1024)
        .accept(['image/jpeg', 'image/png', 'image/webp'])
        .build(),
    ]),

    /* 4B — Immersive links */
    section({ id: 'virtual', title: 'Virtual & Video', icon: Globe }).fields([
      field.url('virtualTour', 'Virtual Tour URL')
        .half().placeholder('https://…').build(),
      field.url('videoUrl', 'Video URL')
        .half().placeholder('YouTube, Vimeo, or TikTok link').build(),
    ]),

    /* 4C — Supporting documents (collapsed) */
    section({
      id: 'documents',
      title: 'Documents',
      description: 'Floor plans and marketing materials for buyers.',
      icon: Paperclip,
      collapsible: true,
      defaultCollapsed: true,
    }).fields([
      field.file('floorPlan', 'Floor Plan')
        .half()
        .accept(['image/jpeg', 'image/png', 'application/pdf'])
        .maxSize(20 * 1024 * 1024)
        .build(),
      field.file('brochure', 'Brochure / Fact Sheet')
        .half()
        .accept(['application/pdf'])
        .maxSize(20 * 1024 * 1024)
        .build(),
    ]),
  ],
}
