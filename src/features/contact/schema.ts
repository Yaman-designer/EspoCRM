import { z } from 'zod'

export const contactSchema = z.object({
  firstName:    z.string().min(1, 'First name is required'),
  lastName:     z.string().min(1, 'Last name is required'),
  emailAddress: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phoneNumber:  z.string().optional(),
  accountId:    z.string().optional(),
  title:        z.string().optional(),
  assignedUserId: z.string().optional(),
  description:  z.string().max(2000).optional(),
})

export type ContactFormValues = z.infer<typeof contactSchema>