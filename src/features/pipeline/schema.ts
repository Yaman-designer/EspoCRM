import { z } from 'zod'

export const pipelineSchema = z.object({
  // Agent section
  assignedUserId: z.string().optional(),
  teamsIds: z.array(z.string()).optional(),

  // Pipeline section
  contactsIds: z.string().min(1, 'Contact is required'),
  contactType: z.string().min(1, 'Contact type is required'),
  status2: z.string().optional(),
  dateStart: z.string().min(1, 'Date start is required'),
  description: z.string().optional(),
})

export type PipelineFormValues = z.infer<typeof pipelineSchema>
