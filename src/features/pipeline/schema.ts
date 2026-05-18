import { z } from 'zod'

export const pipelineSchema = z.object({
  assignedUserId: z.string().min(1, 'Assigned user is required'),
})

export type PipelineFormValues = z.infer<typeof pipelineSchema>
