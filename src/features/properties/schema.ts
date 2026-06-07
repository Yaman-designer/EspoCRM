import { z } from 'zod'

export const propertySchema = z.object({
  title:          z.string().min(1, 'Property title is required'),
  propertyCode:   z.string().optional(),
  status:         z.string().min(1, 'Status is required'),
  type:           z.string().optional(),
  price:          z.coerce.number().positive('Price must be greater than 0').optional(),
  square:         z.coerce.number().positive('Area must be greater than 0').optional(),
  locationName:   z.string().optional(),
  addressCity:    z.string().optional(),
  bedroomCount:   z.coerce.number().int().nonnegative().optional(),
  bathroomCount:  z.coerce.number().int().nonnegative().optional(),
  assignedUserId: z.string().optional(),
  description:    z.string().optional(),
})

export type PropertyFormValues = z.infer<typeof propertySchema>
