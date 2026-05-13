import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, { message: 'اسم المستخدم مطلوب' }),
  password: z.string().min(1, { message: 'كلمة المرور مطلوبة' }),
  rememberMe: z.boolean().optional().default(false),
})

// نستخدم z.input للحصول على نوع المدخلات (rememberMe اختياري) بدل z.infer (المخرجات)
export type LoginInput = z.input<typeof loginSchema>
