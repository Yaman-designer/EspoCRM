import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
  rememberMe: z.boolean().optional().default(false),
})

// We use z.input to get the input type (rememberMe is optional) instead of z.infer (outputs)
export type LoginInput = z.input<typeof loginSchema>
