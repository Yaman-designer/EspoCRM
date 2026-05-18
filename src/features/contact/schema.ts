import { z } from 'zod'

export const contactSchema = z.object({
  name:       z.string().min(1, 'Full name is required').max(100),
  email:      z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone:      z.string().optional(),
  company:    z.string().optional(),
  role:       z.string().optional(),
  status:     z.enum(['Active', 'Lead', 'On Hold', 'Inactive'], { error: 'Select a status' }),
  assignedTo: z.string().optional(),
  tags:       z.array(z.string()).optional(),
  notes:      z.string().max(2000).optional(),
})

export type ContactFormValues = z.infer<typeof contactSchema>
