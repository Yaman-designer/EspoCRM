export type PropertyStatus = 'available' | 'pending' | 'sold-out' | 'rented'
export type PropertyType = 'house' | 'villa' | 'apartment' | 'townhouse' | 'office' | 'land'

export interface PropertyAgent {
  name: string
  title: string
  phone?: string
}

export interface PropertyActivity {
  label: string
  date: string
}

export interface Property {
  id: string
  title: string
  location: string
  price: number
  currency?: string
  type: PropertyType
  status: PropertyStatus
  area: number
  image?: string
  tag?: string
  units?: number
  occupiedUnits?: number
  // Detail fields
  description?: string
  amenities?: string[]
  agent?: PropertyAgent
  bedrooms?: number
  bathrooms?: number
  parking?: number
  floor?: number
  listedDate?: string
  activity?: PropertyActivity[]
}
